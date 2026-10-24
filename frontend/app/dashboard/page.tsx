"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { apiRequest } from "@/lib/api";

type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
    company_id: string | null;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
};

type InterviewSummary = {
  id: string;
  title: string;
  time_limit_min: number;
  expires_at: string;
  created_at: string;
  status_counts: Record<string, number>;
};

export default function DashboardPage() {
  const { getToken, isLoaded } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<MeResponse["company"]>(null);
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);

  // Create Company state
  const [companyName, setCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Create Interview state
  const [title, setTitle] = useState("");
  const [questionsRaw, setQuestionsRaw] = useState(
    "Brief background and primary tech stack. || Breadth and clarity\nExplain synchronous vs asynchronous execution. || Event loop and non-blocking I/O\nDescribe a challenging debugging experience. || Systematic problem solving"
  );
  const [timeLimitMin, setTimeLimitMin] = useState(15);
  const [expiresAt, setExpiresAt] = useState("2026-12-31T23:59");
  const [creatingInterview, setCreatingInterview] = useState(false);

  // Load initial data
  useEffect(() => {
    // Wait for Clerk to finish loading before calling getToken().
    // Without this guard, getToken() returns null on the first render
    // because the session cookie hasn't been read yet.
    if (!isLoaded) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const meData = await apiRequest<MeResponse>("/api/me", "GET", token);
        setCompany(meData.company);

        if (meData.company) {
          const interviewList = await apiRequest<InterviewSummary[]>(
            "/api/interviews",
            "GET",
            token
          );
          setInterviews(interviewList);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [getToken, isLoaded]);

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    setCreatingCompany(true);
    setError(null);
    try {
      const token = await getToken();
      const newCompany = await apiRequest<MeResponse["company"]>(
        "/api/companies",
        "POST",
        token,
        { name: companyName.trim() }
      );
      setCompany(newCompany);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      setCreatingCompany(false);
    }
  }

  async function handleCreateInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    // Parse questions: one per line, with optional rubric after ' || '
    // Step 1: Split by newline
    const lines = questionsRaw.split("\n");
    const parsedQuestions: { text: string; rubric: string | null }[] = [];

    // Step 2: Use plain for loop
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 0) {
        if (line.includes("||")) {
          const parts = line.split("||");
          const qText = parts[0].trim();
          const qRubric = parts[1].trim();
          parsedQuestions.push({
            text: qText,
            rubric: qRubric.length > 0 ? qRubric : null,
          });
        } else {
          parsedQuestions.push({
            text: line,
            rubric: null,
          });
        }
      }
    }

    if (parsedQuestions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    setCreatingInterview(true);
    setError(null);
    try {
      const token = await getToken();
      const expiresIso = new Date(expiresAt).toISOString();
      await apiRequest<InterviewSummary>("/api/interviews", "POST", token, {
        title: title.trim(),
        questions: parsedQuestions,
        expires_at: expiresIso,
        time_limit_min: Number(timeLimitMin),
      });

      // Refresh interview list
      const updatedList = await apiRequest<InterviewSummary[]>(
        "/api/interviews",
        "GET",
        token
      );
      setInterviews(updatedList);
      setTitle("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create interview");
    } finally {
      setCreatingInterview(false);
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-neutral-500">Loading dashboard...</p>;
  }

  return (
    <div className="py-6 flex flex-col gap-8">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* State 1: User has no company yet */}
      {!company ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 max-w-lg mx-auto w-full">
          <h2 className="text-xl font-bold mb-2">Create Your Company</h2>
          <p className="text-sm text-neutral-600 mb-4">
            You must create a company workspace to create interviews and invite candidates.
          </p>
          <form onSubmit={handleCreateCompany} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Inc."
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={creatingCompany}
              className="rounded-md bg-neutral-900 px-4 py-2 text-white font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {creatingCompany ? "Creating..." : "Create Company"}
            </button>
          </form>
        </div>
      ) : (
        /* State 2: Recruiter has a company */
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-950">
                {company.name} Dashboard
              </h1>
              <p className="text-sm text-neutral-500">Manage technical interviews</p>
            </div>
          </div>

          {/* Create Interview Form */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-bold mb-4">Create New Interview</h2>
            <form onSubmit={handleCreateInterview} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Job / Role Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Questions (one per line, format: Question text || Rubric)
                </label>
                <textarea
                  required
                  rows={4}
                  value={questionsRaw}
                  onChange={(e) => setQuestionsRaw(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 p-3 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    required
                    value={timeLimitMin}
                    onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Expiration Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingInterview}
                className="self-start rounded-md bg-neutral-900 px-5 py-2 text-white font-medium hover:bg-neutral-800 disabled:opacity-50"
              >
                {creatingInterview ? "Creating..." : "Create Interview Template"}
              </button>
            </form>
          </div>

          {/* List of Interviews */}
          <div>
            <h2 className="text-lg font-bold mb-4">Interviews</h2>
            {interviews.length === 0 ? (
              <p className="text-sm text-neutral-500">No interviews created yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {interviews.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-neutral-200 bg-white p-5 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-base">
                        {item.title}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        Time limit: {item.time_limit_min} mins · Expires:{" "}
                        {new Date(item.expires_at).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="bg-neutral-100 px-2 py-0.5 rounded">
                          Invited: {item.status_counts["invited"] || 0}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          In Progress: {item.status_counts["in_progress"] || 0}
                        </span>
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                          Scored: {item.status_counts["scored"] || 0}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/interviews/${item.id}`}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                    >
                      View & Invite
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

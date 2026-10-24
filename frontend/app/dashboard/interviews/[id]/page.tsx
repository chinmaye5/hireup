"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiRequest } from "@/lib/api";

type Question = {
  text: string;
  rubric: string | null;
};

type AttemptSummary = {
  id: string;
  email: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  overall_score: number | null;
  recommendation: string | null;
  summary: string | null;
};

type InterviewDetail = {
  id: string;
  company_id: string;
  title: string;
  questions: Question[];
  time_limit_min: number;
  expires_at: string;
  created_at: string;
  attempts: AttemptSummary[];
};

type InviteResponse = {
  created: string[];
  skipped: string[];
};

export default function InterviewDetailPage() {
  const params = useParams();
  const interviewId = params.id as string;
  const { getToken } = useAuth();

  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite candidate state
  const [emailsText, setEmailsText] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);

  // Reset attempt state
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadInterview() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiRequest<InterviewDetail>(
        `/api/interviews/${interviewId}`,
        "GET",
        token
      );
      setInterview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load interview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (interviewId) {
      loadInterview();
    }
  }, [interviewId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!emailsText.trim()) return;

    // Split emails by commas or newlines
    const rawTokens = emailsText.split(/[\n,]+/);
    const parsedEmails: string[] = [];
    for (let i = 0; i < rawTokens.length; i++) {
      const em = rawTokens[i].trim();
      if (em.length > 0) {
        parsedEmails.push(em);
      }
    }

    if (parsedEmails.length === 0) return;

    setInviting(true);
    setError(null);
    setInviteResult(null);
    try {
      const token = await getToken();
      const res = await apiRequest<InviteResponse>(
        `/api/interviews/${interviewId}/invites`,
        "POST",
        token,
        { emails: parsedEmails }
      );
      setInviteResult(res);
      setEmailsText("");
      // Reload attempts list
      await loadInterview();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to invite candidates");
    } finally {
      setInviting(false);
    }
  }

  async function handleReset(attemptId: string) {
    if (!confirm("Are you sure you want to reset this attempt? The candidate will be able to retry.")) {
      return;
    }
    setResettingId(attemptId);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/attempts/${attemptId}/reset`, "POST", token);
      await loadInterview();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset attempt");
    } finally {
      setResettingId(null);
    }
  }

  function copyCandidateLink(attemptId: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/interview/${attemptId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(attemptId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return <p className="py-12 text-center text-neutral-500">Loading interview...</p>;
  }

  if (!interview) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 mb-4">{error || "Interview not found"}</p>
        <Link href="/dashboard" className="text-sm underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-8">
      <div>
        <Link href="/dashboard" className="text-xs text-neutral-500 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-neutral-950 mt-2">{interview.title}</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Time limit: {interview.time_limit_min} mins · Expires:{" "}
          {new Date(interview.expires_at).toLocaleString()}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Invite Candidates Box */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-bold mb-2">Invite Candidates</h2>
        <p className="text-xs text-neutral-500 mb-4">
          Enter candidate emails (separated by commas or new lines). Each candidate gets a private link.
        </p>
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <textarea
            required
            rows={3}
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            placeholder="candidate1@example.com&#10;candidate2@example.com"
            className="w-full rounded-md border border-neutral-300 p-3 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={inviting}
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-xs text-white font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {inviting ? "Inviting..." : "Send Invites"}
          </button>
        </form>

        {inviteResult && (
          <div className="mt-4 text-xs">
            {inviteResult.created.length > 0 && (
              <p className="text-green-700">
                Created {inviteResult.created.length} new invite(s):{" "}
                {inviteResult.created.join(", ")}
              </p>
            )}
            {inviteResult.skipped.length > 0 && (
              <p className="text-neutral-500 mt-1">
                Skipped {inviteResult.skipped.length} existing invite(s):{" "}
                {inviteResult.skipped.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Candidate Attempts Table */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-bold mb-4">Candidate Attempts</h2>
        {interview.attempts.length === 0 ? (
          <p className="text-sm text-neutral-500">No candidates invited yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-neutral-50 text-neutral-600">
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Recommendation</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interview.attempts.map((att) => (
                  <tr key={att.id} className="border-b hover:bg-neutral-50">
                    <td className="py-3 px-3 font-medium text-neutral-900">{att.email}</td>
                    <td className="py-3 px-3">
                      <span className="capitalize">{att.status}</span>
                    </td>
                    <td className="py-3 px-3">
                      {att.overall_score !== null ? `${att.overall_score} / 10` : "—"}
                    </td>
                    <td className="py-3 px-3">
                      {att.recommendation ? (
                        <span className="capitalize font-medium">{att.recommendation}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3 flex items-center gap-2">
                      <button
                        onClick={() => copyCandidateLink(att.id)}
                        className="rounded border border-neutral-300 px-2 py-1 text-neutral-700 hover:bg-neutral-100"
                      >
                        {copiedId === att.id ? "Copied!" : "Copy Link"}
                      </button>
                      <Link
                        href={`/dashboard/attempts/${att.id}`}
                        className="rounded border border-neutral-300 px-2 py-1 text-neutral-700 hover:bg-neutral-100"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleReset(att.id)}
                        disabled={resettingId === att.id}
                        className="rounded border border-red-200 text-red-600 px-2 py-1 hover:bg-red-50 disabled:opacity-50"
                      >
                        {resettingId === att.id ? "Resetting..." : "Reset"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

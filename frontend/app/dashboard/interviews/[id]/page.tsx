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
  const { getToken, isLoaded } = useAuth();

  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite candidate state
  const [emailsText, setEmailsText] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);

  // Reset attempt state
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Delete attempt state
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);

  // Copy candidate link state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !interviewId) return;

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

    loadInterview();
  }, [interviewId, getToken, isLoaded]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!emailsText.trim()) return;

    const emails = emailsText
      .split(/[\n,]+/)
      .map((em) => em.trim())
      .filter((em) => em.length > 0);

    if (emails.length === 0) return;

    setInviting(true);
    setError(null);
    setInviteResult(null);

    try {
      const token = await getToken();
      const res = await apiRequest<InviteResponse>(
        `/api/interviews/${interviewId}/invites`,
        "POST",
        token,
        { emails }
      );
      setInviteResult(res);
      setEmailsText("");

      // Refresh interview data
      const refreshed = await apiRequest<InterviewDetail>(
        `/api/interviews/${interviewId}`,
        "GET",
        token
      );
      setInterview(refreshed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to invite candidates");
    } finally {
      setInviting(false);
    }
  }

  async function handleReset(attemptId: string) {
    setResettingId(attemptId);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/attempts/${attemptId}/reset`, "POST", token);
      setInterview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attempts: prev.attempts.map((a) =>
            a.id === attemptId ? { ...a, status: "invited", overall_score: null } : a
          ),
        };
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset attempt");
    } finally {
      setResettingId(null);
    }
  }

  async function handleDeleteAttempt(attemptId: string, email: string) {
    if (!confirm(`Are you sure you want to remove the interview invite for ${email}?`)) {
      return;
    }
    setDeletingAttemptId(attemptId);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/attempts/${attemptId}`, "DELETE", token);
      setInterview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attempts: prev.attempts.filter((a) => a.id !== attemptId),
        };
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete candidate invite");
    } finally {
      setDeletingAttemptId(null);
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
    return (
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-950 dark:border-t-white rounded-full animate-spin" />
        <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
          Loading interview…
        </p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-16 text-center space-y-4">
        <p className="text-[13px] font-mono text-red-600 dark:text-red-400">{error || "Interview not found"}</p>
        <Link href="/dashboard" className="text-[13px] font-medium text-neutral-950 dark:text-white underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 space-y-8">
      {/* ── Breadcrumb & Header ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <Link
          href="/dashboard"
          className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors"
        >
          &larr; Return to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
          {interview.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] font-mono text-neutral-500 dark:text-neutral-400">
          <span>LIMIT: <strong className="font-semibold text-neutral-950 dark:text-white tabular-nums">{interview.time_limit_min} MIN</strong></span>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span>EXPIRES: <strong className="font-semibold text-neutral-950 dark:text-white">{new Date(interview.expires_at).toLocaleDateString()}</strong></span>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span>QUESTIONS: <strong className="font-semibold text-neutral-950 dark:text-white tabular-nums">{interview.questions.length}</strong></span>
        </div>
      </div>

      {error && (
        <div className="border-l-2 border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 p-3 text-[12px] font-mono">
          {error}
        </div>
      )}

      {/* ── Two Column Layout: Invite + Questions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Dispatch Form */}
        <div className="lg:col-span-5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
              Candidate Access
            </p>
            <h2 className="mt-1 text-base font-semibold text-neutral-950 dark:text-white">
              Dispatch Invitations
            </h2>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400 mb-2">
                Candidate Emails
              </label>
              <textarea
                required
                rows={4}
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                placeholder={"candidate1@domain.com\ncandidate2@domain.com"}
                className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-mono text-[12px] text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
              />
              <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                Separated by newlines or commas.
              </p>
            </div>

            <button
              type="submit"
              disabled={inviting}
              className="w-full h-9 text-[13px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {inviting ? "Sending…" : "Send Invites"}
            </button>
          </form>

          {inviteResult && (
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[12px] space-y-1">
              {inviteResult.created.length > 0 && (
                <p className="font-medium text-neutral-950 dark:text-white">
                  Created: <span className="tabular-nums font-mono">{inviteResult.created.length}</span>
                </p>
              )}
              {inviteResult.skipped.length > 0 && (
                <p className="text-neutral-500 dark:text-neutral-400">
                  Skipped: <span className="tabular-nums font-mono">{inviteResult.skipped.length}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Question Rubric Spec */}
        <div className="lg:col-span-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
              Evaluation Spec
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-neutral-950 dark:text-white">
              Prompt Questions & Rubrics
            </h2>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {interview.questions.map((q, idx) => (
              <div key={idx} className="p-4 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[13px] font-medium text-neutral-950 dark:text-white leading-snug">
                    {q.text}
                  </p>
                </div>
                {q.rubric && (
                  <p className="ml-6 text-[12px] font-mono text-neutral-500 dark:text-neutral-400">
                    Criterion: {q.rubric}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Candidate Attempts Table ── */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
            Candidate Submissions
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-neutral-950 dark:text-white">
            Interview Attempts ({interview.attempts.length})
          </h2>
        </div>

        {interview.attempts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-neutral-400 dark:text-neutral-500">
              No candidates have been invited to this role yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-950/50">
                  <th className="py-2.5 px-4 font-semibold">Email</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Score</th>
                  <th className="py-2.5 px-4 font-semibold">Recommendation</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {interview.attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-950 dark:text-white">
                      {att.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            att.status === "scored"
                              ? "bg-emerald-500"
                              : att.status === "in_progress"
                              ? "bg-blue-500"
                              : att.status === "invited"
                              ? "bg-neutral-400"
                              : "bg-amber-500"
                          }`}
                        />
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums font-mono text-neutral-950 dark:text-white">
                      {att.overall_score !== null ? (
                        <span>{att.overall_score}<span className="text-neutral-400 text-[11px]">/10</span></span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {att.recommendation ? (
                        <span className="text-[11px] font-mono uppercase text-neutral-950 dark:text-white">
                          {att.recommendation}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => copyCandidateLink(att.id)}
                          className="h-7 px-2.5 text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-white transition-colors"
                        >
                          {copiedId === att.id ? "Copied" : "Copy"}
                        </button>
                        <Link
                          href={`/dashboard/attempts/${att.id}`}
                          className="h-7 px-2.5 text-[11px] font-medium inline-flex items-center border border-neutral-200 dark:border-neutral-700 text-neutral-950 dark:text-white hover:border-neutral-900 dark:hover:border-white transition-colors"
                        >
                          Report
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleReset(att.id)}
                          disabled={resettingId === att.id}
                          className="h-7 px-2.5 text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-white transition-colors disabled:opacity-40"
                        >
                          {resettingId === att.id ? "…" : "Reset"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttempt(att.id, att.email)}
                          disabled={deletingAttemptId === att.id}
                          className="h-7 px-2.5 text-[11px] font-medium border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          {deletingAttemptId === att.id ? "…" : "Delete"}
                        </button>
                      </div>
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

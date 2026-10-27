"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { apiRequest } from "@/lib/api";

type CandidateAttempt = {
  attempt_id: string;
  company_name: string;
  interview_title: string;
  status: string;
  time_limit_min: number;
  expires_at: string;
  created_at: string;
};

export default function MyInterviewsPage() {
  const { getToken, isLoaded } = useAuth();

  const [attempts, setAttempts] = useState<CandidateAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    async function loadMyAttempts() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const data = await apiRequest<CandidateAttempt[]>(
          "/api/my-attempts",
          "GET",
          token
        );
        setAttempts(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load interviews");
      } finally {
        setLoading(false);
      }
    }

    loadMyAttempts();
  }, [getToken, isLoaded]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-24 flex flex-col items-center justify-center gap-3 w-full">
        <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-950 dark:border-t-white rounded-full animate-spin" />
        <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
          Loading assigned interviews…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8 w-full">
      {/* ── Page Header ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
          Candidate Portal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
          My Interviews
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          Voice interviews dispatched to your verified email addresses.
        </p>
      </div>

      {error && (
        <div className="border-l-2 border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 p-3 text-[12px] font-mono">
          {error}
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-16 text-center">
          <p className="text-[13px] text-neutral-400 dark:text-neutral-500">
            No interview invitations found for your verified email address.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((att) => (
            <div
              key={att.attempt_id}
              className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 transition-colors hover:border-neutral-400 dark:hover:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                    {att.company_name}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700 select-none">/</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        att.status === "invited"
                          ? "bg-emerald-500 animate-pulse"
                          : att.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-neutral-400"
                      }`}
                    />
                    <span className="capitalize">{att.status}</span>
                  </span>
                </div>

                <h2 className="text-base font-semibold text-neutral-950 dark:text-white truncate">
                  {att.interview_title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-[12px] font-mono text-neutral-500 dark:text-neutral-400 pt-0.5">
                  <span>LIMIT: <strong className="font-semibold text-neutral-950 dark:text-white tabular-nums">{att.time_limit_min} MIN</strong></span>
                  <span className="text-neutral-300 dark:text-neutral-700">·</span>
                  <span>EXPIRES: <strong className="font-semibold text-neutral-950 dark:text-white">{new Date(att.expires_at).toLocaleDateString()}</strong></span>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                {att.status === "invited" ? (
                  <Link
                    href={`/interview/${att.attempt_id}`}
                    className="h-9 px-4 text-[13px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity inline-flex items-center justify-center"
                  >
                    Start Interview &rarr;
                  </Link>
                ) : (
                  <span className="h-8 px-3 text-[11px] font-mono uppercase tracking-wider border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 inline-flex items-center bg-neutral-50 dark:bg-neutral-950">
                    {att.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

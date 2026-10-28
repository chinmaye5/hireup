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

  // Derived metrics
  const readyCount = attempts.filter((a) => a.status === "invited").length;
  const inProgressCount = attempts.filter((a) => a.status === "in_progress").length;
  const completedCount = attempts.filter((a) => a.status === "scored").length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-24 flex flex-col items-center justify-center gap-3 w-full">
        <div className="w-5 h-5 border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-neutral-600 dark:text-neutral-400 font-medium">
          Loading assigned interviews…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8 w-full">
      {/* ── Page Header ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">
          Candidate Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
          My Interviews
        </h1>
        <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
          Voice interviews dispatched to your verified email address. Take your interview anytime before expiration.
        </p>
      </div>

      {error && (
        <div className="border-l-2 border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 p-3 text-[12px] font-mono">
          {error}
        </div>
      )}

      {/* ── Summary Stats Strip ── */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 border-t-2 border-t-indigo-600 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600 dark:text-neutral-400">
              Total Assigned
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-950 dark:text-white">
              {attempts.length}
            </p>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 border-t-2 border-t-emerald-500 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">
              Ready to Start
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {readyCount}
            </p>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 border-t-2 border-t-blue-500 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700 dark:text-blue-400">
              In Progress / Scored
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {inProgressCount + completedCount}
            </p>
          </div>
        </div>
      )}

      {/* ── Attempts List ── */}
      {attempts.length === 0 ? (
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center border-t-2 border-t-indigo-600 shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0v-6a3 3 0 0 0-3-3z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-neutral-950 dark:text-white">
            No Interview Invitations Found
          </h3>
          <p className="mt-1.5 text-[13px] text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            When a recruiter dispatches a technical interview session to your email address, it will automatically appear here with a direct voice launch link.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
            <span>Signed in with your registered candidate email</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((att) => {
            const isInvited = att.status === "invited";
            const isInProgress = att.status === "in_progress";
            const isScored = att.status === "scored";

            // Status border accent
            const borderAccent = isInvited
              ? "border-t-2 border-t-emerald-500"
              : isInProgress
              ? "border-t-2 border-t-blue-500"
              : "border-t-2 border-t-indigo-500";

            // Company initial
            const companyInitial = att.company_name ? att.company_name.charAt(0).toUpperCase() : "C";

            return (
              <div
                key={att.attempt_id}
                className={`border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 transition-all hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs ${borderAccent}`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Company Avatar Box */}
                  <div className="w-10 h-10 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm shrink-0">
                    {companyInitial}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-800 dark:text-neutral-200">
                        {att.company_name}
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-700 select-none">/</span>
                      
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold border ${
                          isInvited
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                            : isInProgress
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60"
                            : isScored
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isInvited
                              ? "bg-emerald-500 animate-pulse"
                              : isInProgress
                              ? "bg-blue-500"
                              : isScored
                              ? "bg-indigo-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span className="capitalize">{att.status}</span>
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-neutral-950 dark:text-white truncate">
                      {att.interview_title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-[12px] font-mono text-neutral-600 dark:text-neutral-400 pt-1">
                      <span>
                        DURATION: <strong className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{att.time_limit_min} MIN</strong>
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-700">·</span>
                      <span>
                        EXPIRES: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{new Date(att.expires_at).toLocaleDateString()}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action CTA */}
                <div className="shrink-0 flex items-center justify-end">
                  {isInvited ? (
                    <Link
                      href={`/interview/${att.attempt_id}`}
                      className="h-9 px-5 text-[13px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20 active:translate-y-px transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      Start Interview &rarr;
                    </Link>
                  ) : isInProgress ? (
                    <Link
                      href={`/interview/${att.attempt_id}`}
                      className="h-9 px-5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm active:translate-y-px transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      Resume Interview &rarr;
                    </Link>
                  ) : (
                    <span className="h-8 px-3 text-[11px] font-mono font-semibold uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 inline-flex items-center bg-neutral-50 dark:bg-neutral-850">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

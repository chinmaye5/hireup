"use client";

import Link from "next/link";
import { InterviewSummary, InterviewDetailResponse, InviteResponse } from "./types";

type CandidateInvitesViewProps = {
  interviews: InterviewSummary[];
  selectedInterviewId: string;
  setSelectedInterviewId: (id: string) => void;
  selectedInterviewDetail: InterviewDetailResponse | null;
  loadingDetail: boolean;
  inviteEmailsText: string;
  setInviteEmailsText: (value: string) => void;
  sendingInvites: boolean;
  inviteResult: InviteResponse | null;
  copiedAttemptId: string | null;
  onSendInvites: (e: React.FormEvent) => void;
  onCopyLink: (attemptId: string) => void;
  onGoToCreate: () => void;
};

export default function CandidateInvitesView({
  interviews,
  selectedInterviewId,
  setSelectedInterviewId,
  selectedInterviewDetail,
  loadingDetail,
  inviteEmailsText,
  setInviteEmailsText,
  sendingInvites,
  inviteResult,
  copiedAttemptId,
  onSendInvites,
  onCopyLink,
  onGoToCreate,
}: CandidateInvitesViewProps) {
  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">
          Distribution
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Candidate Invites
        </h1>
        <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
          Dispatch unique voice interview sessions and monitor completion status in real-time.
        </p>
      </div>

      {interviews.length === 0 ? (
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center border-t-2 border-t-indigo-600">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
            No active interview templates found. An interview template is required prior to inviting candidates.
          </p>
          <button
            type="button"
            onClick={onGoToCreate}
            className="mt-4 h-8 px-4 text-[13px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Create Interview Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Form Column (5 cols) ── */}
          <div className="lg:col-span-5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 border-t-2 border-t-indigo-600 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">
                Dispatch Form
              </p>
              <h2 className="mt-1 text-base font-bold text-neutral-950 dark:text-white">
                Send New Invitation
              </h2>
            </div>

            <form onSubmit={onSendInvites} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Role
                </label>
                <select
                  value={selectedInterviewId}
                  onChange={(e) => setSelectedInterviewId(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-[13px] text-neutral-950 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                >
                  {interviews.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300 mb-2">
                  Candidate Emails
                </label>
                <textarea
                  rows={4}
                  required
                  value={inviteEmailsText}
                  onChange={(e) => setInviteEmailsText(e.target.value)}
                  placeholder={"candidate1@domain.com\ncandidate2@domain.com"}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-mono text-[12px] text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                />
                <p className="mt-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                  Separated by newlines or commas.
                </p>
              </div>

              <button
                type="submit"
                disabled={sendingInvites}
                className="w-full h-9 text-[13px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-40 transition-all"
              >
                {sendingInvites ? "Dispatching…" : "Dispatch Invites"}
              </button>
            </form>

            {inviteResult && (
              <div className="p-3 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-[12px] space-y-1">
                <p className="font-semibold text-indigo-900 dark:text-indigo-200">
                  Created: <span className="tabular-nums font-mono text-indigo-700 dark:text-indigo-300 font-bold">{inviteResult.created.length}</span>
                </p>
                {inviteResult.skipped.length > 0 && (
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Already invited (skipped): <span className="tabular-nums font-mono font-medium">{inviteResult.skipped.length}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Right Attempts Table (7 cols) ── */}
          <div className="lg:col-span-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 border-t-2 border-t-blue-600 shadow-sm">
            {/* Table Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600 dark:text-blue-400">
                  Session Log
                </p>
                <h2 className="mt-0.5 text-base font-bold text-neutral-950 dark:text-white truncate">
                  {selectedInterviewDetail?.title || "Candidate Attempts"}
                </h2>
              </div>
              {selectedInterviewId && (
                <Link
                  href={`/dashboard/interviews/${selectedInterviewId}`}
                  className="text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors whitespace-nowrap"
                >
                  View Details &rarr;
                </Link>
              )}
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center">
                <p className="text-[12px] font-medium text-neutral-600 dark:text-neutral-400">Loading attempts…</p>
              </div>
            ) : !selectedInterviewDetail || selectedInterviewDetail.attempts.length === 0 ? (
              <div className="py-16 text-center px-4">
                <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
                  No candidate records for this template yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300 bg-neutral-100/70 dark:bg-neutral-950/70">
                      <th className="py-2.5 px-4 font-bold">Candidate</th>
                      <th className="py-2.5 px-4 font-bold">Status</th>
                      <th className="py-2.5 px-4 font-bold">Score</th>
                      <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {selectedInterviewDetail.attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-neutral-950 dark:text-white truncate max-w-[180px]">
                          {attempt.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold border ${
                              attempt.status === "scored"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                                : attempt.status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60"
                                : attempt.status === "invited"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                attempt.status === "scored"
                                  ? "bg-emerald-500"
                                  : attempt.status === "in_progress"
                                  ? "bg-blue-500"
                                  : attempt.status === "invited"
                                  ? "bg-indigo-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {attempt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums font-mono font-semibold">
                          {attempt.overall_score !== null ? (
                            <span
                              className={
                                attempt.overall_score >= 70
                                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                  : attempt.overall_score >= 50
                                  ? "text-blue-600 dark:text-blue-400 font-bold"
                                  : "text-amber-600 dark:text-amber-400 font-bold"
                              }
                            >
                              {attempt.overall_score}
                              <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-normal">/100</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => onCopyLink(attempt.id)}
                              className="h-7 px-2.5 text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-900 dark:hover:border-white transition-colors"
                            >
                              {copiedAttemptId === attempt.id ? "Copied" : "Copy Link"}
                            </button>
                            <Link
                              href={`/dashboard/attempts/${attempt.id}`}
                              className="h-7 px-2.5 text-[11px] font-medium inline-flex items-center border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                            >
                              Report
                            </Link>
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
      )}
    </div>
  );
}

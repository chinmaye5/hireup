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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Candidate Invites</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Send interview invitations to candidates and track their links.
        </p>
      </div>

      {interviews.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-neutral-500 text-sm">
            You must create an interview template before inviting candidates.
          </p>
          <button
            type="button"
            onClick={onGoToCreate}
            className="mt-3 bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            Create Interview
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Invites Form Card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-neutral-900">
              Send New Invitation
            </h2>
            <form onSubmit={onSendInvites} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Select Interview Role
                </label>
                <select
                  value={selectedInterviewId}
                  onChange={(e) => setSelectedInterviewId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  {interviews.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Candidate Emails
                </label>
                <textarea
                  rows={4}
                  required
                  value={inviteEmailsText}
                  onChange={(e) => setInviteEmailsText(e.target.value)}
                  placeholder="candidate1@example.com&#10;candidate2@example.com"
                  className="w-full rounded-lg border border-neutral-300 p-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Enter one email per line or separate by commas.
                </p>
              </div>

              <button
                type="submit"
                disabled={sendingInvites}
                className="bg-neutral-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition"
              >
                {sendingInvites ? "Sending Invites..." : "Send Invites"}
              </button>
            </form>

            {inviteResult && (
              <div className="mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                <p className="font-semibold text-neutral-800">
                  Invites Created: {inviteResult.created.length}
                </p>
                {inviteResult.skipped.length > 0 && (
                  <p className="text-neutral-500 mt-1">
                    Skipped (already invited): {inviteResult.skipped.length}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Candidate Attempts for Selected Role */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Candidate Attempts
                </h2>
                <p className="text-xs text-neutral-500">
                  Role: {selectedInterviewDetail?.title || "Loading interview..."}
                </p>
              </div>
              {selectedInterviewId && (
                <Link
                  href={`/dashboard/interviews/${selectedInterviewId}`}
                  className="text-xs font-semibold text-neutral-800 hover:underline"
                >
                  Open Full Interview Page &rarr;
                </Link>
              )}
            </div>

            {loadingDetail ? (
              <p className="text-xs text-neutral-400 py-8 text-center">
                Loading candidates...
              </p>
            ) : !selectedInterviewDetail ||
              selectedInterviewDetail.attempts.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">
                No candidates invited for this role yet. Use the invite box on the left
                to send invitations.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Candidate Email</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Score</th>
                      <th className="p-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedInterviewDetail.attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-neutral-50">
                        <td className="p-2.5 font-medium text-neutral-900">
                          {attempt.email}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              attempt.status === "scored"
                                ? "bg-emerald-100 text-emerald-800"
                                : attempt.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : attempt.status === "invited"
                                ? "bg-neutral-100 text-neutral-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {attempt.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold">
                          {attempt.overall_score !== null
                            ? `${attempt.overall_score} / 100`
                            : "—"}
                        </td>
                        <td className="p-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onCopyLink(attempt.id)}
                            className="border border-neutral-300 bg-white hover:bg-neutral-100 px-2.5 py-1 rounded text-[11px] font-medium"
                          >
                            {copiedAttemptId === attempt.id ? "Copied!" : "Copy Link"}
                          </button>
                          <Link
                            href={`/dashboard/attempts/${attempt.id}`}
                            className="text-neutral-900 font-semibold hover:underline text-[11px]"
                          >
                            View Report
                          </Link>
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

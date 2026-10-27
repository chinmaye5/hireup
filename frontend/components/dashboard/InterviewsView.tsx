"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { apiRequest } from "@/lib/api";
import { InterviewSummary, InviteResponse } from "./types";

type InterviewsViewProps = {
  interviews: InterviewSummary[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deletingId: string | null;
  onDeleteInterview: (id: string) => void;
  onGoToCreate: () => void;
  onGoToInvites?: (interviewId?: string) => void;
};

export default function InterviewsView({
  interviews,
  searchQuery,
  setSearchQuery,
  deletingId,
  onDeleteInterview,
  onGoToCreate,
  onGoToInvites,
}: InterviewsViewProps) {
  const { getToken } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Quick invite state per expanded item
  const [quickInviteEmails, setQuickInviteEmails] = useState("");
  const [quickInviting, setQuickInviting] = useState(false);
  const [quickInviteResult, setQuickInviteResult] = useState<InviteResponse | null>(null);
  const [quickInviteError, setQuickInviteError] = useState<string | null>(null);

  const filteredInterviews = interviews.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setQuickInviteEmails("");
      setQuickInviteResult(null);
      setQuickInviteError(null);
    }
  };

  const handleQuickInvite = async (interviewId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInviteEmails.trim()) return;

    const emails = quickInviteEmails
      .split(/[\n,]+/)
      .map((em) => em.trim())
      .filter((em) => em.length > 0);

    if (emails.length === 0) return;

    setQuickInviting(true);
    setQuickInviteError(null);
    setQuickInviteResult(null);

    try {
      const token = await getToken();
      const res = await apiRequest<InviteResponse>(
        `/api/interviews/${interviewId}/invites`,
        "POST",
        token,
        { emails }
      );
      setQuickInviteResult(res);
      setQuickInviteEmails("");
    } catch (err: unknown) {
      setQuickInviteError(err instanceof Error ? err.message : "Failed to dispatch invites");
    } finally {
      setQuickInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-600 dark:text-indigo-400">
            Templates / Roles
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Interviews
          </h1>
          <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
            Select any interview to inspect performance metrics, specifications, and dispatch candidate invites.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToCreate}
          className="h-8 px-3.5 text-[13px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          + New Interview
        </button>
      </div>

      {/* ── Search Filter ── */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Filter interviews by title…"
        className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2 text-[13px] text-neutral-950 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 transition-colors shadow-2xs"
      />

      {/* ── Table Container ── */}
      {filteredInterviews.length === 0 ? (
        <div className="py-16 text-center border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
            {searchQuery ? "No interviews match your search criteria." : "No interview templates created yet."}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={onGoToCreate}
              className="mt-4 h-8 px-4 text-[13px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            >
              Create First Interview
            </button>
          )}
        </div>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800 shadow-2xs">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_5.5rem_6.5rem_5rem_8.5rem_2rem] items-center px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300">
            <span>Interview Role</span>
            <span className="text-right">Duration</span>
            <span className="text-right">Expires</span>
            <span className="text-right">Scored</span>
            <span className="text-right">Actions</span>
            <span />
          </div>

          {/* Rows */}
          {filteredInterviews.map((item) => {
            const isExpanded = expandedId === item.id;
            const counts = item.status_counts || {};
            const totalCandidates =
              (counts.invited || 0) +
              (counts.in_progress || 0) +
              (counts.scored || 0) +
              (counts.abandoned || 0);

            const isExpired = new Date(item.expires_at) < new Date();

            return (
              <div key={item.id} className="bg-white dark:bg-neutral-900 transition-colors">
                {/* Clickable Row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className={`flex flex-col sm:grid sm:grid-cols-[1fr_5.5rem_6.5rem_5rem_8.5rem_2rem] items-start sm:items-center px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors gap-2 sm:gap-0 ${
                    isExpanded ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-l-3 border-indigo-600 dark:border-indigo-400" : ""
                  }`}
                >
                  {/* Title & Mobile Details */}
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-neutral-950 dark:text-white truncate">
                        {item.title}
                      </p>
                      {isExpired ? (
                        <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 rounded-sm">
                          Expired
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 rounded-sm">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 sm:hidden text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                      <span>{item.time_limit_min}m</span>
                      <span>·</span>
                      <span>Exp {new Date(item.expires_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{counts.scored || 0} scored</span>
                    </div>
                  </div>

                  <span className="hidden sm:block text-[13px] font-mono tabular-nums text-neutral-700 dark:text-neutral-300 text-right font-medium">
                    {item.time_limit_min}m
                  </span>
                  <span className="hidden sm:block text-[13px] font-mono tabular-nums text-neutral-700 dark:text-neutral-300 text-right">
                    {new Date(item.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="hidden sm:block text-[13px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold text-right">
                    {counts.scored || 0}
                  </span>

                  {/* Explicit Action Buttons in Row */}
                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                    {onGoToInvites && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoToInvites(item.id);
                        }}
                        className="h-7 px-2.5 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-2xs rounded-xs"
                        title="Invite candidates to this role"
                      >
                        Invite
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteInterview(item.id);
                      }}
                      disabled={deletingId === item.id}
                      className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                      title="Delete interview"
                    >
                      {deletingId === item.id ? "…" : "Delete"}
                    </button>
                  </div>

                  {/* Expand Chevron Icon */}
                  <div className="hidden sm:flex items-center justify-end text-neutral-500 dark:text-neutral-400">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                {/* ── Expanded Detail Pane ── */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 dark:border-neutral-800 p-5 bg-neutral-50/70 dark:bg-neutral-950/60 space-y-5">
                    {/* Meta Spec Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
                      <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 border-t-2 border-t-indigo-500">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600 dark:text-neutral-400">
                          Time Limit
                        </p>
                        <p className="mt-1 font-bold text-neutral-950 dark:text-white tabular-nums">
                          {item.time_limit_min} Minutes
                        </p>
                      </div>
                      <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 border-t-2 border-t-blue-500">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600 dark:text-neutral-400">
                          Expiration
                        </p>
                        <p className="mt-1 font-medium text-neutral-950 dark:text-white">
                          {new Date(item.expires_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 border-t-2 border-t-emerald-500">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600 dark:text-neutral-400">
                          Total Candidates
                        </p>
                        <p className="mt-1 font-bold text-neutral-950 dark:text-white tabular-nums">
                          {totalCandidates} Dispatched
                        </p>
                      </div>
                      <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 border-t-2 border-t-purple-500">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600 dark:text-neutral-400">
                          Completion Rate
                        </p>
                        <p className="mt-1 font-bold text-neutral-950 dark:text-white tabular-nums">
                          {totalCandidates > 0
                            ? `${Math.round(((counts.scored || 0) / totalCandidates) * 100)}%`
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Candidate Breakdown & Quick Invite Form */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Funnel Breakdown */}
                      <div className="lg:col-span-5 p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2.5 text-[12px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-700 dark:text-neutral-300">
                          Candidate Status Breakdown
                        </p>
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                          <div className="py-1.5 flex justify-between items-center">
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              Pending / Invited
                            </span>
                            <span className="font-bold text-neutral-950 dark:text-white tabular-nums">{counts.invited || 0}</span>
                          </div>
                          <div className="py-1.5 flex justify-between items-center">
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              In Progress
                            </span>
                            <span className="font-bold text-neutral-950 dark:text-white tabular-nums">{counts.in_progress || 0}</span>
                          </div>
                          <div className="py-1.5 flex justify-between items-center">
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Evaluated / Scored
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{counts.scored || 0}</span>
                          </div>
                          <div className="py-1.5 flex justify-between items-center">
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Dropped / Abandoned
                            </span>
                            <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">{counts.abandoned || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Dispatch Form */}
                      <div className="lg:col-span-7 p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-700 dark:text-neutral-300">
                            Quick Invite Dispatch
                          </p>
                          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-medium">Instant Delivery</span>
                        </div>

                        <form onSubmit={(e) => handleQuickInvite(item.id, e)} className="space-y-3">
                          <input
                            type="text"
                            required
                            value={quickInviteEmails}
                            onChange={(e) => setQuickInviteEmails(e.target.value)}
                            placeholder="Enter candidate emails (separated by commas)…"
                            className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-[12px] text-neutral-950 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 transition-colors shadow-2xs"
                          />

                          <div className="flex items-center gap-3">
                            <button
                              type="submit"
                              disabled={quickInviting}
                              className="h-8 px-4 text-[12px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 shadow-sm"
                            >
                              {quickInviting ? "Sending…" : "Send Invite"}
                            </button>
                            {onGoToInvites && (
                              <button
                                type="button"
                                onClick={() => onGoToInvites(item.id)}
                                className="h-8 px-3 text-[12px] font-medium border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                              >
                                Open Full Invites Tab &rarr;
                              </button>
                            )}
                          </div>
                        </form>

                        {quickInviteResult && (
                          <div className="p-2 border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-mono font-medium">
                            Invites dispatched: {quickInviteResult.created.length} created
                            {quickInviteResult.skipped.length > 0 && `, ${quickInviteResult.skipped.length} already invited`}
                          </div>
                        )}

                        {quickInviteError && (
                          <div className="p-2 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-[11px] text-rose-800 dark:text-rose-300 font-mono">
                            {quickInviteError}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/interviews/${item.id}`}
                          className="h-8 px-3.5 text-[12px] font-medium inline-flex items-center border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
                        >
                          View Full Interview Specification & Attempts &rarr;
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteInterview(item.id)}
                        disabled={deletingId === item.id}
                        className="text-[12px] font-medium text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-40"
                      >
                        {deletingId === item.id ? "Deleting Interview…" : "Delete Interview"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

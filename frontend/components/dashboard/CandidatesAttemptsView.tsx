"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { apiRequest } from "@/lib/api";
import { CompanyAttemptSummary, FullAttemptDetail } from "./types";

type CandidatesAttemptsViewProps = {
  onGoToInvites?: (interviewId?: string) => void;
};

export default function CandidatesAttemptsView({
  onGoToInvites,
}: CandidatesAttemptsViewProps) {
  const { getToken, isLoaded } = useAuth();

  const [attempts, setAttempts] = useState<CompanyAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected attempt detail state
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [selectedAttemptDetail, setSelectedAttemptDetail] =
    useState<FullAttemptDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  // Action states
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all company attempts
  async function loadAttempts() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const list = await apiRequest<CompanyAttemptSummary[]>(
        "/api/attempts",
        "GET",
        token
      );
      setAttempts(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load candidate attempts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    loadAttempts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Load single attempt detail when selected
  async function loadDetail(attemptId: string) {
    setSelectedAttemptId(attemptId);
    setLoadingDetail(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiRequest<FullAttemptDetail>(
        `/api/attempts/${attemptId}`,
        "GET",
        token
      );
      setSelectedAttemptDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load attempt details");
    } finally {
      setLoadingDetail(false);
    }
  }

  // Copy candidate link
  function handleCopyLink(attemptId: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/interview/${attemptId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(attemptId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Reset attempt
  async function handleReset(attemptId: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setResettingId(attemptId);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/attempts/${attemptId}/reset`, "POST", token);

      // Update in list
      setAttempts((prev) =>
        prev.map((a) =>
          a.id === attemptId ? { ...a, status: "invited", overall_score: null } : a
        )
      );

      // If viewing detail, refresh detail
      if (selectedAttemptId === attemptId) {
        await loadDetail(attemptId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset attempt");
    } finally {
      setResettingId(null);
    }
  }

  // Delete attempt
  async function handleDelete(attemptId: string, email: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!confirm(`Are you sure you want to remove the interview invite for ${email}?`)) {
      return;
    }
    setDeletingId(attemptId);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/attempts/${attemptId}`, "DELETE", token);

      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));

      if (selectedAttemptId === attemptId) {
        setSelectedAttemptId(null);
        setSelectedAttemptDetail(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete attempt");
    } finally {
      setDeletingId(null);
    }
  }

  // Re-score attempt
  async function handleRescore() {
    if (!selectedAttemptId) return;
    setRescoring(true);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/attempts/${selectedAttemptId}/rescore`, "POST", token);
      await loadDetail(selectedAttemptId);
      await loadAttempts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to re-score attempt");
    } finally {
      setRescoring(false);
    }
  }

  // Filtered list
  const filteredAttempts = attempts.filter((item) => {
    const matchesSearch =
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.interview_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
            Candidate Pipeline
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Candidates & Results
          </h1>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            Track interview attempts, inspect automated evaluations, and review verbatim dialogue in chat view.
          </p>
        </div>

        {selectedAttemptId && (
          <button
            type="button"
            onClick={() => {
              setSelectedAttemptId(null);
              setSelectedAttemptDetail(null);
            }}
            className="h-8 px-3 text-[12px] font-medium border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:border-neutral-900 dark:hover:border-white transition-colors self-start sm:self-auto"
          >
            &larr; Back to Candidates List
          </button>
        )}
      </div>

      {error && (
        <div className="border-l-2 border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 p-3 text-[12px] font-mono flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-[10px] font-semibold uppercase tracking-wider underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── DETAIL VIEW (When a candidate is selected) ── */}
      {selectedAttemptId ? (
        loadingDetail ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-950 dark:border-t-white rounded-full animate-spin" />
            <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
              Loading candidate submission…
            </p>
          </div>
        ) : selectedAttemptDetail ? (
          <div className="space-y-8">
            {/* Candidate Header Strip */}
            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                    {selectedAttemptDetail.interview_title}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700">/</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedAttemptDetail.status === "scored"
                          ? "bg-emerald-500"
                          : selectedAttemptDetail.status === "in_progress"
                          ? "bg-blue-500 animate-pulse"
                          : selectedAttemptDetail.status === "invited"
                          ? "bg-neutral-400"
                          : "bg-amber-500"
                      }`}
                    />
                    <span className="capitalize">{selectedAttemptDetail.status}</span>
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-neutral-950 dark:text-white">
                  {selectedAttemptDetail.email}
                </h2>
                <p className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                  Attempt ID: {selectedAttemptDetail.id}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedAttemptDetail.id)}
                  className="h-8 px-3 text-[12px] font-medium border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 hover:border-neutral-900 dark:hover:border-white transition-colors"
                >
                  {copiedId === selectedAttemptDetail.id ? "Link Copied!" : "Copy Link"}
                </button>
                <button
                  type="button"
                  onClick={() => handleReset(selectedAttemptDetail.id)}
                  disabled={resettingId === selectedAttemptDetail.id}
                  className="h-8 px-3 text-[12px] font-medium border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 hover:border-neutral-900 dark:hover:border-white transition-colors disabled:opacity-40"
                  title="Reset attempt so candidate can retry"
                >
                  {resettingId === selectedAttemptDetail.id ? "Resetting…" : "Reset Attempt"}
                </button>
                <button
                  type="button"
                  onClick={handleRescore}
                  disabled={rescoring}
                  className="h-8 px-3 text-[12px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {rescoring ? "Scoring…" : "Re-score"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDelete(selectedAttemptDetail.id, selectedAttemptDetail.email)
                  }
                  disabled={deletingId === selectedAttemptDetail.id}
                  className="h-8 px-3 text-[12px] font-medium border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                >
                  {deletingId === selectedAttemptDetail.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>

            {/* AI Evaluation Section */}
            {selectedAttemptDetail.result ? (
              <div className="space-y-6">
                {/* Score & Summary Banner */}
                <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                      Executive Evaluation Summary
                    </p>
                    <p className="text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {selectedAttemptDetail.result.summary}
                    </p>
                  </div>
                  <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4 text-right shrink-0 min-w-[140px]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                      Score
                    </p>
                    <p className="text-3xl font-semibold tabular-nums text-neutral-950 dark:text-white leading-tight">
                      {selectedAttemptDetail.result.overall_score}
                      <span className="text-sm font-normal text-neutral-400">/10</span>
                    </p>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mt-1">
                      {selectedAttemptDetail.result.recommendation}
                    </p>
                  </div>
                </div>

                {/* Strengths & Weaknesses 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Demonstrated Strengths
                    </p>
                    <ul className="space-y-2 text-[13px] text-neutral-800 dark:text-neutral-200">
                      {selectedAttemptDetail.result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-neutral-400 select-none">—</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                      Areas for Development
                    </p>
                    <ul className="space-y-2 text-[13px] text-neutral-800 dark:text-neutral-200">
                      {selectedAttemptDetail.result.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-neutral-400 select-none">—</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Per-Question Breakdown */}
                {selectedAttemptDetail.result.per_question.length > 0 && (
                  <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                        Rubric Analysis
                      </p>
                      <h3 className="text-sm font-semibold text-neutral-950 dark:text-white mt-0.5">
                        Per-Question Scores & Notes
                      </h3>
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {selectedAttemptDetail.result.per_question.map((q) => (
                        <div
                          key={q.question_index}
                          className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                        >
                          <div className="space-y-1 flex-1">
                            <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 uppercase">
                              Question {String(q.question_index).padStart(2, "0")}
                            </span>
                            <p className="text-[13px] text-neutral-800 dark:text-neutral-200 leading-relaxed">
                              {q.notes}
                            </p>
                          </div>
                          <div className="text-right sm:w-20 shrink-0 font-mono">
                            <span className="text-base font-semibold text-neutral-950 dark:text-white tabular-nums">
                              {q.score}
                            </span>
                            <span className="text-[11px] text-neutral-400">/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center text-[13px] text-neutral-400 dark:text-neutral-500">
                {selectedAttemptDetail.result_error ? (
                  <p className="text-red-600 dark:text-red-400 font-mono">
                    Scoring error: {selectedAttemptDetail.result_error}
                  </p>
                ) : (
                  <p>
                    Evaluation report not available yet. Completed sessions score automatically.
                  </p>
                )}
              </div>
            )}

            {/* ── CHAT INTERFACE TRANSCRIPT (Left: AI, Right: Human) ── */}
            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                    Dialogue Transcript
                  </p>
                  <h3 className="text-sm font-semibold text-neutral-950 dark:text-white mt-0.5">
                    Conversation Stream
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 tabular-nums">
                  {selectedAttemptDetail.transcript.length} messages
                </span>
              </div>

              {selectedAttemptDetail.transcript.length === 0 ? (
                <div className="py-16 text-center text-[13px] text-neutral-400 dark:text-neutral-500">
                  No dialogue recorded for this session.
                </div>
              ) : (
                <div className="p-4 sm:p-6 space-y-5 bg-neutral-50/40 dark:bg-neutral-950/40">
                  {selectedAttemptDetail.transcript.map((msg, index) => {
                    const isAi = msg.role === "interviewer";
                    return (
                      <div
                        key={index}
                        className={`flex flex-col ${isAi ? "items-start" : "items-end"} gap-1`}
                      >
                        {/* Speaker Meta Header */}
                        <div
                          className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1`}
                        >
                          {isAi && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          )}
                          <span>{isAi ? "AI Interviewer" : "Candidate"}</span>
                          {msg.timestamp && (
                            <>
                              <span>·</span>
                              <span>{msg.timestamp}</span>
                            </>
                          )}
                        </div>

                        {/* Chat Speech Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-[13px] leading-relaxed ${
                            isAi
                              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-2xl rounded-tl-xs shadow-2xs"
                              : "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-2xl rounded-tr-xs"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null
      ) : (
        /* ── CANDIDATES LIST VIEW ── */
        <div className="space-y-6">
          {/* Controls: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by candidate email or role…"
              className="flex-1 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-[13px] text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
            />

            <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1 text-[11px] overflow-x-auto">
              {[
                { key: "all", label: "All" },
                { key: "scored", label: "Scored" },
                { key: "in_progress", label: "In Progress" },
                { key: "invited", label: "Pending" },
                { key: "abandoned", label: "Abandoned" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
                    statusFilter === filter.key
                      ? "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Table */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-950 dark:border-t-white rounded-full animate-spin" />
              <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                Loading candidate pipeline…
              </p>
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-16 text-center space-y-3">
              <p className="text-[13px] text-neutral-400 dark:text-neutral-500">
                {searchQuery || statusFilter !== "all"
                  ? "No candidates match the specified filter."
                  : "No candidate invitations created yet."}
              </p>
              {onGoToInvites && (
                <button
                  type="button"
                  onClick={() => onGoToInvites()}
                  className="h-8 px-4 text-[13px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity"
                >
                  Dispatch First Invite
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="min-w-[760px] divide-y divide-neutral-200 dark:divide-neutral-800">
                {/* Header */}
                <div className="grid grid-cols-[1.3fr_1fr_7rem_5.5rem_13.5rem] items-center px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                  <span>Candidate</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span className="text-right pr-4">Score</span>
                  <span className="text-right">Actions</span>
                </div>

                {/* Rows */}
                {filteredAttempts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadDetail(item.id)}
                    className="grid grid-cols-[1.3fr_1fr_7rem_5.5rem_13.5rem] items-center px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    {/* Candidate Email */}
                    <div className="min-w-0 pr-2">
                      <p className="text-[13px] font-medium text-neutral-950 dark:text-white truncate">
                        {item.email}
                      </p>
                    </div>

                    {/* Role Title */}
                    <div className="min-w-0 pr-2">
                      <p className="text-[12px] text-neutral-600 dark:text-neutral-400 truncate">
                        {item.interview_title}
                      </p>
                    </div>

                    {/* Status Indicator */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === "scored"
                              ? "bg-emerald-500"
                              : item.status === "in_progress"
                              ? "bg-blue-500 animate-pulse"
                              : item.status === "invited"
                              ? "bg-neutral-400"
                              : "bg-amber-500"
                          }`}
                        />
                        <span className="capitalize">{item.status}</span>
                      </span>
                    </div>

                    {/* Score */}
                    <div className="text-right font-mono text-[13px] tabular-nums text-neutral-950 dark:text-white shrink-0 pr-4">
                      {item.overall_score !== null ? (
                        <span>
                          {item.overall_score}
                          <span className="text-neutral-400 text-[11px]">/10</span>
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(item.id, e)}
                        className="h-7 px-2 text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-white transition-colors"
                        title="Copy candidate invite link"
                      >
                        {copiedId === item.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleReset(item.id, e)}
                        disabled={resettingId === item.id}
                        className="h-7 px-2 text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-white transition-colors disabled:opacity-40"
                        title="Reset candidate attempt"
                      >
                        {resettingId === item.id ? "…" : "Reset"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, item.email, e)}
                        disabled={deletingId === item.id}
                        className="h-7 px-2 text-[11px] font-medium border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        title="Delete candidate invite"
                      >
                        {deletingId === item.id ? "…" : "Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadDetail(item.id);
                        }}
                        className="h-7 px-2.5 text-[11px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { InterviewSummary } from "./types";

type AnalyticsViewProps = {
  interviews: InterviewSummary[];
  onGoToCreate: () => void;
  onGoToInvites: () => void;
};

export default function AnalyticsView({
  interviews,
  onGoToCreate,
  onGoToInvites,
}: AnalyticsViewProps) {
  let totalInvited = 0;
  let totalInProgress = 0;
  let totalScored = 0;
  let totalAbandoned = 0;

  for (let i = 0; i < interviews.length; i += 1) {
    const counts = interviews[i].status_counts || {};
    totalInvited += counts.invited || 0;
    totalInProgress += counts.in_progress || 0;
    totalScored += counts.scored || 0;
    totalAbandoned += counts.abandoned || 0;
  }

  const totalCandidates =
    totalInvited + totalInProgress + totalScored + totalAbandoned;
  const completionRate =
    totalCandidates > 0 ? Math.round((totalScored / totalCandidates) * 100) : 0;

  const funnelRows = [
    { label: "Pending", count: totalInvited, pct: totalCandidates > 0 ? (totalInvited / totalCandidates) * 100 : 0 },
    { label: "In progress", count: totalInProgress, pct: totalCandidates > 0 ? (totalInProgress / totalCandidates) * 100 : 0 },
    { label: "Scored", count: totalScored, pct: totalCandidates > 0 ? (totalScored / totalCandidates) * 100 : 0 },
    { label: "Dropped", count: totalAbandoned, pct: totalCandidates > 0 ? (totalAbandoned / totalCandidates) * 100 : 0 },
  ];

  return (
    <div className="space-y-10">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Overview
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onGoToInvites}
            className="h-8 px-3 text-[13px] font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
          >
            Invite candidates
          </button>
          <button
            type="button"
            onClick={onGoToCreate}
            className="h-8 px-3 text-[13px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity"
          >
            New interview
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px border border-neutral-200 dark:border-neutral-800">
        {[
          { label: "Interviews", value: interviews.length },
          { label: "Candidates", value: totalCandidates },
          { label: "Evaluated", value: totalScored },
          { label: "Completion", value: `${completionRate}%` },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-neutral-900 px-5 py-4"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
              {kpi.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-950 dark:text-white">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Funnel table ── */}
      <section>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-4">
          Candidate funnel
        </h2>
        <div className="border border-neutral-200 dark:border-neutral-800">
          {/* Header */}
          <div className="grid grid-cols-[1fr_4rem_4rem] sm:grid-cols-[1fr_5rem_5rem_1fr] items-center px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Stage</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 text-right">Count</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 text-right">%</span>
            <span className="hidden sm:block" />
          </div>
          {/* Rows */}
          {funnelRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_4rem_4rem] sm:grid-cols-[1fr_5rem_5rem_1fr] items-center px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
            >
              <span className="text-[13px] font-medium text-neutral-950 dark:text-white">{row.label}</span>
              <span className="text-[13px] tabular-nums text-neutral-700 dark:text-neutral-300 text-right">{row.count}</span>
              <span className="text-[13px] tabular-nums text-neutral-400 dark:text-neutral-500 text-right">{Math.round(row.pct)}%</span>
              {/* Bar */}
              <div className="hidden sm:block ml-4">
                <div className="h-[3px] bg-neutral-100 dark:bg-neutral-800 w-full">
                  <div
                    className="h-full bg-neutral-950 dark:bg-white transition-all duration-500"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles list ── */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
            Active roles — {interviews.length}
          </h2>
          <button
            type="button"
            onClick={onGoToCreate}
            className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors"
          >
            + Add role
          </button>
        </div>

        {interviews.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-neutral-400 dark:text-neutral-500">
            No interview templates yet.
          </p>
        ) : (
          <div className="border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
            {interviews.map((item) => {
              const counts = item.status_counts || {};
              const roleTotal =
                (counts.invited || 0) +
                (counts.in_progress || 0) +
                (counts.scored || 0) +
                (counts.abandoned || 0);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-[13px] font-medium text-neutral-950 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {roleTotal} candidate{roleTotal === 1 ? "" : "s"} · {counts.scored || 0} scored
                    </p>
                  </div>
                  <span className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
                    {item.time_limit_min}m
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
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
    {
      label: "Pending",
      count: totalInvited,
      pct: totalCandidates > 0 ? (totalInvited / totalCandidates) * 100 : 0,
      dotClass: "bg-indigo-500",
      barClass: "bg-indigo-500",
      textClass: "text-indigo-700 dark:text-indigo-400",
    },
    {
      label: "In progress",
      count: totalInProgress,
      pct: totalCandidates > 0 ? (totalInProgress / totalCandidates) * 100 : 0,
      dotClass: "bg-blue-500",
      barClass: "bg-blue-500",
      textClass: "text-blue-700 dark:text-blue-400",
    },
    {
      label: "Scored",
      count: totalScored,
      pct: totalCandidates > 0 ? (totalScored / totalCandidates) * 100 : 0,
      dotClass: "bg-emerald-500",
      barClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-400",
    },
    {
      label: "Dropped",
      count: totalAbandoned,
      pct: totalCandidates > 0 ? (totalAbandoned / totalCandidates) * 100 : 0,
      dotClass: "bg-rose-500",
      barClass: "bg-rose-500",
      textClass: "text-rose-700 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-10">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-600 dark:text-indigo-400">
            Analytics & Operations
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Overview
          </h1>
          <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
            Real-time hiring metrics, conversion funnels, and role activity.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onGoToInvites}
            className="h-8 px-3 text-[13px] font-medium border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-neutral-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shadow-2xs"
          >
            Invite candidates
          </button>
          <button
            type="button"
            onClick={onGoToCreate}
            className="h-8 px-3.5 text-[13px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
          >
            + New interview
          </button>
        </div>
      </div>

      {/* ── KPI strip with accent color highlights ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Interviews",
            value: interviews.length,
            accent: "border-t-2 border-t-indigo-500",
            badge: "Active Roles",
            badgeClass: "text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
          },
          {
            label: "Total Candidates",
            value: totalCandidates,
            accent: "border-t-2 border-t-blue-500",
            badge: "Invited",
            badgeClass: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
          },
          {
            label: "Evaluated / Scored",
            value: totalScored,
            accent: "border-t-2 border-t-emerald-500",
            badge: "AI Scored",
            badgeClass: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
          },
          {
            label: "Completion Rate",
            value: `${completionRate}%`,
            accent: "border-t-2 border-t-purple-500",
            badge: "Funnel Target",
            badgeClass: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-4 shadow-2xs ${kpi.accent}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-600 dark:text-neutral-400">
                {kpi.label}
              </p>
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-sm ${kpi.badgeClass}`}>
                {kpi.badge}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-neutral-950 dark:text-white">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Funnel table with color indicators ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300">
            Candidate Pipeline Funnel
          </h2>
          <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
            {totalCandidates} Total Records
          </span>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
          {/* Header */}
          <div className="grid grid-cols-[1fr_5rem_5rem] sm:grid-cols-[1fr_6rem_6rem_1.4fr] items-center px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300">
            <span>Stage</span>
            <span className="text-right">Count</span>
            <span className="text-right">% Share</span>
            <span className="hidden sm:block ml-4">Distribution</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {funnelRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_5rem_5rem] sm:grid-cols-[1fr_6rem_6rem_1.4fr] items-center px-4 py-3 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${row.dotClass}`} />
                  <span className="text-[13px] font-semibold text-neutral-950 dark:text-white">
                    {row.label}
                  </span>
                </div>
                <span className="text-[13px] font-mono tabular-nums font-medium text-neutral-800 dark:text-neutral-200 text-right">
                  {row.count}
                </span>
                <span className={`text-[13px] font-mono tabular-nums font-semibold text-right ${row.textClass}`}>
                  {Math.round(row.pct)}%
                </span>
                {/* Visual Bar */}
                <div className="hidden sm:block ml-4">
                  <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 w-full overflow-hidden">
                    <div
                      className={`h-full ${row.barClass} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(row.pct, row.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles list ── */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300">
            Active Role Templates — {interviews.length}
          </h2>
          <button
            type="button"
            onClick={onGoToCreate}
            className="text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            + Create Role
          </button>
        </div>

        {interviews.length === 0 ? (
          <div className="p-8 text-center border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
              No interview templates yet.
            </p>
          </div>
        ) : (
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 shadow-2xs">
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
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-[13px] font-semibold text-neutral-950 dark:text-white truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                      <span>{roleTotal} candidate{roleTotal === 1 ? "" : "s"}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {counts.scored || 0} evaluated
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {item.time_limit_min}m limit
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
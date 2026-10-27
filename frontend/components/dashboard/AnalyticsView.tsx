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
  // Compute aggregated stats
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

  const dropOffRate =
    totalCandidates > 0 ? Math.round((totalAbandoned / totalCandidates) * 100) : 0;

  const funnelStages = [
    {
      label: "Invited (Pending Start)",
      count: totalInvited,
      color: "bg-neutral-900 dark:bg-white",
      badgeColor: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
      pct: totalCandidates > 0 ? (totalInvited / totalCandidates) * 100 : 0,
    },
    {
      label: "In Progress (Live Now)",
      count: totalInProgress,
      color: "bg-blue-600 dark:bg-blue-500",
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
      pct: totalCandidates > 0 ? (totalInProgress / totalCandidates) * 100 : 0,
    },
    {
      label: "Completed & Scored",
      count: totalScored,
      color: "bg-emerald-600 dark:bg-emerald-500",
      badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      pct: totalCandidates > 0 ? (totalScored / totalCandidates) * 100 : 0,
    },
    {
      label: "Abandoned / Expired",
      count: totalAbandoned,
      color: "bg-rose-500 dark:bg-rose-400",
      badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      pct: totalCandidates > 0 ? (totalAbandoned / totalCandidates) * 100 : 0,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
              Analytics & Performance
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live Updates
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time candidate pipelines, completion benchmarks, and funnel conversion stats.
          </p>
        </div>

        {/* Top Header Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoToInvites}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Invite Candidates
          </button>
          <button
            type="button"
            onClick={onGoToCreate}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            + New Interview
          </button>
        </div>
      </div>

      {/* KPI Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Templates */}
        <div className="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Interview Templates
            </span>
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-neutral-950 dark:text-white mt-3">
            {interviews.length}
          </p>
          <div className="mt-2 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-900 dark:text-neutral-200 mr-1">
              {interviews.length} active
            </span>
            roles configured
          </div>
        </div>

        {/* Total Candidates Reached */}
        <div className="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Candidates
            </span>
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-neutral-950 dark:text-white mt-3">
            {totalCandidates}
          </p>
          <div className="mt-2 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
            <span>Across all active interview campaigns</span>
          </div>
        </div>

        {/* Completed & Scored */}
        <div className="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Evaluated
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-3">
            {totalScored}
          </p>
          <div className="mt-2 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-emerald-600 dark:text-emerald-400 mr-1">
              {completionRate}%
            </span>
            completion rate
          </div>
        </div>

        {/* Completion Rate KPI */}
        <div className="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Conversion Benchmark
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-3">
            {completionRate}%
          </p>
          <div className="mt-2 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
            <span className="text-rose-500 font-medium mr-1">{dropOffRate}%</span> drop-off / expired
          </div>
        </div>
      </div>

      {/* Main Section Grid: Funnel + Role Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Funnel Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Candidate Funnel Distribution
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Breakdown of candidate lifecycle status across active interviews
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg">
                {totalCandidates} Total
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-3 rounded-full overflow-hidden flex mb-8">
              {funnelStages.map((stage) => (
                <div
                  key={stage.label}
                  className={`${stage.color} h-full transition-all duration-500`}
                  style={{ width: `${stage.pct}%` }}
                  title={`${stage.label}: ${stage.count} (${Math.round(stage.pct)}%)`}
                />
              ))}
            </div>

            {/* Stage Items List */}
            <div className="space-y-4">
              {funnelStages.map((stage) => (
                <div key={stage.label} className="group">
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span>{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {stage.count}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${stage.badgeColor}`}>
                        {Math.round(stage.pct)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${stage.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Calculated from active sessions</span>
            <button
              type="button"
              onClick={onGoToInvites}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Manage invites &rarr;
            </button>
          </div>
        </div>

        {/* Roles & Active Templates Breakdown */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Active Roles
              </h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {interviews.length} total
              </span>
            </div>

            {interviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 dark:text-neutral-400">
                No active interview templates found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
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
                      className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {roleTotal} candidate{roleTotal === 1 ? "" : "s"} total
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md">
                        <span>{counts.scored || 0} scored</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onGoToCreate}
            className="mt-6 w-full py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors text-center"
          >
            + Add New Role Template
          </button>
        </div>
      </div>

      {/* Quick Action Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Dark Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white rounded-2xl p-6 shadow-md border border-neutral-800 flex flex-col justify-between">
          <div className="relative z-10">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/90 mb-3 backdrop-blur-sm">
              Role Setup
            </span>
            <h3 className="font-bold text-lg tracking-tight">
              Create a New Role Interview
            </h3>
            <p className="text-neutral-300 text-xs mt-1.5 leading-relaxed max-w-md">
              Define target competency rubrics, customize interview question depth, and set dynamic time limits for voice evaluation.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToCreate}
            className="mt-6 z-10 inline-flex items-center justify-center self-start bg-white text-neutral-950 font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-neutral-100 active:scale-95 transition-all shadow-sm"
          >
            + Create New Interview
          </button>
        </div>

        {/* Light Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-3">
              Outreach
            </span>
            <h3 className="font-bold text-neutral-900 dark:text-white text-lg tracking-tight">
              Invite Candidates
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1.5 leading-relaxed max-w-md">
              Generate unique candidate links and send automated voice interview invites directly across candidate batches.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToInvites}
            className="mt-6 inline-flex items-center justify-center self-start bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 transition-all shadow-sm"
          >
            Invite Candidates Now
          </button>
        </div>
      </div>
    </div>
  );
}
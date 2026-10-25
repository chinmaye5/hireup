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
  // Calculate analytics totals
  let totalInvited = 0;
  let totalInProgress = 0;
  let totalScored = 0;
  let totalAbandoned = 0;

  for (let i = 0; i < interviews.length; i = i + 1) {
    const counts = interviews[i].status_counts || {};
    totalInvited = totalInvited + (counts.invited || 0);
    totalInProgress = totalInProgress + (counts.in_progress || 0);
    totalScored = totalScored + (counts.scored || 0);
    totalAbandoned = totalAbandoned + (counts.abandoned || 0);
  }

  const totalCandidates =
    totalInvited + totalInProgress + totalScored + totalAbandoned;
  const completionRate =
    totalCandidates > 0 ? Math.round((totalScored / totalCandidates) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Analytics & Overview</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Live performance metrics for your company interviews.
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Interviews
          </p>
          <p className="text-3xl font-extrabold text-neutral-950 mt-2">
            {interviews.length}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Active templates</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Invites
          </p>
          <p className="text-3xl font-extrabold text-neutral-950 mt-2">
            {totalCandidates}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Candidates reached</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Completed & Scored
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">
            {totalScored}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Interviews evaluated</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Completion Rate
          </p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">
            {completionRate}%
          </p>
          <p className="text-xs text-neutral-500 mt-1">Scored vs invited</p>
        </div>
      </div>

      {/* Candidate Funnel Progress Section */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900 mb-4">
          Candidate Funnel Distribution
        </h2>
        <div className="flex flex-col gap-4">
          {/* Invited */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
              <span>Invited (Pending Start)</span>
              <span>{totalInvited} candidates</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-neutral-800 h-2.5 rounded-full"
                style={{
                  width: `${
                    totalCandidates > 0 ? (totalInvited / totalCandidates) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* In Progress */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
              <span>In Progress (Live Now)</span>
              <span>{totalInProgress} candidates</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${
                    totalCandidates > 0
                      ? (totalInProgress / totalCandidates) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Scored */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
              <span>Scored & Completed</span>
              <span>{totalScored} candidates</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full"
                style={{
                  width: `${
                    totalCandidates > 0 ? (totalScored / totalCandidates) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Abandoned */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
              <span>Abandoned / Expired</span>
              <span>{totalAbandoned} candidates</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-2.5 rounded-full"
                style={{
                  width: `${
                    totalCandidates > 0
                      ? (totalAbandoned / totalCandidates) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg">Create a New Role Interview</h3>
            <p className="text-neutral-300 text-xs mt-1">
              Define custom questions, time limits, and rubric benchmarks.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToCreate}
            className="mt-4 self-start bg-white text-neutral-900 font-semibold px-4 py-2 rounded-lg text-xs hover:bg-neutral-100 transition"
          >
            + Create New Interview
          </button>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-neutral-900 text-lg">Invite Candidates</h3>
            <p className="text-neutral-600 text-xs mt-1">
              Generate links and send voice interview invites directly.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToInvites}
            className="mt-4 self-start bg-neutral-900 text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-neutral-800 transition"
          >
            Invite Candidates Now
          </button>
        </div>
      </div>
    </div>
  );
}

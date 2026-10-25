"use client";

import Link from "next/link";
import { InterviewSummary } from "./types";

type InterviewsViewProps = {
  interviews: InterviewSummary[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deletingId: string | null;
  onDeleteInterview: (id: string) => void;
  onGoToCreate: () => void;
};

export default function InterviewsView({
  interviews,
  searchQuery,
  setSearchQuery,
  deletingId,
  onDeleteInterview,
  onGoToCreate,
}: InterviewsViewProps) {
  // Filter interviews by title matching search
  const filteredInterviews = interviews.filter((item) => {
    return item.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Interviews</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage all technical interview templates and view candidate results.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToCreate}
          className="self-start md:self-auto bg-neutral-900 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-neutral-800 transition shadow-sm"
        >
          + Create New Interview
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search interviews by role title..."
          className="w-full bg-white border border-neutral-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <svg
          className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Interview Cards List */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-neutral-500 text-sm">
            {searchQuery
              ? "No interviews match your search."
              : "No interview templates created yet."}
          </p>
          <button
            type="button"
            onClick={onGoToCreate}
            className="mt-4 inline-block bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-neutral-800"
          >
            Create Your First Interview
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInterviews.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:border-neutral-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-neutral-950 text-base">
                  {item.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-1.5">
                  <span>⏱️ {item.time_limit_min} mins time limit</span>
                  <span>•</span>
                  <span>
                    📅 Expires {new Date(item.expires_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-neutral-100 text-neutral-800 text-xs font-medium px-2.5 py-1 rounded-md">
                    Invited: {item.status_counts["invited"] || 0}
                  </span>
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-md">
                    In Progress: {item.status_counts["in_progress"] || 0}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-md">
                    Scored: {item.status_counts["scored"] || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <Link
                  href={`/dashboard/interviews/${item.id}`}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 px-3.5 py-2 rounded-lg text-xs font-semibold transition"
                >
                  View & Invite
                </Link>
                <button
                  type="button"
                  onClick={() => onDeleteInterview(item.id)}
                  disabled={deletingId === item.id}
                  className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

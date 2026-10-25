"use client";

import { TabType } from "./types";

type SidebarProps = {
  companyName: string;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  interviewCount: number;
  userEmail: string;
};

export default function Sidebar({
  companyName,
  activeTab,
  setActiveTab,
  interviewCount,
  userEmail,
}: SidebarProps) {
  const initialLetter = companyName ? companyName.charAt(0).toUpperCase() : "C";

  return (
    <aside className="w-full md:w-64 bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex flex-col gap-4 md:sticky md:top-24">
      {/* Company Header */}
      <div className="pb-3 border-b border-neutral-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-base flex-shrink-0">
          {initialLetter}
        </div>
        <div className="overflow-hidden">
          <h3 className="font-bold text-neutral-900 text-sm truncate">
            {companyName}
          </h3>
          <p className="text-xs text-neutral-500">Recruiter Workspace</p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
        {/* Analytics Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
            activeTab === "analytics"
              ? "bg-neutral-900 text-white shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z"
            />
          </svg>
          <span>Analytics</span>
        </button>

        {/* Interviews Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("interviews")}
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
            activeTab === "interviews"
              ? "bg-neutral-900 text-white shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>Interviews</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === "interviews"
                ? "bg-neutral-700 text-white"
                : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {interviewCount}
          </span>
        </button>

        {/* Create Interview Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
            activeTab === "create"
              ? "bg-neutral-900 text-white shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Create Interview</span>
        </button>

        {/* Candidate Invites Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("invites")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
            activeTab === "invites"
              ? "bg-neutral-900 text-white shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>Candidate Invites</span>
        </button>

        {/* Company Profile Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left whitespace-nowrap ${
            activeTab === "company"
              ? "bg-neutral-900 text-white shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span>Company Profile</span>
        </button>
      </nav>

      {/* Recruiter Email Info at Bottom */}
      <div className="pt-3 border-t border-neutral-100 mt-auto text-xs text-neutral-500">
        <p className="font-semibold text-neutral-800 truncate">
          {userEmail || "Recruiter"}
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5">Status: Active</p>
      </div>
    </aside>
  );
}

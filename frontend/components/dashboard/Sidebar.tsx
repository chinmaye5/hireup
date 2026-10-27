"use client";

import { TabType } from "./types";

type SidebarProps = {
  companyName: string;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  interviewCount: number;
  userEmail: string;
};

const tabs: { key: TabType; label: string }[] = [
  { key: "analytics", label: "Overview" },
  { key: "interviews", label: "Interviews" },
  { key: "create", label: "New Interview" },
  { key: "invites", label: "Invites" },
  { key: "attempts", label: "Candidates & Results" },
  { key: "company", label: "Settings" },
];

export default function Sidebar({
  companyName,
  activeTab,
  setActiveTab,
  interviewCount,
  userEmail,
}: SidebarProps) {
  return (
    <aside className="w-full md:w-56 shrink-0 flex flex-col gap-6 md:sticky md:top-24">
      {/* Identity */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-600 dark:text-indigo-400">
          Recruiter Workspace
        </p>
        <p className="mt-1 text-sm font-bold text-neutral-950 dark:text-white truncate">
          {companyName}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto -mx-1 md:mx-0">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative flex items-center justify-between px-3 py-2 text-[13px] font-medium transition-colors whitespace-nowrap rounded-sm
                ${active
                  ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/80 dark:bg-indigo-950/40"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                }
              `}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-full hidden md:block" />
              )}
              <span>{tab.label}</span>
              {tab.key === "interviews" && (
                <span className={`
                  ml-2 text-[11px] tabular-nums font-semibold px-1.5 py-0.5 rounded
                  ${active
                    ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                    : "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }
                `}>
                  {interviewCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800 hidden md:block">
        <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 truncate">
          {userEmail || "—"}
        </p>
      </div>
    </aside>
  );
}

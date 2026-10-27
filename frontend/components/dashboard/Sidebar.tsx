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
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
          Workspace
        </p>
        <p className="mt-1 text-sm font-semibold text-neutral-950 dark:text-white truncate">
          {companyName}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-row md:flex-col gap-px overflow-x-auto -mx-1 md:mx-0">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative flex items-center justify-between px-3 py-2 text-[13px] font-medium transition-colors whitespace-nowrap
                ${active
                  ? "text-neutral-950 dark:text-white"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
                }
              `}
            >
              {/* Active indicator — left bar on desktop, bottom bar on mobile */}
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-neutral-950 dark:bg-white rounded-full hidden md:block" />
              )}
              <span>{tab.label}</span>
              {tab.key === "interviews" && (
                <span className={`
                  ml-2 text-[11px] tabular-nums font-semibold
                  ${active ? "text-neutral-950 dark:text-white" : "text-neutral-400 dark:text-neutral-500"}
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
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
          {userEmail || "—"}
        </p>
      </div>
    </aside>
  );
}

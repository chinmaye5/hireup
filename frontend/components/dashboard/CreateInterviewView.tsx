"use client";

type CreateInterviewViewProps = {
  title: string;
  setTitle: (value: string) => void;
  questionsRaw: string;
  setQuestionsRaw: (value: string) => void;
  timeLimitMin: number;
  setTimeLimitMin: (value: number) => void;
  expiresAt: string;
  setExpiresAt: (value: string) => void;
  creatingInterview: boolean;
  onCreateInterview: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export default function CreateInterviewView({
  title,
  setTitle,
  questionsRaw,
  setQuestionsRaw,
  timeLimitMin,
  setTimeLimitMin,
  expiresAt,
  setExpiresAt,
  creatingInterview,
  onCreateInterview,
  onCancel,
}: CreateInterviewViewProps) {
  function loadPreset(role: "frontend" | "backend" | "fullstack") {
    if (role === "frontend") {
      setTitle("Frontend React Engineer");
      setQuestionsRaw(
        "Can you introduce yourself and talk about your experience with React and modern frontend frameworks? || Experience depth\nHow does the virtual DOM work in React, and when might re-rendering cause performance issues? || Rendering performance\nExplain the difference between useMemo, useCallback, and React.memo. || State and hook optimization\nHow do you handle responsive design and cross-browser testing in CSS? || CSS and layouts"
      );
      setTimeLimitMin(15);
    } else if (role === "backend") {
      setTitle("Backend Python / Node Engineer");
      setQuestionsRaw(
        "Could you briefly describe your background and primary backend technologies? || Tech stack breadth\nExplain synchronous vs asynchronous execution and how event loops operate. || Concurrency fundamentals\nWhat are the main differences between SQL and NoSQL databases, and when would you choose each? || Database design\nHow do you design secure APIs and handle authentication and rate limiting? || API security best practices"
      );
      setTimeLimitMin(20);
    } else if (role === "fullstack") {
      setTitle("Full Stack Software Engineer");
      setQuestionsRaw(
        "Tell us about a full-stack project you architected from database to user interface. || System overview\nHow do you manage client-server communication and handle real-time updates? || Network protocols and WebSockets\nDescribe a challenging bug you encountered in production and how you diagnosed it. || Problem solving\nHow do you approach automated testing and continuous deployment? || CI/CD and testing"
      );
      setTimeLimitMin(20);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">
          Template Setup
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Create Interview
        </h1>
        <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
          Define role specifications, voice questions, and automated scoring criteria.
        </p>
      </div>

      {/* ── Preset Templates Strip ── */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 border-l-4 border-l-indigo-600">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600 dark:text-neutral-400 mb-2.5">
          Quick-Load Presets
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadPreset("frontend")}
            className="h-8 px-3 text-[12px] font-medium border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-400 transition-colors"
          >
            Frontend React
          </button>
          <button
            type="button"
            onClick={() => loadPreset("backend")}
            className="h-8 px-3 text-[12px] font-medium border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-400 transition-colors"
          >
            Backend Systems
          </button>
          <button
            type="button"
            onClick={() => loadPreset("fullstack")}
            className="h-8 px-3 text-[12px] font-medium border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-400 transition-colors"
          >
            Full Stack Engineering
          </button>
        </div>
      </div>

      {/* ── Form Section ── */}
      <form onSubmit={onCreateInterview} className="space-y-6">
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 border-t-2 border-t-indigo-600">
          {/* Role Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300 mb-2">
              Job / Role Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-[13px] text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>

          {/* Questions & Rubric */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300">
                Questions & Rubric
              </label>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                Format: Question || Rubric
              </span>
            </div>
            <textarea
              required
              rows={7}
              value={questionsRaw}
              onChange={(e) => setQuestionsRaw(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-mono text-[12px] leading-relaxed text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
            />
            <p className="mt-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
              One question per line. The AI interviewer will deliver them sequentially.
            </p>
          </div>

          {/* Duration & Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300 mb-2">
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                required
                value={timeLimitMin}
                onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-[13px] tabular-nums text-neutral-950 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300 mb-2">
                Expiration Timestamp
              </label>
              <input
                type="datetime-local"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-[13px] tabular-nums text-neutral-950 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={creatingInterview}
            className="h-9 px-5 text-[13px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-40 transition-all"
          >
            {creatingInterview ? "Saving Template…" : "Save Template"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 text-[13px] font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

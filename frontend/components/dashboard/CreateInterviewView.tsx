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
  // Preset templates helper
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
    <div className="bg-white border border-neutral-200 rounded-xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Create New Interview</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Set up role specifications, voice questions, and scoring criteria.
        </p>
      </div>

      {/* Preset Fast-Fill Buttons */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <p className="text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wider">
          Quick Templates:
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadPreset("frontend")}
            className="bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-md transition shadow-2xs"
          >
            💻 Frontend React
          </button>
          <button
            type="button"
            onClick={() => loadPreset("backend")}
            className="bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-md transition shadow-2xs"
          >
            ⚙️ Backend Node/Python
          </button>
          <button
            type="button"
            onClick={() => loadPreset("fullstack")}
            className="bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-md transition shadow-2xs"
          >
            🚀 Full Stack Engineer
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={onCreateInterview} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
            Job / Role Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Backend Engineer"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Questions & Rubric
            </label>
            <span className="text-[11px] text-neutral-400">
              Format: Question text || Rubric
            </span>
          </div>
          <textarea
            required
            rows={6}
            value={questionsRaw}
            onChange={(e) => setQuestionsRaw(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 p-3 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Enter one question per line. The AI interviewer will ask them in this exact order.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Time Limit (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              required
              value={timeLimitMin}
              onChange={(e) => setTimeLimitMin(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Expiration Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={creatingInterview}
            className="bg-neutral-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition"
          >
            {creatingInterview ? "Creating..." : "Save Interview Template"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-neutral-300 text-neutral-700 font-medium px-4 py-2.5 rounded-lg hover:bg-neutral-100 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

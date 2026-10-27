"use client";

type CompanyProfileViewProps = {
  company: {
    id: string;
    name: string;
  };
  userEmail: string;
  userName: string;
};

export default function CompanyProfileView({
  company,
  userEmail,
  userName,
}: CompanyProfileViewProps) {
  const initialLetter = company.name ? company.name.charAt(0).toUpperCase() : "C";

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">
          Organization
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Company Settings
        </h1>
        <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
          Workspace specifications, recruiter account info, and speech pipeline configuration.
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* ── Workspace Block ── */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex items-center justify-between border-t-2 border-t-indigo-600 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {initialLetter}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600 dark:text-neutral-400">
                Workspace
              </p>
              <h2 className="text-lg font-bold text-neutral-950 dark:text-white">
                {company.name}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-600 dark:text-neutral-400">
              Identifier
            </p>
            <p className="text-[12px] font-mono text-indigo-600 dark:text-indigo-400 font-medium">
              {company.id}
            </p>
          </div>
        </div>

        {/* ── Recruiter Account Specifications ── */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">
              Account
            </p>
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              Recruiter Credentials
            </h3>
          </div>
          <dl className="divide-y divide-neutral-200 dark:divide-neutral-800 text-[13px]">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300">
                Full Name
              </dt>
              <dd className="font-semibold text-neutral-950 dark:text-white">
                {userName || "Recruiter"}
              </dd>
            </div>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300">
                Primary Email
              </dt>
              <dd className="font-mono text-neutral-950 dark:text-white font-medium">
                {userEmail || "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* ── Audio & AI Pipeline Specification ── */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">
              Architecture
            </p>
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              Voice & Scoring Pipeline
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
            <div className="p-3.5 border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-l-blue-600">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">Transport & VAD</p>
              <p className="mt-1 font-bold text-neutral-950 dark:text-white">LiveKit WebRTC + Silero VAD</p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Sub-100ms real-time audio socket</p>
            </div>
            <div className="p-3.5 border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 border-l-4 border-l-emerald-600">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">Transcription</p>
              <p className="mt-1 font-bold text-neutral-950 dark:text-white">Groq Whisper Large Turbo</p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Streaming real-time speech-to-text</p>
            </div>
            <div className="p-3.5 border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 border-l-4 border-l-purple-600">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-300">Voice Synthesis</p>
              <p className="mt-1 font-bold text-neutral-950 dark:text-white">Deepgram Aura 48kHz</p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Studio quality neural voice agent</p>
            </div>
            <div className="p-3.5 border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 border-l-4 border-l-indigo-600">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-indigo-700 dark:text-indigo-300">Automated Evaluation</p>
              <p className="mt-1 font-bold text-neutral-950 dark:text-white">Rubric LLM Scoring</p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Multi-factor candidate assessment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

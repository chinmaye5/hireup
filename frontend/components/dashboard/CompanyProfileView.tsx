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
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
          Organization
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
          Company Settings
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          Workspace specifications, recruiter account info, and speech pipeline configuration.
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* ── Workspace Block ── */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-semibold text-neutral-950 dark:text-white">
              {initialLetter}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Workspace
              </p>
              <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
                {company.name}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
              Identifier
            </p>
            <p className="text-[12px] font-mono text-neutral-600 dark:text-neutral-300">
              {company.id}
            </p>
          </div>
        </div>

        {/* ── Recruiter Account Specifications ── */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
              Account
            </p>
            <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
              Recruiter Credentials
            </h3>
          </div>
          <dl className="divide-y divide-neutral-100 dark:divide-neutral-800 text-[13px]">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                Full Name
              </dt>
              <dd className="font-medium text-neutral-950 dark:text-white">
                {userName || "Recruiter"}
              </dd>
            </div>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                Primary Email
              </dt>
              <dd className="font-mono text-neutral-950 dark:text-white">
                {userEmail || "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* ── Audio & AI Pipeline Specification ── */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
              Architecture
            </p>
            <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
              Voice & Scoring Pipeline
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
            <div className="p-3 border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
              <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Transport & VAD</p>
              <p className="mt-1 font-medium text-neutral-950 dark:text-white">LiveKit WebRTC + Silero VAD</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Sub-100ms real-time audio socket</p>
            </div>
            <div className="p-3 border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
              <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Transcription</p>
              <p className="mt-1 font-medium text-neutral-950 dark:text-white">Groq Whisper Large Turbo</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Streaming real-time speech-to-text</p>
            </div>
            <div className="p-3 border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
              <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Voice Synthesis</p>
              <p className="mt-1 font-medium text-neutral-950 dark:text-white">Deepgram Aura 48kHz</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Studio quality neural voice agent</p>
            </div>
            <div className="p-3 border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
              <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">Automated Evaluation</p>
              <p className="mt-1 font-medium text-neutral-950 dark:text-white">Rubric LLM Scoring</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Multi-factor candidate assessment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

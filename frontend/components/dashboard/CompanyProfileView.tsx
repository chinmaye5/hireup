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
    <div className="bg-white border border-neutral-200 rounded-xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Company Profile</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Details about your recruiting organization and workspace.
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-lg">
        {/* Workspace Card */}
        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-extrabold text-2xl">
            {initialLetter}
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-base">{company.name}</h3>
            <p className="text-xs text-neutral-500">Workspace ID: {company.id}</p>
          </div>
        </div>

        {/* Recruiter Details Card */}
        <div className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-2 text-xs">
          <p className="text-neutral-500 font-semibold uppercase tracking-wider">
            Recruiter Account
          </p>
          <p className="text-neutral-800 font-medium">
            Email: {userEmail || "—"}
          </p>
          <p className="text-neutral-800 font-medium">
            Full Name: {userName || "Recruiter"}
          </p>
        </div>

        {/* Infrastructure Highlights Card */}
        <div className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-2 text-xs">
          <p className="text-neutral-500 font-semibold uppercase tracking-wider">
            Interview Infrastructure
          </p>
          <p className="text-neutral-700">
            • Real-time low-latency voice pipeline (LiveKit WebRTC + Silero VAD)
          </p>
          <p className="text-neutral-700">
            • Fast STT Transcription (Groq Whisper Large Turbo)
          </p>
          <p className="text-neutral-700">
            • Studio Voice Synthesis (Deepgram Aura 48kHz)
          </p>
          <p className="text-neutral-700">
            • Automated AI Candidate Scoring & Rubric Evaluation
          </p>
        </div>
      </div>
    </div>
  );
}

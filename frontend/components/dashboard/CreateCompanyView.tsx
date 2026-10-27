"use client";

type CreateCompanyViewProps = {
  companyName: string;
  setCompanyName: (value: string) => void;
  creatingCompany: boolean;
  onCreateCompany: (e: React.FormEvent) => void;
};

export default function CreateCompanyView({
  companyName,
  setCompanyName,
  creatingCompany,
  onCreateCompany,
}: CreateCompanyViewProps) {
  return (
    <div className="max-w-md mx-auto my-16 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500">
          Setup Workspace
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
          Create Organization
        </h2>
        <p className="mt-2 text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Set up your recruiting workspace to begin defining technical interview rubrics and inviting candidates.
        </p>
      </div>

      <form onSubmit={onCreateCompany} className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400 mb-2">
            Company Name
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Technologies"
            className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-[13px] text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={creatingCompany}
          className="w-full h-9 text-[13px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {creatingCompany ? "Initializing Workspace…" : "Create Workspace"}
        </button>
      </form>
    </div>
  );
}

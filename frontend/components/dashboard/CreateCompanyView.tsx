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
    <div className="max-w-md mx-auto my-16 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 space-y-6 border-t-4 border-t-indigo-600 shadow-sm">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
          Setup Workspace
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
          Create Organization
        </h2>
        <p className="mt-2 text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Set up your recruiting workspace to begin defining technical interview rubrics and inviting candidates.
        </p>
      </div>

      <form onSubmit={onCreateCompany} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700 dark:text-neutral-300 mb-2">
            Company Name
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Technologies"
            className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-[13px] text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={creatingCompany}
          className="w-full h-9 text-[13px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-40 transition-all"
        >
          {creatingCompany ? "Initializing Workspace…" : "Create Workspace"}
        </button>
      </form>
    </div>
  );
}

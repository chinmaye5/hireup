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
    <div className="max-w-md mx-auto my-12 bg-white rounded-xl border border-neutral-200 p-8 shadow-sm">
      <div className="w-12 h-12 bg-neutral-900 text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4">
        🏢
      </div>
      <h2 className="text-xl font-bold text-neutral-900">Create Your Company</h2>
      <p className="text-sm text-neutral-600 mt-2 mb-6">
        Welcome to HireUp! Set up your company workspace to begin creating technical
        interview templates and inviting candidates.
      </p>

      <form onSubmit={onCreateCompany} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Technologies"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <button
          type="submit"
          disabled={creatingCompany}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-white font-medium hover:bg-neutral-800 disabled:opacity-50 transition"
        >
          {creatingCompany ? "Creating Workspace..." : "Create Workspace"}
        </button>
      </form>
    </div>
  );
}

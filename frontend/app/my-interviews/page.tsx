"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { apiRequest } from "@/lib/api";

type CandidateAttempt = {
  attempt_id: string;
  company_name: string;
  interview_title: string;
  status: string;
  time_limit_min: number;
  expires_at: string;
  created_at: string;
};

export default function MyInterviewsPage() {
  const { getToken, isLoaded } = useAuth();

  const [attempts, setAttempts] = useState<CandidateAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    async function loadMyAttempts() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const data = await apiRequest<CandidateAttempt[]>(
          "/api/my-attempts",
          "GET",
          token
        );
        setAttempts(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load interviews");
      } finally {
        setLoading(false);
      }
    }

    loadMyAttempts();
  }, [getToken, isLoaded]);

  if (loading) {
    return <p className="py-12 text-center text-neutral-500">Loading your interviews...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">My Interviews</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Technical interviews sent to your verified email addresses.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
          No pending interviews found for your verified email address.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {attempts.map((att) => (
            <div
              key={att.attempt_id}
              className="rounded-lg border border-neutral-200 bg-white p-5 flex items-center justify-between shadow-sm"
            >
              <div>
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                  {att.company_name}
                </span>
                <h3 className="text-lg font-bold text-neutral-950 mt-0.5">
                  {att.interview_title}
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  Time limit: {att.time_limit_min} mins · Status:{" "}
                  <span className="capitalize font-semibold text-neutral-900">
                    {att.status}
                  </span>{" "}
                  · Expires: {new Date(att.expires_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                {att.status === "invited" ? (
                  <Link
                    href={`/interview/${att.attempt_id}`}
                    className="rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 shadow-sm"
                  >
                    Start Interview
                  </Link>
                ) : (
                  <span className="text-xs text-neutral-600 font-semibold capitalize bg-neutral-100 px-2.5 py-1 rounded">
                    {att.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

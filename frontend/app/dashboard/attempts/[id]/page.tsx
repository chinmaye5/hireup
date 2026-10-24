"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiRequest } from "@/lib/api";

type TranscriptMessage = {
  role: "interviewer" | "candidate";
  text: string;
  timestamp: string;
};

type PerQuestionScore = {
  question_index: number;
  score: number;
  notes: string;
};

type AttemptResult = {
  overall_score: number;
  per_question: PerQuestionScore[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  model: string;
  scored_at: string;
};

type FullAttempt = {
  id: string;
  interview_id: string;
  email: string;
  interview_title: string;
  company_name: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  transcript: TranscriptMessage[];
  result: AttemptResult | null;
  result_error: string | null;
};

export default function AttemptDetailPage() {
  const params = useParams();
  const attemptId = params.id as string;
  const { getToken, isLoaded } = useAuth();

  const [attempt, setAttempt] = useState<FullAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescoring, setRescoring] = useState(false);

  async function loadAttempt() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await apiRequest<FullAttempt>(
        `/api/attempts/${attemptId}`,
        "GET",
        token
      );
      setAttempt(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load attempt details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded && attemptId) {
      loadAttempt();
    }
  }, [attemptId, isLoaded]);

  async function handleRescore() {
    setRescoring(true);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/attempts/${attemptId}/rescore`, "POST", token);
      await loadAttempt();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to re-score attempt");
    } finally {
      setRescoring(false);
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-neutral-500">Loading attempt details...</p>;
  }

  if (!attempt) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 mb-4">{error || "Attempt not found"}</p>
        <Link href="/dashboard" className="text-sm underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-8">
      <div>
        <Link
          href={`/dashboard/interviews/${attempt.interview_id}`}
          className="text-xs text-neutral-500 hover:underline"
        >
          &larr; Back to Interview
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-neutral-950">
              Candidate: {attempt.email}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Role: {attempt.interview_title} · Status:{" "}
              <span className="capitalize font-semibold">{attempt.status}</span>
            </p>
          </div>
          <button
            onClick={handleRescore}
            disabled={rescoring}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950 transition-colors shadow-sm disabled:opacity-50"
          >
            {rescoring ? "Re-scoring with LLM..." : "Re-score Attempt"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Evaluation Results Section */}
      {attempt.result ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">AI Evaluation</h2>
              <p className="text-xs text-neutral-600 mt-0.5">
                Recommendation:{" "}
                <span className="capitalize font-bold text-neutral-950">
                  {attempt.result.recommendation}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-neutral-950">
                {attempt.result.overall_score}
              </span>
              <span className="text-neutral-600 text-sm"> / 10</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-neutral-700 mb-1">Summary</h3>
            <p className="text-sm text-neutral-800 leading-relaxed">{attempt.result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md bg-green-50 border border-green-200 p-4">
              <h4 className="text-xs font-bold text-green-900 mb-2">Strengths</h4>
              <ul className="list-disc list-inside text-xs text-green-950 space-y-1">
                {attempt.result.strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
              <h4 className="text-xs font-bold text-amber-900 mb-2">Areas for Growth</h4>
              <ul className="list-disc list-inside text-xs text-amber-950 space-y-1">
                {attempt.result.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-neutral-700 mb-2">
              Per-Question Breakdown
            </h3>
            <div className="space-y-3">
              {attempt.result.per_question.map((q) => (
                <div key={q.question_index} className="border border-neutral-200 bg-neutral-50 rounded p-3 text-xs">
                  <div className="flex justify-between font-bold text-neutral-950 mb-1">
                    <span>Question {q.question_index}</span>
                    <span className="text-neutral-900">{q.score} / 10</span>
                  </div>
                  <p className="text-neutral-700 leading-relaxed">{q.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          {attempt.result_error ? (
            <p className="text-red-600">Scoring Error: {attempt.result_error}</p>
          ) : (
            <p>No evaluation available yet. The attempt will be scored once completed.</p>
          )}
        </div>
      )}

      {/* Full Transcript Section */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900 mb-4">Conversation Transcript</h2>
        {attempt.transcript.length === 0 ? (
          <p className="text-sm text-neutral-600">No messages recorded.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {attempt.transcript.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-xs max-w-xl ${
                  msg.role === "interviewer"
                    ? "bg-neutral-100 text-neutral-900 self-start"
                    : "bg-blue-50 text-blue-950 self-end border border-blue-200"
                }`}
              >
                <div className="font-bold mb-1 uppercase tracking-wider text-[10px] text-neutral-500">
                  {msg.role === "interviewer" ? "AI Interviewer" : "Candidate"}
                </div>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

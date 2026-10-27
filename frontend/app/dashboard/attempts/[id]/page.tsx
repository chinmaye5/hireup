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
      setError(err instanceof Error ? err.message : "Failed to load attempt");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded || !attemptId) return;
    loadAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, isLoaded]);

  async function handleRescore() {
    setRescoring(true);
    setError(null);
    try {
      const token = await getToken();
      await apiRequest(`/api/attempts/${attemptId}/score`, "POST", token);
      await loadAttempt();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to re-score attempt");
    } finally {
      setRescoring(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-950 dark:border-t-white rounded-full animate-spin" />
        <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
          Loading candidate report…
        </p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-16 text-center space-y-4">
        <p className="text-[13px] font-mono text-red-600 dark:text-red-400">{error || "Attempt not found"}</p>
        <Link href="/dashboard" className="text-[13px] font-medium text-neutral-950 dark:text-white underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 space-y-8">
      {/* ── Breadcrumb & Title ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/dashboard/interviews/${attempt.interview_id}`}
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 hover:text-neutral-950 dark:hover:text-white transition-colors"
          >
            &larr; Back to {attempt.interview_title}
          </Link>
          <button
            onClick={handleRescore}
            disabled={rescoring}
            className="h-8 px-3 text-[12px] font-medium border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:border-neutral-900 dark:hover:border-white transition-colors disabled:opacity-40"
          >
            {rescoring ? "Re-scoring…" : "Re-score Attempt"}
          </button>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
              Evaluation Report
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              {attempt.email}
            </h1>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
              Role: <strong className="font-semibold text-neutral-950 dark:text-white">{attempt.interview_title}</strong> · Status: <span className="uppercase text-[11px] font-mono tracking-wider">{attempt.status}</span>
            </p>
          </div>

          {attempt.result && (
            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-3 text-right shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Score
              </p>
              <p className="text-3xl font-semibold tabular-nums text-neutral-950 dark:text-white leading-tight">
                {attempt.result.overall_score}<span className="text-sm font-normal text-neutral-400">/10</span>
              </p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mt-0.5">
                {attempt.result.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="border-l-2 border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 p-3 text-[12px] font-mono">
          {error}
        </div>
      )}

      {/* ── Evaluation Section ── */}
      {attempt.result ? (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
              Executive Evaluation Summary
            </p>
            <p className="text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200 font-sans">
              {attempt.result.summary}
            </p>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                Demonstrated Strengths
              </p>
              <ul className="space-y-2 text-[13px] text-neutral-800 dark:text-neutral-200">
                {attempt.result.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-neutral-400 select-none">—</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">
                Areas for Development
              </p>
              <ul className="space-y-2 text-[13px] text-neutral-800 dark:text-neutral-200">
                {attempt.result.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-neutral-400 select-none">—</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Per Question Breakdown */}
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
                Rubric Analysis
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-neutral-950 dark:text-white">
                Per-Question Scoring Breakdown
              </h2>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {attempt.result.per_question.map((q) => (
                <div key={q.question_index} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      Question {String(q.question_index).padStart(2, "0")}
                    </p>
                    <p className="text-[13px] text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      {q.notes}
                    </p>
                  </div>
                  <div className="text-right sm:w-20 shrink-0">
                    <span className="text-lg font-semibold tabular-nums text-neutral-950 dark:text-white">
                      {q.score}
                    </span>
                    <span className="text-[11px] text-neutral-400">/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
          {attempt.result_error ? (
            <p className="text-[13px] font-mono text-red-600 dark:text-red-400">
              Scoring error: {attempt.result_error}
            </p>
          ) : (
            <p className="text-[13px] text-neutral-400 dark:text-neutral-500">
              Evaluation not completed yet. Once the session is concluded, AI scoring will generate automatically.
            </p>
          )}
        </div>
      )}

      {/* ── Conversation Transcript ── */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">
              Audio Recording
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-neutral-950 dark:text-white">
              Verbatim Dialogue Transcript
            </h2>
          </div>
          <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 tabular-nums">
            {attempt.transcript.length} utterances
          </span>
        </div>

        {attempt.transcript.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-neutral-400 dark:text-neutral-500">
              No recorded transcript messages.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 p-2">
            {attempt.transcript.map((msg, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
                <div className="sm:w-36 shrink-0 space-y-0.5">
                  <p className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                    msg.role === "candidate" ? "text-neutral-950 dark:text-white" : "text-neutral-400 dark:text-neutral-500"
                  }`}>
                    {msg.role === "candidate" ? "Candidate" : "Interviewer"}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                    {msg.timestamp || "—"}
                  </p>
                </div>
                <div className="flex-1 text-[13px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

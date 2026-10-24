"use client";

import "@livekit/components-styles";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Track } from "livekit-client";
import {
  BarVisualizer,
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { apiRequest } from "@/lib/api";

type StartResponse = {
  token: string;
  url: string;
  room_name: string;
};

function InterviewVisualizerView() {
  // Agent side: state ("listening" | "thinking" | "speaking") + its audio track
  const { state, audioTrack } = useVoiceAssistant();

  // Candidate side: microphone track
  const { localParticipant, microphoneTrack } = useLocalParticipant();
  const micRef = microphoneTrack
    ? {
        participant: localParticipant,
        publication: microphoneTrack,
        source: Track.Source.Microphone,
      }
    : undefined;

  return (
    <div className="flex w-full flex-col items-center gap-8 max-w-md mx-auto">
      <section className="w-full text-center">
        <p className="mb-2 text-sm text-neutral-500">
          Interviewer · <span className="font-medium text-neutral-900 capitalize">{state}</span>
        </p>
        <div className="h-24 w-full flex items-center justify-center bg-neutral-50 rounded-lg border border-neutral-200">
          <BarVisualizer state={state} barCount={7} trackRef={audioTrack} />
        </div>
      </section>

      <section className="w-full text-center">
        <p className="mb-2 text-sm text-neutral-500">Your Microphone</p>
        <div className="h-16 w-full flex items-center justify-center bg-neutral-50 rounded-lg border border-neutral-200">
          <BarVisualizer barCount={7} trackRef={micRef} />
        </div>
      </section>
    </div>
  );
}

export default function InterviewRoomPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const { getToken } = useAuth();

  const [conn, setConn] = useState<StartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const authToken = await getToken();
      const res = await apiRequest<StartResponse>(
        `/api/attempts/${attemptId}/start`,
        "POST",
        authToken
      );
      setConn(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    setConn(null);
    setIsFinished(true);
  }

  return (
    <main className="py-12 flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto px-4">
      {isFinished ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center flex flex-col gap-4">
          <h2 className="text-xl font-bold text-neutral-900">Interview Finished</h2>
          <p className="text-sm text-neutral-600">
            Thank you for completing the interview. The company will review your answers and evaluation.
          </p>
        </div>
      ) : !conn ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center flex flex-col items-center gap-6 w-full">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Ready for your Interview?</h1>
            <p className="text-sm text-neutral-500 mt-2">
              Please ensure your microphone is enabled and you are in a quiet environment.
            </p>
          </div>

          <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 text-left w-full">
            <span className="font-bold">Notice:</span> Please allow microphone access when prompted.
            Your voice and conversation transcript will be recorded and shared with the hiring company.
            {/* TODO: Add explicit consent checkbox */}
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full rounded-md bg-neutral-900 px-6 py-3 text-white font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Connecting to AI Interviewer..." : "Start Interview Call"}
          </button>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700 w-full">
              {error}
            </div>
          )}
        </div>
      ) : (
        <LiveKitRoom
          token={conn.token}
          serverUrl={conn.url}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={handleDisconnect}
          data-lk-theme="default"
          className="flex w-full flex-col items-center gap-8"
        >
          <InterviewVisualizerView />
          {/* Required for browser to play agent audio */}
          <RoomAudioRenderer />
          <ControlBar
            controls={{
              microphone: true,
              leave: true,
              camera: false,
              screenShare: false,
              chat: false,
              settings: false,
            }}
          />
        </LiveKitRoom>
      )}
    </main>
  );
}

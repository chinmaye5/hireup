"use client";

import "@livekit/components-styles";
import { useState } from "react";
import { Track } from "livekit-client";
import {
  BarVisualizer,
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";

const TOKEN_URL = "http://localhost:8000/api/token";

type TokenResponse = { token: string; url: string };

function InterviewView() {
  // Agent side: state ("listening" | "thinking" | "speaking") + its audio track
  const { state, audioTrack } = useVoiceAssistant();

  // Candidate side: your own microphone track
  const { localParticipant, microphoneTrack } = useLocalParticipant();
  const micRef = microphoneTrack
    ? {
      participant: localParticipant,
      publication: microphoneTrack,
      source: Track.Source.Microphone,
    }
    : undefined;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <section className="w-full">
        <p className="mb-2 text-sm text-neutral-500">
          Interviewer · <span className="font-medium text-neutral-800">{state}</span>
        </p>
        <div className="h-24 w-full">
          <BarVisualizer state={state} barCount={7} trackRef={audioTrack} />
        </div>
      </section>

      <section className="w-full">
        <p className="mb-2 text-sm text-neutral-500">You</p>
        <div className="h-16 w-full">
          <BarVisualizer barCount={7} trackRef={micRef} />
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  const [conn, setConn] = useState<TokenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startInterview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(TOKEN_URL);
      if (!res.ok) throw new Error(`Token request failed (${res.status})`);
      setConn((await res.json()) as TokenResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      {!conn ? (
        <>
          <button
            onClick={startInterview}
            disabled={loading}
            className="rounded-md bg-neutral-900 px-6 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Start Interview Call"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      ) : (
        <LiveKitRoom
          token={conn.token}
          serverUrl={conn.url}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={() => setConn(null)}
          data-lk-theme="default"
          className="flex w-full flex-col items-center gap-8"
        >
          <InterviewView />
          {/* Without this, the agent's voice is never played in the browser */}
          <RoomAudioRenderer />
          <ControlBar
            controls={{ microphone: true, leave: true, camera: false, screenShare: false, chat: false, settings: false }}
          />
        </LiveKitRoom>
      )}
    </main>
  );
}
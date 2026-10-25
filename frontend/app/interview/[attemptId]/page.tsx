"use client";

import "@livekit/components-styles";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth, useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
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

type AttemptPublicInfo = {
  attempt_id: string;
  company_name: string;
  interview_title: string;
  time_limit_min: number;
  expires_at: string;
  candidate_email: string;
  status: string;
  is_expired: boolean;
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
        <p className="mb-2 text-sm text-neutral-600">
          Interviewer · <span className="font-semibold text-neutral-950 capitalize">{state}</span>
        </p>
        <div className="h-24 w-full flex items-center justify-center bg-neutral-50 rounded-lg border border-neutral-200">
          <BarVisualizer state={state} barCount={7} trackRef={audioTrack} />
        </div>
      </section>

      <section className="w-full text-center">
        <p className="mb-2 text-sm text-neutral-600">Your Microphone</p>
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
  const { getToken, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const [attemptInfo, setAttemptInfo] = useState<AttemptPublicInfo | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [conn, setConn] = useState<StartResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Fetch interview metadata publicly before auth
  useEffect(() => {
    async function loadAttemptInfo() {
      setFetchingInfo(true);
      setInfoError(null);
      try {
        const data = await apiRequest<AttemptPublicInfo>(
          `/api/attempts/${attemptId}/public-info`,
          "GET",
          null,
          null,
          false // Public endpoint — does not require auth token
        );
        setAttemptInfo(data);
      } catch (err: unknown) {
        setInfoError(err instanceof Error ? err.message : "Failed to load interview details");
      } finally {
        setFetchingInfo(false);
      }
    }

    if (attemptId) {
      loadAttemptInfo();
    }
  }, [attemptId]);

  async function handleStart() {
    setStarting(true);
    setStartError(null);
    try {
      const authToken = await getToken();
      const res = await apiRequest<StartResponse>(
        `/api/attempts/${attemptId}/start`,
        "POST",
        authToken
      );
      setConn(res);
    } catch (err: unknown) {
      setStartError(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setStarting(false);
    }
  }

  const handleDisconnect = useCallback(() => {
    setConn(null);
    setIsFinished(true);
  }, []);

  // Suppress harmless LiveKit DataChannel teardown errors that fire
  // every time a room closes (LOSSY, RELIABLE, DATA_TRACK_LOSSY channels).
  // The LiveKit SDK logs these internally via console.error BEFORE our
  // onError handler runs, so we intercept them at the console level too.
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const text = args.map(String).join(" ");
      const isDataChannelNoise =
        text.includes("User-Initiated Abort") ||
        text.includes("closed unexpectedly") ||
        text.includes("DataChannel error");
      if (!isDataChannelNoise) {
        originalConsoleError.apply(console, args);
      }
    };
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const handleRoomError = useCallback((error: Error) => {
    const msg = error?.message || "";
    const isDataChannelTeardown =
      msg.includes("User-Initiated Abort") ||
      msg.includes("closed unexpectedly");
    if (!isDataChannelTeardown) {
      console.error("LiveKit room error:", error);
    }
  }, []);

  // Check whether signed-in user's email matches the candidate_email
  const userEmails = user?.emailAddresses.map((e) => e.emailAddress.toLowerCase()) || [];
  const candidateEmailLower = attemptInfo?.candidate_email.toLowerCase() || "";
  const isEmailMatched = isSignedIn && userEmails.includes(candidateEmailLower);
  const currentEmailDisplay = user?.primaryEmailAddress?.emailAddress || userEmails[0] || "";

  return (
    <main className="py-12 flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto px-4">
      {isFinished ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center flex flex-col gap-4 shadow-sm w-full">
          <h2 className="text-xl font-bold text-neutral-950">Interview Finished</h2>
          <p className="text-sm text-neutral-600">
            Thank you for completing your interview. Your conversation has been recorded and evaluated for the hiring team.
          </p>
        </div>
      ) : !conn ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center flex flex-col items-center gap-6 w-full shadow-sm">
          {fetchingInfo ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-neutral-600">Loading interview details...</p>
            </div>
          ) : infoError ? (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-red-100 text-red-700 p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-neutral-950">Interview Link Not Found</h2>
              <p className="text-xs text-neutral-600 max-w-sm">{infoError}</p>
              <p className="text-xs text-neutral-500 mt-2">
                Please double-check your link or contact the hiring team for a new invitation.
              </p>
            </div>
          ) : attemptInfo ? (
            <>
              {/* Header: Company & Role */}
              <div className="text-center w-full">
                <span className="inline-block rounded-full bg-neutral-100 text-neutral-700 font-semibold px-3 py-1 text-xs mb-2 uppercase tracking-wider">
                  {attemptInfo.company_name}
                </span>
                <h1 className="text-2xl font-extrabold text-neutral-950">
                  {attemptInfo.interview_title}
                </h1>
                <p className="text-xs text-neutral-600 mt-1">
                  AI Voice Technical Interview
                </p>
              </div>

              {/* Interview Meta Details Grid */}
              <div className="w-full grid grid-cols-2 gap-3 text-left">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Company</span>
                  <span className="text-sm font-bold text-neutral-950 mt-0.5 block truncate">{attemptInfo.company_name}</span>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Role</span>
                  <span className="text-sm font-bold text-neutral-950 mt-0.5 block truncate">{attemptInfo.interview_title}</span>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Duration</span>
                  <span className="text-sm font-bold text-neutral-950 mt-0.5 block">{attemptInfo.time_limit_min} minutes</span>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Expires</span>
                  <span className="text-sm font-bold text-neutral-950 mt-0.5 block">{new Date(attemptInfo.expires_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Target Candidate Email Display */}
              <div className="w-full rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-medium">Invited Candidate:</span>
                <span className="font-semibold text-neutral-950 bg-white border border-neutral-200 px-2 py-0.5 rounded shadow-xs font-mono">
                  {attemptInfo.candidate_email}
                </span>
              </div>

              {/* Status Checks: Expired or Completed */}
              {attemptInfo.is_expired ? (
                <div className="w-full rounded-md bg-red-50 border border-red-200 p-4 text-center">
                  <p className="text-sm font-bold text-red-900">This Interview Has Expired</p>
                  <p className="text-xs text-red-700 mt-1">
                    The deadline for this interview passed on {new Date(attemptInfo.expires_at).toLocaleString()}.
                  </p>
                </div>
              ) : attemptInfo.status === "completed" || attemptInfo.status === "scored" ? (
                <div className="w-full rounded-md bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-sm font-bold text-green-900">Interview Completed</p>
                  <p className="text-xs text-green-800 mt-1">
                    You have already finished this interview. Thank you!
                  </p>
                </div>
              ) : !isSignedIn ? (
                /* Auth State 1: User is not logged in */
                <div className="w-full rounded-lg border border-blue-200 bg-blue-50/70 p-5 flex flex-col gap-3 text-left">
                  <div>
                    <h3 className="text-sm font-bold text-blue-950">Authentication Required</h3>
                    <p className="text-xs text-blue-900 mt-1 leading-relaxed">
                      To give this interview, please sign in with your invited email:{" "}
                      <span className="font-bold underline">{attemptInfo.candidate_email}</span>.
                    </p>
                  </div>
                  <SignInButton mode="modal" forceRedirectUrl={`/interview/${attemptId}`}>
                    <button className="w-full rounded-md bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 shadow-sm transition-colors text-center">
                      Sign In with {attemptInfo.candidate_email} to Give Interview
                    </button>
                  </SignInButton>
                </div>
              ) : !isEmailMatched ? (
                /* Auth State 2: User is logged in, but with a DIFFERENT email */
                <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-5 flex flex-col gap-3 text-left">
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">Wrong Account Signed In</h3>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      You are signed in as <span className="font-bold">{currentEmailDisplay}</span>, but this interview is reserved for{" "}
                      <span className="font-bold underline">{attemptInfo.candidate_email}</span>.
                    </p>
                  </div>
                  <SignOutButton redirectUrl={`/interview/${attemptId}`}>
                    <button className="w-full rounded-md border border-neutral-300 bg-white py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 shadow-sm transition-colors">
                      Sign Out & Log In with {attemptInfo.candidate_email}
                    </button>
                  </SignOutButton>
                </div>
              ) : (
                /* Auth State 3: User is signed in with the MATCHING email */
                <div className="w-full flex flex-col gap-4">
                  <div className="w-full rounded-md bg-green-50 border border-green-200 p-3 text-xs text-green-900 flex items-center justify-between">
                    <span className="font-medium">✓ Signed in as verified candidate:</span>
                    <span className="font-bold">{attemptInfo.candidate_email}</span>
                  </div>

                  <div className="rounded-md bg-neutral-50 border border-neutral-200 p-4 text-xs text-neutral-700 text-left leading-relaxed">
                    <span className="font-bold text-neutral-900">Microphone Notice:</span> Please ensure you are in a quiet room. When you click below, allow microphone permissions when prompted by your browser.
                  </div>

                  <button
                    onClick={handleStart}
                    disabled={starting}
                    className="w-full rounded-md bg-neutral-900 py-3.5 text-base font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 shadow-sm transition-colors"
                  >
                    {starting ? "Connecting to AI Interviewer..." : "Start Interview Call"}
                  </button>
                </div>
              )}

              {startError && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700 w-full text-left">
                  {startError}
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : (
        <LiveKitRoom
          token={conn.token}
          serverUrl={conn.url}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={handleDisconnect}
          onError={handleRoomError}
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


"use client";

import "@livekit/components-styles";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAuth, useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useVoiceAssistant,
} from "@livekit/components-react";
import { apiRequest } from "@/lib/api";
import { SiriWave } from "@/components/ui/siri-wave";

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

const roomGradient = "bg-gradient-to-br from-neutral-950 via-neutral-900 to-black";

const btn =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary = `${btn} bg-neutral-950 text-white hover:bg-neutral-800`;
const btnSecondary = `${btn} border border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50`;
const roomBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black";

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const MicIcon = () => (
  <Icon>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v3" />
  </Icon>
);
const MicOffIcon = () => (
  <Icon>
    <path d="m2 2 20 20" />
    <path d="M18.9 13.2A7 7 0 0 0 19 12v-2" />
    <path d="M5 10v2a7 7 0 0 0 12 5" />
    <path d="M15 9.3V5a3 3 0 0 0-5.7-1.3" />
    <path d="M9 9v3a3 3 0 0 0 5.1 2.1" />
    <path d="M12 19v3" />
  </Icon>
);
const CheckIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <Icon className={className}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
const AlertIcon = () => (
  <Icon className="h-6 w-6">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Icon>
);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const noticeTones = {
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-900",
};

function Notice({
  tone,
  title,
  children,
}: {
  tone: keyof typeof noticeTones;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3.5 text-sm leading-relaxed ${noticeTones[tone]}`}
    >
      {title && <p className="font-medium">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-neutral-950">{value}</dd>
    </div>
  );
}

function StatusCard({
  tone,
  title,
  children,
}: {
  tone: "success" | "danger";
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-8 py-10 text-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${tone === "success" ? "bg-neutral-950 text-white" : "bg-red-50 text-red-700"
          }`}
      >
        {tone === "success" ? <CheckIcon /> : <AlertIcon />}
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-neutral-950">{title}</h1>
      <div className="text-sm leading-relaxed text-neutral-600">{children}</div>
    </div>
  );
}

function Person({
  active,
  name,
  sub,
  status,
  children,
}: {
  active: boolean;
  name: string;
  sub?: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`h-24 w-24 overflow-hidden rounded-full border-2 transition-all duration-300 sm:h-32 sm:w-32 ${active ? "border-white shadow-[0_0_0_6px_rgba(255,255,255,0.12)]" : "border-white/20"
          }`}
      >
        {children}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold sm:text-base">{name}</p>
        {sub && <p className="text-xs text-neutral-400">{sub}</p>}
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-neutral-300">
          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-white/30"}`} />
          {status}
        </p>
      </div>
    </div>
  );
}

// Scales the wave to the screen height so everything fits without scrolling.
function useWaveSize() {
  const [size, setSize] = useState(240);
  useEffect(() => {
    const update = () => setSize(Math.max(150, Math.min(280, Math.round(window.innerHeight * 0.3))));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function InterviewVisualizerView({
  attemptInfo,
  onAgentJoined,
}: {
  attemptInfo: AttemptPublicInfo | null;
  onAgentJoined: () => void;
}) {
  // Agent side: state ("listening" | "thinking" | "speaking" | "connecting")
  const { state, agent } = useVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const room = useRoomContext();
  const { user } = useUser();
  const waveSize = useWaveSize();

  // Track how long we've been waiting for the agent to join
  const [agentWaitSec, setAgentWaitSec] = useState(0);
  const agentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (agent) {
      // Agent joined — clear the timer
      if (agentTimerRef.current) clearInterval(agentTimerRef.current);
      setAgentWaitSec(0);
      onAgentJoined();
      return;
    }
    // Start counting seconds waiting for the agent
    agentTimerRef.current = setInterval(() => setAgentWaitSec((s) => s + 1), 1000);
    return () => {
      if (agentTimerRef.current) clearInterval(agentTimerRef.current);
    };
  }, [agent, onAgentJoined]);

  const agentSpeaking = state === "speaking";
  const yourTurn = state === "listening" && isMicrophoneEnabled;
  const agentLabel =
    ({ speaking: "Speaking", thinking: "Thinking", listening: "Listening" } as Record<string, string>)[
    state
    ] ?? (agentWaitSec > 5 ? `Joining… (${agentWaitSec}s)` : "Joining…");
  const yourLabel = !isMicrophoneEnabled ? "Mic off" : yourTurn ? "Your turn" : "Mic on";

  // Agent not responding banner: show after 30s with no agent participant
  const agentTimedOut = !agent && agentWaitSec >= 45;

  const toggleMic = useCallback(() => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled).catch(() => { });
  }, [localParticipant, isMicrophoneEnabled]);

  // Disconnecting triggers LiveKitRoom's onDisconnected, which shows the "finished" screen.
  const endInterview = useCallback(() => {
    room.disconnect();
  }, [room]);

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden text-white ${roomGradient}`}>
      <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm text-neutral-400">{attemptInfo?.company_name}</p>
          <p className="truncate text-base font-medium">{attemptInfo?.interview_title}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-sm text-neutral-300">
          <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" />
          Live
        </span>
      </header>

      {/* Agent not responding warning */}
      {agentTimedOut && (
        <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-900/30 px-4 py-3 text-sm text-amber-200">
          <span className="mt-0.5 text-amber-400">⚠</span>
          <div>
            <p className="font-medium">The AI interviewer hasn&apos;t joined ({agentWaitSec}s)</p>
            <p className="mt-0.5 text-amber-300/80">
              This is a connection problem on our side, not yours, and your interview has not been used up.
              Leave now and press Start again.
            </p>
            <button
              type="button"
              onClick={endInterview}
              className="mt-3 rounded-lg bg-amber-200 px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-100"
            >
              Leave and retry
            </button>
          </div>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4">
        <div className="flex items-start justify-center gap-10 sm:gap-20">
          <Person active={agentSpeaking} name="AI Interviewer" sub={attemptInfo?.company_name} status={agentLabel}>
            <img src="/interview_avatar.png" alt="AI Interviewer" className="h-full w-full object-cover" />
          </Person>
          <Person active={yourTurn} name="You" sub="Candidate" status={yourLabel}>
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="You" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-700 text-3xl font-medium">
                {(user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U").toUpperCase()}
              </div>
            )}
          </Person>
        </div>

        <SiriWave
          variant="wave"
          size={waveSize}
          renderScale={0.75}
          className="shadow-[0_0_80px_rgba(59,130,246,0.3)]"
        />
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-3 px-4 pb-6 pt-4">
        <button
          type="button"
          onClick={toggleMic}
          className={`${roomBtn} ${isMicrophoneEnabled
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-white text-neutral-950 hover:bg-neutral-200"
            }`}
        >
          {isMicrophoneEnabled ? <MicIcon /> : <MicOffIcon />}
          {isMicrophoneEnabled ? "Mute" : "Unmute"}
        </button>
        <button type="button" onClick={endInterview} className={`${roomBtn} bg-red-600 text-white hover:bg-red-700`}>
          End interview
        </button>
      </footer>
    </div>
  );
}

export default function InterviewRoomPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [attemptInfo, setAttemptInfo] = useState<AttemptPublicInfo | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [conn, setConn] = useState<StartResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const agentJoinedRef = useRef(false);
  const markAgentJoined = useCallback(() => {
    agentJoinedRef.current = true;
  }, []);

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
      agentJoinedRef.current = false;
      setConn(res);
    } catch (err: unknown) {
      setStartError(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setStarting(false);
    }
  }

  const handleDisconnect = useCallback(async () => {
    setConn(null);
    if (agentJoinedRef.current) {
      setIsFinished(true);
      return;
    }
    // The interviewer never joined: give the invite back so the candidate can retry.
    try {
      const authToken = await getToken();
      await apiRequest(`/api/attempts/${attemptId}/release`, "POST", authToken);
    } catch {
      // Best effort. If this fails the recruiter can still reset the attempt.
    }
    setStartError("The AI interviewer didn’t join. Your interview wasn’t used. Please press Start again.");
  }, [attemptId, getToken]);

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

  // While the interview is active: hide the navbar and lock page scrolling
  useEffect(() => {
    if (!conn) return;
    const header = document.getElementById("main-header");
    const prevOverflow = document.body.style.overflow;
    if (header) header.style.display = "none";
    document.body.style.overflow = "hidden";
    return () => {
      if (header) header.style.display = "block";
      document.body.style.overflow = prevOverflow;
    };
  }, [conn]);

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
    <main
      className={
        conn
          ? "fixed inset-0 z-50 overflow-hidden bg-black"
          : "mx-auto flex min-h-[60vh] w-full max-w-4xl items-center px-4 py-10 sm:py-16"
      }
    >
      {isFinished ? (
        <StatusCard tone="success" title="Interview complete">
          Thank you for taking the time. Your conversation has been recorded and passed to the hiring
          team for evaluation. You can close this window.
        </StatusCard>
      ) : !conn ? (
        fetchingInfo ? (
          <div role="status" className="flex w-full flex-col items-center gap-3 py-16 text-sm text-neutral-500">
            <div className="h-7 w-7 rounded-full border-2 border-neutral-950 border-t-transparent motion-safe:animate-spin" />
            Loading interview details…
          </div>
        ) : infoError ? (
          <StatusCard tone="danger" title="We can’t find this interview">
            <p>{infoError}</p>
            <p className="mt-2 text-neutral-500">
              Make sure you opened the full link from your invitation email, or ask the hiring team for a
              new one.
            </p>
          </StatusCard>
        ) : attemptInfo ? (
          <section className="grid w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* The invitation */}
            <div className={`flex flex-col justify-between gap-10 p-8 text-white md:min-h-[540px] md:p-10 ${roomGradient}`}>
              <p className="text-sm text-neutral-400">{attemptInfo.company_name}</p>
              <div>
                <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  {attemptInfo.interview_title}
                </h1>
                <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-neutral-300">
                  A spoken interview with an AI interviewer. You answer out loud, and no camera is needed.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="/interview_avatar.png"
                  alt=""
                  className="h-11 w-11 rounded-full object-cover ring-1 ring-white/20"
                />
                <div>
                  <p className="text-sm font-medium">AI Interviewer</p>
                  <p className="text-xs text-neutral-400">Conducts your interview</p>
                </div>
              </div>
            </div>

            {/* Details + action */}
            <div className="flex flex-col gap-6 p-8 md:p-10">
              <dl className="divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
                <DetailRow label="Duration" value={`${attemptInfo.time_limit_min} minutes`} />
                <DetailRow label="Complete by" value={formatDate(attemptInfo.expires_at)} />
                <DetailRow label="Format" value="Voice only" />
                <DetailRow label="Invited as" value={attemptInfo.candidate_email} />
              </dl>

              {attemptInfo.is_expired ? (
                <Notice tone="danger" title="This interview has expired">
                  The deadline passed on {formatDateTime(attemptInfo.expires_at)}. Contact the hiring team at{" "}
                  {attemptInfo.company_name} to ask for a new link.
                </Notice>
              ) : attemptInfo.status === "completed" || attemptInfo.status === "scored" ? (
                <Notice tone="neutral" title="Interview completed">
                  You’ve already finished this interview. Thank you!
                </Notice>
              ) : !isSignedIn ? (
                /* Auth state 1: not signed in */
                <div className="flex flex-col gap-4">
                  <p className="text-sm leading-relaxed text-neutral-600">
                    This interview is reserved for the invited email address. Sign in with it to continue.
                  </p>
                  <SignInButton mode="modal" forceRedirectUrl={`/interview/${attemptId}`}>
                    <button type="button" className={btnPrimary}>
                      Sign in to continue
                    </button>
                  </SignInButton>
                </div>
              ) : !isEmailMatched ? (
                /* Auth state 2: signed in with a different email */
                <div className="flex flex-col gap-4">
                  <Notice tone="warning" title="Wrong account">
                    You’re signed in as <span className="font-medium">{currentEmailDisplay}</span>, but this
                    interview is reserved for{" "}
                    <span className="font-medium">{attemptInfo.candidate_email}</span>.
                  </Notice>
                  <SignOutButton redirectUrl={`/interview/${attemptId}`}>
                    <button type="button" className={btnSecondary}>
                      Sign out and switch account
                    </button>
                  </SignOutButton>
                </div>
              ) : (
                /* Auth state 3: signed in with the matching email */
                <div className="flex flex-col gap-5">
                  <p className="flex items-center gap-2 text-sm font-medium text-neutral-950">
                    <CheckIcon className="h-4 w-4" />
                    Signed in with the invited email
                  </p>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-600 marker:text-neutral-400">
                    <li>Find a quiet place where you won’t be interrupted.</li>
                    <li>Use headphones if you can, to avoid echo.</li>
                    <li>Allow microphone access when your browser asks.</li>
                  </ul>
                  <button type="button" onClick={handleStart} disabled={starting} className={btnPrimary}>
                    {starting ? "Connecting…" : "Start interview"}
                  </button>
                </div>
              )}

              {startError && (
                <Notice tone="danger" title="Couldn’t start the interview">
                  {startError}
                </Notice>
              )}
            </div>
          </section>
        ) : null
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
          className="flex h-full w-full"
        >
          <InterviewVisualizerView attemptInfo={attemptInfo} onAgentJoined={markAgentJoined} />
          {/* Required for browser to play agent audio */}
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </main>
  );
}
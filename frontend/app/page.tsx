"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="py-16 text-center max-w-2xl mx-auto flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold tracking-tight text-neutral-950">
        AI Voice Technical Interviewer
      </h1>
      <p className="text-lg text-neutral-600">
        HireUp helps companies conduct low-latency, real-time voice interviews
        powered by LiveKit WebRTC and AI. Candidates receive a unique link and
        interview live through voice.
      </p>

      <div className="flex gap-4 mt-4">
        <SignedIn>
          <Link
            href="/dashboard"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-white font-medium hover:bg-neutral-800"
          >
            Go to Recruiter Dashboard
          </Link>
          <Link
            href="/my-interviews"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-neutral-800 font-medium hover:bg-neutral-100"
          >
            View My Interviews
          </Link>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-md bg-neutral-900 px-6 py-2.5 text-white font-medium hover:bg-neutral-800">
              Get Started (Sign In)
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </main>
  );
}
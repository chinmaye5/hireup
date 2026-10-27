"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { PrismaHero, WordsPullUp } from "@/components/ui/prisma-hero";
import { ArrowRight, Sparkles, FileText, Send, CheckCircle2 } from "lucide-react";

const btnBase =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer active:scale-95";
const btnPrimary = `${btnBase} bg-white text-neutral-950 hover:bg-neutral-100 shadow-lg shadow-black/20 font-semibold`;
const btnSecondary = `${btnBase} border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:border-white/40`;

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Write the interview",
    body: "Add your questions and a structured scoring rubric for each one.",
  },
  {
    icon: Send,
    step: "02",
    title: "Invite by email",
    body: "Candidates receive a unique, private voice link tied to their email.",
  },
  {
    icon: CheckCircle2,
    step: "03",
    title: "Review the results",
    body: "Instant score out of 10, key strengths, full transcript & recommendation.",
  },
];

export default function HomePage() {
  return (
    <div className="relative w-full">
      <PrismaHero>
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-between px-6 py-8 sm:px-10 md:py-12 lg:px-12">



          {/* Main Hero Message & CTAs */}
          <div className="my-auto max-w-3xl py-8">
            <h1 className="text-white">
              <WordsPullUp
                text="Run voice interviews without scheduling a single call."
                className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
              />
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              HireUp’s AI interviewer asks your questions out loud, listens to every answer, and scores candidates
              against your rubric. You get an instant rating, an accurate transcript, and an unbiased hiring decision.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <SignedIn>
                <Link href="/dashboard" className={`${btnPrimary} group`}>
                  <span>Open dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/my-interviews" className={btnSecondary}>
                  My interviews
                </Link>
              </SignedIn>

              <SignedOut>
                <SignUpButton mode="modal">
                  <button type="button" className={`${btnPrimary} group`}>
                    <span>Get started free</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button type="button" className={btnSecondary}>
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>

          {/* Bottom 3-Step Glassmorphic Cards */}
          <div className="pb-2">
            <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.12] hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-transform group-hover:scale-105">
                        <Icon className="h-4 w-4 text-white/90" />
                      </div>
                      <span className="text-xs font-mono font-semibold tracking-wider text-white/40">
                        {item.step}
                      </span>
                    </div>

                    <h3 className="mt-3.5 text-sm sm:text-base font-medium text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/70">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </PrismaHero>
    </div>
  );
}
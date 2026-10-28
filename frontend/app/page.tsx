"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { PrismaHero, WordsPullUp } from "@/components/ui/prisma-hero";
import { ArrowRight, FileText, Send, CheckCircle2 } from "lucide-react";
import AtAGlance from "@/components/landing/AtAGlance";
import ProductTour from "@/components/landing/ProductTour";
import Features from "@/components/landing/Features";
import UseCases from "@/components/landing/UseCases";
import Comparison from "@/components/landing/Comparison";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

const btnPrimary =
  "inline-flex h-9 sm:h-10 items-center justify-center px-4 sm:px-5 text-[13px] font-medium bg-white text-neutral-950 hover:bg-neutral-200 transition-colors group cursor-pointer";
const btnSecondary =
  "inline-flex h-9 sm:h-10 items-center justify-center px-4 sm:px-5 text-[13px] font-medium border border-white/25 bg-black/40 text-white backdrop-blur-sm hover:border-white transition-colors cursor-pointer";

const steps = [
  {
    icon: FileText,
    step: "01",
    tag: "RUBRIC",
    title: "Write the interview",
    body: "Specify your questions and a structured scoring rubric for each one.",
  },
  {
    icon: Send,
    step: "02",
    tag: "DISPATCH",
    title: "Invite by email",
    body: "Candidates receive a unique, private voice link tied to their email.",
  },
  {
    icon: CheckCircle2,
    step: "03",
    tag: "EVALUATION",
    title: "Review the results",
    body: "Instant score out of 10, key strengths, full transcript & recommendation.",
  },
];

export default function HomePage() {
  return (
    <div className="relative w-full">
      <PrismaHero>
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-between px-6 py-8 sm:px-10 md:py-12 lg:px-12">
          {/* ── Main Hero Section ── */}
          <div className="my-auto max-w-3xl py-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-white/70">
                Autonomous Interview Intelligence
              </span>
            </div>

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

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SignedIn>
                <Link href="/dashboard" className={`${btnPrimary} group`}>
                  <span>Open Dashboard</span>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/my-interviews" className={btnSecondary}>
                  My Interviews
                </Link>
              </SignedIn>

              <SignedOut>
                <SignUpButton mode="modal">
                  <button type="button" className={`${btnPrimary} group`}>
                    <span>Get Started Free</span>
                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button type="button" className={btnSecondary}>
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>

          {/* ── Bottom 3-Step Swiss Architectural Cards ── */}
          <div className="pb-2">
            <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="border border-white/15 bg-black/60 backdrop-blur-md p-5 transition-colors hover:border-white/40 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-7 w-7 items-center justify-center border border-white/20 bg-white/5 text-white">
                        <Icon className="h-3.5 w-3.5 text-white/90" />
                      </div>
                      <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
                        {item.step} / {item.tag}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-[14px] font-semibold text-white tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                        {item.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PrismaHero>

      <AtAGlance />
      <ProductTour />
      <Features />
      <UseCases />
      <Comparison />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex h-10 items-center justify-center px-5 text-[13px] font-medium transition-colors cursor-pointer group";

const styles = {
  // for the always-dark final CTA band
  dark: {
    primary: "bg-white text-neutral-950 hover:bg-neutral-200",
    secondary: "border border-white/25 text-white hover:border-white",
  },
  // adapts to light / dark theme
  theme: {
    primary: "bg-foreground text-background hover:opacity-90",
    secondary: "border border-foreground/25 text-foreground hover:border-foreground",
  },
};

export default function CtaButtons({ tone = "theme" }: { tone?: "dark" | "theme" }) {
  const s = styles[tone];
  const arrow = (
    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SignedIn>
        <Link href="/dashboard" className={cn(base, s.primary)}>
          <span>Open Dashboard</span>
          {arrow}
        </Link>
        <Link href="/my-interviews" className={cn(base, s.secondary)}>
          My Interviews
        </Link>
      </SignedIn>
      <SignedOut>
        <SignUpButton mode="modal">
          <button type="button" className={cn(base, s.primary)}>
            <span>Get Started Free</span>
            {arrow}
          </button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button type="button" className={cn(base, s.secondary)}>
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}

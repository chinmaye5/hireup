import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { DesktopNav, MobileNav } from "@/components/NavLinks";
import LandingNav from "@/components/landing/LandingNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireUp - AI Voice Technical Interviews",
  description: "Real-time AI voice technical interviews",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const btnGhost = `hidden h-8 items-center px-3.5 text-[13px] font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors sm:inline-flex ${focusRing}`;
const btnPrimary = `inline-flex h-8 items-center px-4 text-[13px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20 active:translate-y-px transition-all ${focusRing}`;

// Voice-level bars with vivid indigo accent
function LogoMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 border border-indigo-500/40">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="3" y="9" width="3" height="6" />
        <rect x="8" y="4" width="3" height="16" />
        <rect x="13" y="7" width="3" height="10" />
        <rect x="18" y="10" width="3" height="4" />
      </svg>
    </span>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkPubKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_bW9mock1rZXktZm9yLWJ1aWxkLXRpbWUtb25seS5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <html lang="en" className="h-full dark" suppressHydrationWarning>
        <body
          className="min-h-full flex flex-col bg-background text-foreground font-sans"
          suppressHydrationWarning
        >
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
          >
            Skip to content
          </a>

          {/* Keep id="main-header", the interview room hides it by id. Keep h-16: the hero is sized to calc(100vh - 4rem). */}
          <header
            id="main-header"
            className="sticky top-0 z-40 h-16 border-b border-border/80 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
          >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex items-center gap-8">
                <Link
                  href="/"
                  className={`flex items-center gap-2.5 text-[15px] font-bold tracking-tight text-neutral-950 dark:text-white ${focusRing}`}
                >
                  <LogoMark />
                  <span>
                    Hire<span className="text-indigo-600 dark:text-indigo-400">Up</span>
                  </span>
                </Link>
                <SignedIn>
                  <DesktopNav />
                </SignedIn>
                <SignedOut>
                  <LandingNav />
                </SignedOut>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <SignedIn>
                  <MobileNav />
                  <span className="mx-1 hidden h-5 w-px bg-border md:block" aria-hidden="true" />
                  <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button type="button" className={btnGhost}>
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button type="button" className={btnPrimary}>
                      Get started
                    </button>
                  </SignUpButton>
                </SignedOut>
              </div>
            </div>
          </header>

          <div id="content" className="flex-1 w-full flex flex-col">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
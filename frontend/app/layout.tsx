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
import "./globals.css";

export const metadata: Metadata = {
  title: "HireUp - AI Voice Interviewer",
  description: "Real-time AI voice technical interviews",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";
const btnGhost = `hidden h-8 items-center px-3 text-[13px] font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors sm:inline-flex ${focusRing}`;
const btnPrimary = `inline-flex h-8 items-center px-3.5 text-[13px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-opacity ${focusRing}`;

// Four voice-level bars: the product is a voice interview.
function LogoMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950">
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
    "pk_test_bW9jay1rZXktZm9yLWJ1aWxkLXRpbWUtb25seS5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <html lang="en" className="h-full dark" suppressHydrationWarning>
        <body
          className="min-h-full flex flex-col bg-background text-foreground font-sans"
          suppressHydrationWarning
        >
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Skip to content
          </a>

          {/* Keep id="main-header", the interview room hides it by id. Keep h-16: the hero is sized to calc(100vh - 4rem). */}
          <header
            id="main-header"
            className="sticky top-0 z-40 h-16 border-b border-border bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex items-center gap-8">
                <Link
                  href="/"
                  className={`flex items-center gap-2.5 rounded-full text-[15px] font-semibold tracking-tight text-foreground ${focusRing}`}
                >
                  <LogoMark />
                  HireUp
                </Link>
                <SignedIn>
                  <DesktopNav />
                </SignedIn>
              </div>

              <div className="flex items-center gap-2">
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
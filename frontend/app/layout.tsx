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
import "./globals.css";

export const metadata: Metadata = {
  title: "HireUp - AI Voice Interviewer",
  description: "Real-time AI voice technical interviews",
};

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
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body
          className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 font-sans"
          suppressHydrationWarning
        >
          <header className="border-b border-neutral-200 bg-white sticky top-0 z-10" id="main-header">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
              <Link href="/" className="font-bold text-lg text-neutral-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">H</span>
                HireUp
              </Link>
              <nav className="flex items-center gap-3 text-sm">
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="text-neutral-600 hover:text-neutral-900 font-medium"
                  >
                    Recruiter Dashboard
                  </Link>
                  <Link
                    href="/my-interviews"
                    className="text-neutral-600 hover:text-neutral-900 font-medium"
                  >
                    My Interviews
                  </Link>
                  <ThemeToggle />
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <ThemeToggle />
                  <SignInButton mode="modal">
                    <button className="text-neutral-700 hover:text-neutral-900 font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-neutral-900 text-white px-3 py-1.5 rounded-md hover:bg-neutral-800 font-medium">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
              </nav>
            </div>
          </header>
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}

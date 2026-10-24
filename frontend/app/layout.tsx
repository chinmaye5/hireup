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
      <html lang="en" className="h-full">
        <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 font-sans">
          <header className="border-b border-neutral-200 bg-white">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="font-bold text-lg text-neutral-900">
                HireUp
              </Link>
              <nav className="flex items-center gap-4 text-sm">
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
                  <UserButton />
                </SignedIn>
                <SignedOut>
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
          <div className="flex-1 max-w-5xl w-full mx-auto p-4">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/my-interviews", label: "My interviews" },
];

function isActive(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

export function DesktopNav() {
    const pathname = usePathname();

    return (
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                            focusRing,
                            active
                                ? "bg-foreground/10 text-foreground"
                                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        )}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}

export function MobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    return (
        <>
            <button
                type="button"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground md:hidden",
                    focusRing
                )}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
                </svg>
            </button>

            {open && (
                <div
                    id="mobile-nav"
                    className="absolute inset-x-0 top-full border-b border-border bg-background/95 p-3 backdrop-blur-xl md:hidden"
                >
                    <nav aria-label="Mobile" className="mx-auto flex max-w-7xl flex-col gap-1">
                        {links.map((link) => {
                            const active = isActive(pathname, link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "flex h-11 items-center rounded-xl px-4 text-[15px] font-medium transition-colors",
                                        focusRing,
                                        active
                                            ? "bg-foreground/10 text-foreground"
                                            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </>
    );
}
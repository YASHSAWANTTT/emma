"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isTranslate = pathname === "/translate";
  const isPractice = pathname === "/practice";

  return (
    <>
      <header className="appNav">
        <Link href="/" className="appNavBrand">
          Emma
        </Link>
        <nav className="appNavLinks" aria-label="Main">
          <Link href="/" className={isHome ? "appNavLink appNavLinkActive" : "appNavLink"}>
            Home
          </Link>
          <Link
            href="/translate"
            className={isTranslate ? "appNavLink appNavLinkActive" : "appNavLink"}
          >
            Translate
          </Link>
          <Link
            href="/practice"
            className={isPractice ? "appNavLink appNavLinkActive" : "appNavLink"}
          >
            Practice
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}

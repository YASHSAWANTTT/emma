"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const isTranslate = pathname === "/";
  const isPractice = pathname === "/practice";

  return (
    <>
      <header className="appNav">
        <Link href="/" className="appNavBrand">
          Emma
        </Link>
        <nav className="appNavLinks" aria-label="Main">
          <Link href="/" className={isTranslate ? "appNavLink appNavLinkActive" : "appNavLink"}>
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

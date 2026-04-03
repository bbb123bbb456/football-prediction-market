"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AccountPanel } from "./AccountPanel";
import { CreateMarketModal } from "./CreateMarketModal";
import { Logo, LogoMark } from "./Logo";
import { LEAGUE_SLUGS, LEAGUES } from "@/lib/constants";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "py-2" : ""}`}>
      <div
        className="mx-auto transition-all duration-500"
        style={{ maxWidth: isScrolled ? "80rem" : "100%" }}
      >
        <div
          className="backdrop-blur-xl border-b transition-all duration-500"
          style={{
            borderColor: `oklch(0.3 0.02 0 / ${isScrolled ? 0.7 : 0.3})`,
            background: `linear-gradient(135deg, oklch(0.14 0.01 0 / ${isScrolled ? 0.95 : 0.8}) 0%, oklch(0.12 0.01 0 / ${isScrolled ? 0.9 : 0.75}) 100%)`,
            borderRadius: isScrolled ? "0 0 16px 16px" : "0",
          }}
        >
          <div className="px-4 md:px-6 mx-auto max-w-screen-xl">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <LogoMark size="sm" className="flex md:hidden" />
                <Logo size="sm" className="hidden md:flex" />
                <span className="text-base md:text-lg font-bold">Top 5 Leagues</span>
              </Link>

              {/* Desktop League Nav */}
              <nav className="hidden xl:flex items-center gap-1">
                {LEAGUE_SLUGS.map((slug) => (
                  <Link
                    key={slug}
                    href={`/league/${slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                  >
                    <span>{LEAGUES[slug].emoji}</span>
                    <span className="hidden 2xl:inline">{LEAGUES[slug].name}</span>
                    <span className="2xl:hidden">{LEAGUES[slug].country}</span>
                  </Link>
                ))}
              </nav>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                <Link
                  href="/leaderboard"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-accent hover:bg-white/5 transition-all"
                >
                  🏆 Leaderboard
                </Link>
                <Link
                  href="/my-bets"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-accent hover:bg-white/5 transition-all"
                >
                  🎫 My Bets
                </Link>
                <CreateMarketModal />
                <AccountPanel />
                {/* Mobile menu toggle */}
                <button
                  className="xl:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {menuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
              <div className="xl:hidden pb-4 border-t border-white/10 mt-2 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LEAGUE_SLUGS.map((slug) => (
                  <Link
                    key={slug}
                    href={`/league/${slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                  >
                    <span>{LEAGUES[slug].emoji}</span>
                    <span className="text-muted-foreground">{LEAGUES[slug].name}</span>
                  </Link>
                ))}
                <Link href="/leaderboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">
                  🏆 <span className="text-muted-foreground">Leaderboard</span>
                </Link>
                <Link href="/my-bets" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">
                  🎫 <span className="text-muted-foreground">My Bets</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

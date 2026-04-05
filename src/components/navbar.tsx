"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

const publicNavLinks = [
  { href: "/coaches", label: "Coaches" },
  { href: "/tryouts", label: "Tryouts" },
  { href: "/timeline", label: "Timeline" },
  { href: "/documents", label: "Documents" },
  { href: "/faq", label: "FAQ" },
];

// When logged in, only show FAQ
const loggedInNavLinks = [
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();
  const pathname = usePathname();
  const navLinks = user ? loggedInNavLinks : publicNavLinks;

  // Track scroll for glassmorphism transition
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const linkClass = (href: string) =>
    isActive(href)
      ? "text-white text-sm font-semibold uppercase tracking-wide bg-white/15 px-3 py-1.5 rounded-lg transition-all duration-300"
      : "text-white/60 hover:text-white text-sm font-semibold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all duration-300 hover:bg-white/[0.08]";

  const mobileLinkClass = (href: string) =>
    isActive(href)
      ? "block text-white font-display text-lg uppercase tracking-wider py-3 border-b border-white/10 bg-white/10 px-3 rounded-lg"
      : "block text-white/80 hover:text-white font-display text-lg uppercase tracking-wider py-3 border-b border-white/10";

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.clear();
    window.location.href = "/";
  }

  return (
    <>
      {/* Main Nav — Glassmorphism */}
      <nav
        className="fixed top-0 w-full z-[100] h-16 flex items-center justify-between px-5 md:px-8 transition-all duration-500 ease-out"
        style={{
          backgroundColor: scrolled
            ? "rgba(15, 27, 45, 0.75)"
            : "transparent",
          backdropFilter: scrolled ? "blur(16px) saturate(1.4)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px) saturate(1.4)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid transparent",
          boxShadow: scrolled
            ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.2)"
            : "none",
        }}
      >
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-star-gold-bright text-sm tracking-widest transition-transform duration-300 group-hover:scale-110">
            &#9733;&#9733;&#9733;
          </span>
          <span className="font-display text-xl font-bold text-white uppercase tracking-wider">
            Irvine All-Stars
          </span>
          <span className="text-star-gold-bright text-sm tracking-widest transition-transform duration-300 group-hover:scale-110">
            &#9733;&#9733;&#9733;
          </span>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            </li>
          ))}
          {user ? (
            <>
              {(role === "coach" || role === "admin") && (
                <li>
                  <Link href="/coach" className={linkClass("/coach")}>
                    Coach Portal
                  </Link>
                </li>
              )}
              {(role === "coach" || role === "parent") && (
                <li>
                  <Link href="/portal" className={linkClass("/portal")}>
                    Parent Portal
                  </Link>
                </li>
              )}
              {role === "admin" && (
                <li>
                  <Link href="/admin" className={linkClass("/admin")}>
                    Admin
                  </Link>
                </li>
              )}
              <li className="ml-3">
                <button
                  onClick={handleSignOut}
                  className="bg-flag-red hover:bg-flag-red-dark text-white px-5 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-flag-red/20 active:scale-[0.97]"
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li className="ml-3">
              <Link
                href="/auth/login"
                className="bg-flag-red hover:bg-flag-red-dark text-white px-5 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-300 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-flag-red/20 active:scale-[0.97]"
              >
                Sign In
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu — Frosted overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-[99] lg:hidden"
          style={{
            backgroundColor: "rgba(15, 27, 45, 0.92)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          }}
        >
          <ul className="flex flex-col p-6 gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={mobileLinkClass(link.href)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                {(role === "coach" || role === "admin") && (
                  <li className="mt-4">
                    <Link
                      href="/coach"
                      onClick={() => setMobileOpen(false)}
                      className={mobileLinkClass("/coach")}
                    >
                      Coach Portal
                    </Link>
                  </li>
                )}
                {(role === "coach" || role === "parent") && (
                  <li>
                    <Link
                      href="/portal"
                      onClick={() => setMobileOpen(false)}
                      className={mobileLinkClass("/portal")}
                    >
                      Parent Portal
                    </Link>
                  </li>
                )}
                {role === "admin" && (
                  <li>
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={mobileLinkClass("/admin")}
                    >
                      Admin
                    </Link>
                  </li>
                )}
                <li className="mt-4">
                  <button
                    onClick={() => { setMobileOpen(false); handleSignOut(); }}
                    className="block w-full bg-flag-red text-white text-center py-3 rounded-full font-display text-lg uppercase tracking-wider font-bold transition-all active:scale-[0.97]"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li className="mt-4">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block bg-flag-red text-white text-center py-3 rounded-full font-display text-lg uppercase tracking-wider font-bold transition-all active:scale-[0.97]"
                >
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}

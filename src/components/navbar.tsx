"use client";

import Link from "next/link";
import { useState } from "react";
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
  const { user, role } = useAuth();
  const pathname = usePathname();
  const navLinks = user ? loggedInNavLinks : publicNavLinks;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const linkClass = (href: string) =>
    isActive(href)
      ? "text-white text-sm font-semibold uppercase tracking-wide bg-white/15 px-3 py-1.5 rounded transition-colors"
      : "text-white/65 hover:text-white text-sm font-semibold uppercase tracking-wide px-3 py-1.5 rounded transition-colors";

  const mobileLinkClass = (href: string) =>
    isActive(href)
      ? "block text-white font-display text-lg uppercase tracking-wider py-3 border-b border-white/10 bg-white/10 px-3 rounded"
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
      {/* Announcement Bar — only for public visitors */}
      {!user && (
        <div className="fixed top-0 w-full z-[101] bg-cream border-b border-sand text-center py-1.5 px-4 overflow-hidden">
          <p className="text-flag-blue text-xs font-bold tracking-wider uppercase font-display whitespace-nowrap text-ellipsis overflow-hidden">
            <span className="text-star-gold">&#9733;</span> 2026 All-Stars
            Season — Applications Now Open{" "}
            <span className="text-star-gold">&#9733;</span>
          </p>
        </div>
      )}

      {/* Main Nav */}
      <nav className={`fixed w-full z-100 bg-flag-blue px-4 md:px-8 h-16 flex items-center justify-between ${user ? "top-0" : "top-[34px]"}`}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-star-gold-bright text-sm tracking-widest">
            &#9733;&#9733;&#9733;
          </span>
          <span className="font-display text-xl font-bold text-white uppercase tracking-wider">
            Irvine All-Stars
          </span>
          <span className="text-star-gold-bright text-sm tracking-widest">
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
              <li className="ml-2">
                <button
                  onClick={handleSignOut}
                  className="bg-flag-red hover:bg-flag-red-dark text-white px-4 py-1.5 rounded text-sm font-bold uppercase tracking-wide transition-colors"
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li className="ml-2">
              <Link
                href="/auth/login"
                className="bg-flag-red hover:bg-flag-red-dark text-white px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide transition-colors"
              >
                Sign In
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={`fixed inset-0 z-[99] bg-flag-blue lg:hidden ${user ? "top-16" : "top-[98px]"}`}>
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
                    className="block w-full bg-flag-red text-white text-center py-3 rounded font-display text-lg uppercase tracking-wider font-bold"
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
                  className="block bg-flag-red text-white text-center py-3 rounded-full font-display text-lg uppercase tracking-wider font-bold"
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

"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/coaches", label: "Coaches" },
  { href: "/tryouts", label: "Tryouts" },
  { href: "/timeline", label: "Timeline" },
  { href: "/documents", label: "Documents" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Announcement Bar */}
      <div className="fixed top-0 w-full z-[101] bg-cream border-b border-sand text-center py-1.5 px-4">
        <p className="text-flag-blue text-xs font-bold tracking-wider uppercase font-display">
          <span className="text-star-gold">&#9733;</span> 2026 All-Stars
          Season — Applications Now Open{" "}
          <span className="text-star-gold">&#9733;</span>
        </p>
      </div>

      {/* Main Nav */}
      <nav className="fixed top-[34px] w-full z-100 bg-flag-blue px-4 md:px-8 h-16 flex items-center justify-between">
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
        <ul className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-white/65 hover:text-white text-sm font-semibold uppercase tracking-wide transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/portal"
              className="bg-flag-red hover:bg-flag-red-dark text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Parent Portal
            </Link>
          </li>
        </ul>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[98px] z-[99] bg-flag-blue lg:hidden">
          <ul className="flex flex-col p-6 gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-white/80 hover:text-white font-display text-lg uppercase tracking-wider py-3 border-b border-white/10"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-4">
              <Link
                href="/portal"
                onClick={() => setMobileOpen(false)}
                className="block bg-flag-red text-white text-center py-3 rounded font-display text-lg uppercase tracking-wider font-bold"
              >
                Parent Portal
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  ClipboardCheck,
  Users,
  Award,
  BookOpen,
  Megaphone,
  UserCircle,
  ClipboardList,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { href: "/coach", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/tryouts", label: "Tryouts", icon: UserCheck },
  { href: "/coach/scores", label: "Enter Scores", icon: FileSpreadsheet },
  { href: "/coach/checklist", label: "Binder Checklist", icon: ClipboardCheck },
  { href: "/coach/pitching-log", label: "Pitching Log", icon: ClipboardList },
  { href: "/coach/roster", label: "Roster", icon: Users },
  { href: "/coach/contracts", label: "Contracts", icon: FileText },
  { href: "/coach/certifications", label: "Certifications", icon: Award },
  { href: "/coach/tournament-rules", label: "Tournament Rules", icon: BookOpen },
  { href: "/coach/updates", label: "Updates", icon: Megaphone },
];

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-off-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push(`/auth/login?redirect=${pathname}`);
    return null;
  }

  if (role !== "coach" && role !== "admin") {
    return (
      <div className="pt-16 min-h-screen bg-off-white flex items-center justify-center">
        <p className="text-flag-red font-semibold">Access denied. Coach role required.</p>
      </div>
    );
  }

  function isActive(href: string) {
    if (href === "/coach") return pathname === "/coach";
    return pathname.startsWith(href);
  }

  return (
    <div className="pt-16 min-h-screen bg-off-white">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-64px)] bg-white border-r border-gray-200 shrink-0">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-flag-blue">
              Coach Dashboard
            </h2>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    active
                      ? "bg-flag-blue text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-charcoal"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto p-4 border-t border-gray-200">
            <div className="flex items-center gap-2.5">
              <UserCircle size={20} className="text-flag-blue shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-flag-blue">
                  {role === "admin" ? "Admin" : "Coach"}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 pb-20 md:pb-6">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Tabs — horizontally scrollable */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 overflow-x-auto">
        <div className="flex min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${
                  active ? "text-flag-blue" : "text-gray-400"
                }`}
              >
                <Icon size={20} />
                <span>{item.label.length > 8 ? item.label.slice(0, 7) + "." : item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

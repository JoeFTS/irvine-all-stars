"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  Megaphone,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/registrations", label: "Registrations", icon: Users },
  { href: "/admin/scores", label: "Scores", icon: BarChart3 },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="pt-[98px] min-h-screen bg-off-white">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-98px)] bg-white border-r border-gray-200 shrink-0">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-flag-blue">
              Admin Panel
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
        </aside>

        {/* Main Content */}
        <div className="flex-1 pb-20 md:pb-6">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                active ? "text-flag-blue" : "text-gray-400"
              }`}
            >
              <Icon size={20} />
              <span>{item.label.length > 8 ? item.label.slice(0, 7) + "." : item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

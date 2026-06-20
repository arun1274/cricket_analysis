import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserSquare2, Target, Trophy, FileBarChart, LogOut, Building, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    api.get("/profile")
      .then((res) => {
        if (res.data.role === "ADMIN") {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Teams", href: "/teams", icon: Users },
    { name: "Players", href: "/players", icon: UserSquare2 },
    { name: "Practice (PPI)", href: "/practice", icon: Target },
    { name: "Matches (MPI)", href: "/matches", icon: Trophy },
    { name: "Reports", href: "/reports", icon: FileBarChart },
  ];

  if (isAdmin) {
    navItems.push({ name: "Organization", href: "/organization", icon: Building });
  }

  const currentItem = navItems.find((item) => item.href === pathname);
  const pageTitle = currentItem ? currentItem.name : "CPI";

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.replace("/login");
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/10 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold text-white tracking-tight">{pageTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white text-sm">
            C
          </div>
          <span className="text-sm font-semibold text-zinc-300">CPI</span>
        </div>
      </header>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={clsx(
          "w-64 border-r border-white/10 bg-black/95 lg:bg-black/50 backdrop-blur-xl h-screen fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white">
                C
              </div>
              <span className="text-xl font-bold tracking-tight text-white">CPI</span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200",
                    isActive
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer / Logout */}
          <div className="pt-4 border-t border-white/5 mt-auto">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

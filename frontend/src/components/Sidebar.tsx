import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserSquare2, Target, Trophy, FileBarChart, LogOut, Building } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <div className="w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CPI</span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
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
      </div>

      <div className="mt-auto p-6">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}

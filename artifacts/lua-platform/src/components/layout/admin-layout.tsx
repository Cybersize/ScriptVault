import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Terminal, Key, FileCode, Activity, LogOut, Code2 } from "lucide-react";
import { useAdminSecret } from "@/hooks/use-admin-secret";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { secret, setSecret } = useAdminSecret();

  if (!secret) {
    setLocation("/admin");
    return null;
  }

  const handleLogout = () => {
    setSecret(null);
    setLocation("/admin");
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Activity },
    { href: "/admin/licenses", label: "Licenses", icon: Key },
    { href: "/admin/scripts", label: "Scripts", icon: FileCode },
    { href: "/admin/logs", label: "Access Logs", icon: Terminal },
    { href: "/admin/lua-loader", label: "Lua Loader", icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-3 text-primary">
          <Terminal className="w-6 h-6" />
          <h1 className="font-mono font-bold text-xl tracking-tight">ScriptVault</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-md font-mono text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md font-mono text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

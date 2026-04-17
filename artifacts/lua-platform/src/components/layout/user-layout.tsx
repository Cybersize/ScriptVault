import { ReactNode } from "react";
import { Link } from "wouter";
import { Terminal } from "lucide-react";

export function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 text-primary cursor-pointer">
              <Terminal className="w-6 h-6" />
              <h1 className="font-mono font-bold text-xl tracking-tight">ScriptVault</h1>
            </div>
          </Link>
          <div className="text-xs font-mono text-muted-foreground">
            CLIENT_PORTAL // SECURE
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 pt-12 md:pt-24">
        {children}
      </main>

      <footer className="border-t border-border py-6 mt-12 text-center">
        <p className="text-xs font-mono text-muted-foreground">
          &copy; {new Date().getFullYear()} ScriptVault Licensing
        </p>
      </footer>
    </div>
  );
}

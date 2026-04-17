import { useState } from "react";
import { useLocation } from "wouter";
import { UserLayout } from "@/components/layout/user-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminSecret } from "@/hooks/use-admin-secret";
import { Terminal, Lock } from "lucide-react";

export default function AdminLogin() {
  const [_, setLocation] = useLocation();
  const { setSecret } = useAdminSecret();
  const [secretInput, setSecretInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!secretInput.trim()) {
      setError("Secret is required");
      return;
    }
    
    // In a real app we'd validate this against an endpoint
    // For this design task, we'll assume it's valid if provided and let the API requests fail if wrong
    setSecret(secretInput);
    setLocation("/admin/dashboard");
  };

  return (
    <UserLayout>
      <div className="w-full max-w-md mt-12">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-secondary/50 rounded-full mb-2 border border-border">
            <Terminal className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-3xl font-mono font-bold tracking-tight">Admin Terminal</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Enter root secret to access control center.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm font-mono">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Root Secret"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  className="font-mono bg-background border-border focus-visible:ring-primary"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full font-mono font-bold"
              >
                INITIALIZE
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}

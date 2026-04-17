import { useState } from "react";
import { useLocation } from "wouter";
import { useValidateLicense } from "@workspace/api-client-react";
import { UserLayout } from "@/components/layout/user-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, ShieldCheck, KeyRound, Cpu } from "lucide-react";

export default function Home() {
  const [_, setLocation] = useLocation();
  const [key, setKey] = useState("");
  const [hwid, setHwid] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateLicense = useValidateLicense();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!key.trim() || !hwid.trim()) {
      setError("License key and HWID are required.");
      return;
    }

    validateLicense.mutate(
      { data: { key, hwid } },
      {
        onSuccess: (data) => {
          if (data.valid) {
            // Store credentials for the user dashboard session
            sessionStorage.setItem("user_key", key);
            sessionStorage.setItem("user_hwid", hwid);
            setLocation("/user");
          } else {
            setError(data.message || "Invalid license key or HWID mismatch.");
          }
        },
        onError: (err: any) => {
          setError(err.message || "An error occurred during validation.");
        },
      }
    );
  };

  return (
    <UserLayout>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2 border border-primary/20">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-mono font-bold tracking-tight">License Validation</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Enter your credentials to access encrypted scripts.
          </p>
        </div>

        <Card className="border-border bg-card shadow-2xl shadow-primary/5">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Client Access
            </CardTitle>
            <CardDescription className="font-mono">
              Your HWID binds to your key upon first use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 font-mono">
                  <ShieldAlert className="w-4 h-4" />
                  <AlertTitle>Validation Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="key" className="font-mono text-xs uppercase text-muted-foreground">License Key</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="key"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="pl-10 font-mono bg-background border-border focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hwid" className="font-mono text-xs uppercase text-muted-foreground">Hardware ID (HWID)</Label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hwid"
                    placeholder="Enter your system HWID"
                    value={hwid}
                    onChange={(e) => setHwid(e.target.value)}
                    className="pl-10 font-mono bg-background border-border focus-visible:ring-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-mono font-bold tracking-wide group"
                disabled={validateLicense.isPending}
              >
                {validateLicense.isPending ? "Validating..." : "AUTHENTICATE"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useValidateLicense, useListScripts } from "@workspace/api-client-react";
import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Shield, Clock, HardDrive, Key, Code, Copy, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function UserDashboard() {
  const [location, setLocation] = useLocation();
  const [key, setKey] = useState<string | null>(null);
  const [hwid, setHwid] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const validateLicense = useValidateLicense();
  const { data: scripts, isLoading: scriptsLoading } = useListScripts();

  useEffect(() => {
    const k = sessionStorage.getItem("user_key");
    const h = sessionStorage.getItem("user_hwid");
    
    if (!k || !h) {
      setLocation("/");
      return;
    }
    
    setKey(k);
    setHwid(h);

    validateLicense.mutate({ data: { key: k, hwid: h } }, {
      onError: () => {
        // If validation fails now, kick them out
        sessionStorage.removeItem("user_key");
        sessionStorage.removeItem("user_hwid");
        setLocation("/");
      }
    });
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user_key");
    sessionStorage.removeItem("user_hwid");
    setLocation("/");
  };

  const copyScriptCode = (scriptId: number) => {
    if (!key || !hwid) return;
    
    const loaderCode = `getgenv().ScriptVault = { Key = "${key}" }
loadstring(game:HttpGet("https://your-domain.replit.app/api/scripts/${scriptId}/deliver?key=${key}&hwid=${hwid}"))()`;
    
    navigator.clipboard.writeText(loaderCode);
    setCopied(scriptId);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!key || !hwid) return null;

  return (
    <UserLayout>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-mono font-bold tracking-tight">Client Dashboard</h2>
            <p className="text-muted-foreground font-mono text-sm">
              Manage your active licenses and scripts.
            </p>
          </div>
          <Button variant="outline" className="font-mono text-xs" onClick={handleLogout}>
            DISCONNECT
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                License Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-mono uppercase">Key</span>
                <div className="flex items-center gap-2 font-mono text-sm break-all bg-background p-2 rounded border border-border">
                  <Key className="w-3 h-3 text-muted-foreground shrink-0" />
                  {key}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-mono uppercase">Bound HWID</span>
                <div className="flex items-center gap-2 font-mono text-sm break-all bg-background p-2 rounded border border-border">
                  <HardDrive className="w-3 h-3 text-muted-foreground shrink-0" />
                  {hwid}
                </div>
              </div>
              
              {validateLicense.isSuccess && validateLicense.data && (
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono uppercase">Status</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">
                    ACTIVE
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                Available Scripts
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Scripts you have access to with this license.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scriptsLoading ? (
                <div className="py-8 text-center text-muted-foreground font-mono text-sm">
                  Loading scripts...
                </div>
              ) : scripts && scripts.length > 0 ? (
                <div className="space-y-4">
                  {scripts.map(script => (
                    <div key={script.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg bg-background gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-mono font-bold">{script.name}</h4>
                          <Badge variant="secondary" className="text-[10px] h-5 rounded-sm font-mono">v{script.version}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {script.description || "No description provided."}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="font-mono text-xs shrink-0"
                        onClick={() => copyScriptCode(script.id)}
                      >
                        {copied === script.id ? (
                          <><CheckCircle2 className="w-3 h-3 mr-2 text-primary" /> COPIED</>
                        ) : (
                          <><Copy className="w-3 h-3 mr-2" /> COPY LOADER</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-border rounded-lg">
                  <Terminal className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-mono text-muted-foreground">No scripts available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}

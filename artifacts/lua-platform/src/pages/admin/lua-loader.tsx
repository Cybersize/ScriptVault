import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code2 } from "lucide-react";

export default function AdminLuaLoader() {
  const { toast } = useToast();

  const loaderCode = `-- ScriptVault Lua Loader
-- Replace YOUR_LICENSE_KEY and YOUR_HWID with actual values

local HttpService = game:GetService("HttpService")
local BASE_URL = "${window.location.origin}/api"
local LICENSE_KEY = "YOUR_LICENSE_KEY"
local HWID = game:GetService("RbxAnalyticsService"):GetClientId()
local SCRIPT_ID = 1  -- change to your script ID

-- Validate license
local function validate()
    local res = syn.request and syn.request({
        Url = BASE_URL .. "/validate",
        Method = "POST",
        Headers = { ["Content-Type"] = "application/json" },
        Body = HttpService:JSONEncode({ key = LICENSE_KEY, hwid = HWID })
    })
    if not res or res.StatusCode ~= 200 then
        error("Network error during validation")
    end
    local data = HttpService:JSONDecode(res.Body)
    if not data.valid then
        error("License invalid: " .. (data.message or "unknown"))
    end
    return true
end

-- Request script delivery
local function fetchScript()
    local res = syn.request({
        Url = BASE_URL .. "/scripts/" .. SCRIPT_ID .. "/deliver",
        Method = "POST",
        Headers = { ["Content-Type"] = "application/json" },
        Body = HttpService:JSONEncode({ key = LICENSE_KEY, hwid = HWID })
    })
    if not res or res.StatusCode ~= 200 then
        error("Failed to fetch script: " .. (res and res.StatusCode or "no response"))
    end
    local data = HttpService:JSONDecode(res.Body)
    return data.script
end

-- Run
local ok, err = pcall(function()
    validate()
    local code = fetchScript()
    local fn, loadErr = loadstring(code)
    if not fn then error("Parse error: " .. tostring(loadErr)) end
    fn()
end)

if not ok then
    warn("[ScriptVault] Error: " .. tostring(err))
end`;

  const handleCopy = () => {
    navigator.clipboard.writeText(loaderCode);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-mono font-bold tracking-tight">Lua Loader Guide</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Integration boilerplate for your Lua environment.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-mono flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                Loader Implementation
              </CardTitle>
              <CardDescription className="font-mono mt-1">
                Share this snippet with your users or embed it in your client software.
              </CardDescription>
            </div>
            <Button onClick={handleCopy} variant="secondary" className="font-mono text-xs">
              <Copy className="w-4 h-4 mr-2" />
              COPY CODE
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-md overflow-hidden bg-background border border-border">
              <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-muted-foreground">
                <code className="block whitespace-pre">
                  {loaderCode.split('\n').map((line, i) => (
                    <div key={i} className="table-row">
                      <span className="table-cell text-right pr-4 opacity-30 select-none">{i + 1}</span>
                      <span className="table-cell text-foreground/80">{line}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
            <div className="mt-4 p-4 bg-muted/30 border border-border rounded text-sm font-mono text-muted-foreground">
              <strong className="text-foreground">Requirements:</strong> Requires an execution environment that supports <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">syn.request</code> and <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">loadstring</code>.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

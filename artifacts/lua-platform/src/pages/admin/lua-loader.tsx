import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code2 } from "lucide-react";

export default function AdminLuaLoader() {
  const { toast } = useToast();

  const loaderCode = `-- ScriptVault Lua Loader v2
-- Compatible with: Synapse X, KRNL, Fluxus, Solara, and most modern executors
-- Edit the three lines below, then run.

local HttpService = game:GetService("HttpService")
local BASE_URL    = "https://YOUR-DOMAIN.replit.app/api"
local LICENSE_KEY = "XXXX-XXXX-XXXX-XXXX"
local SCRIPT_ID   = 1   -- change to the script ID you want to load
local HWID        = tostring(game:GetService("RbxAnalyticsService"):GetClientId())

-- ── HTTP detection (cross-executor) ────────────────────────────────────────
local httpRequest
if syn and type(syn) == "table" and syn.request then
    httpRequest = syn.request                -- Synapse X
elseif type(http) == "table" and http.request then
    httpRequest = http.request               -- some custom environments
elseif type(request) == "function" then
    httpRequest = request                    -- KRNL, Fluxus, Solara, etc.
elseif type(http_request) == "function" then
    httpRequest = http_request               -- older executors
else
    error("[ScriptVault] No HTTP function found. Use an executor that supports HTTP requests.")
end

-- ── Helpers ─────────────────────────────────────────────────────────────────
local function post(path, body)
    local ok, res = pcall(httpRequest, {
        Url     = BASE_URL .. path,
        Method  = "POST",
        Headers = { ["Content-Type"] = "application/json" },
        Body    = HttpService:JSONEncode(body),
    })
    if not ok then
        error("HTTP error: " .. tostring(res))
    end
    if res.StatusCode == 403 then
        local data = HttpService:JSONDecode(res.Body)
        error("Access denied: " .. (data.error or "unknown reason"))
    end
    if res.StatusCode ~= 200 then
        error("Server returned " .. tostring(res.StatusCode))
    end
    return HttpService:JSONDecode(res.Body)
end

-- ── Main ─────────────────────────────────────────────────────────────────────
local ok, err = pcall(function()
    -- Step 1: validate license
    local auth = post("/validate", { key = LICENSE_KEY, hwid = HWID })
    if not auth.valid then
        error(auth.message or "Invalid license")
    end

    -- Step 2: fetch & execute the encrypted script
    local result = post("/scripts/" .. SCRIPT_ID .. "/deliver", {
        key  = LICENSE_KEY,
        hwid = HWID,
    })

    local fn, loadErr = loadstring(result.script)
    if not fn then
        error("Failed to parse script: " .. tostring(loadErr))
    end
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
            <div className="mt-4 p-4 bg-muted/30 border border-border rounded text-sm font-mono text-muted-foreground space-y-2">
              <div><strong className="text-foreground">Executor support:</strong> Auto-detects HTTP function — works with Synapse X <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">syn.request</code>, KRNL/Fluxus/Solara <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">request</code>, and legacy <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">http_request</code>.</div>
              <div><strong className="text-foreground">Setup:</strong> Replace <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">YOUR-DOMAIN</code> with your deployed URL, set the <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">LICENSE_KEY</code> and <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">SCRIPT_ID</code>.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

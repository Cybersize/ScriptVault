import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code2 } from "lucide-react";

export default function AdminLuaLoader() {
  const { toast } = useToast();

  const loaderCode = `-- ╔═══════════════════════════════════════════════════╗
-- ║          ScriptVault Lua Loader  v3              ║
-- ║  Universal — works on every major executor       ║
-- ╚═══════════════════════════════════════════════════╝
--
--  EDIT THESE THREE LINES ONLY:
local BASE_URL    = "https://YOUR-DOMAIN.replit.app/api"
local LICENSE_KEY = "XXXX-XXXX-XXXX-XXXX"
local SCRIPT_ID   = 1   -- numeric ID from your admin panel
--
-- ────────────────────────────────────────────────────

local HttpService = game:GetService("HttpService")
local HWID = tostring(
    pcall(function() return game:GetService("RbxAnalyticsService"):GetClientId() end)
    and game:GetService("RbxAnalyticsService"):GetClientId()
    or tostring(game.JobId ~= "" and game.JobId or math.random(1e9))
)

-- ── Universal HTTP detection (pcall-guarded) ────────────────────────────────
--  Tested against: Synapse X · Script-Ware · KRNL · Fluxus · Solara
--                  Delta · Electron · Wave · Oxygen U · Evon · Celery
--                  Arceus X · Hydrogen · Vega X · Xeno · AWP X · Comet
--                  Nihon · Temple · Coco Z · JJSploit · WeAreDevs API
local httpRequest
do
    local candidates = {
        -- Modern standard (KRNL, Fluxus, Solara, Delta, Script-Ware,
        -- Electron, Wave, Oxygen U, Evon, Arceus X, Hydrogen, Vega X,
        -- Xeno, Comet, Celery, Coco Z, AWP X, Temple, Nihon, JJSploit, …)
        function() return type(request)             == "function" and request      end,
        -- Synapse X / legacy syn namespace
        function() return type(syn)                 == "table"
                      and type(syn.request)         == "function" and syn.request  end,
        -- Older executor global
        function() return type(http_request)        == "function" and http_request end,
        -- http namespace (some environments)
        function() return type(http)                == "table"
                      and type(http.request)        == "function" and http.request end,
        -- getgenv fallback (catches executors that inject into the global env late)
        function() return type(getgenv)             == "function"
                      and type(getgenv().request)   == "function" and getgenv().request end,
        -- fluxus namespace
        function() return type(fluxus)              == "table"
                      and type(fluxus.request)      == "function" and fluxus.request end,
        -- WeAreDevs / JJSploit HTTPS
        function() return type(HTTPS)               == "table"
                      and type(HTTPS.Request)       == "function"
                      and function(t)
                              return HTTPS.Request(t.Url, t.Method, t.Headers, t.Body)
                          end                                                       end,
    }

    for _, probe in ipairs(candidates) do
        local ok, fn = pcall(probe)
        if ok and fn then
            httpRequest = fn
            break
        end
    end

    if not httpRequest then
        error("[ScriptVault] No HTTP function found.\n"
            .."Your executor does not support HTTP requests, or it is outdated.\n"
            .."Try: Solara, KRNL, Delta, Fluxus, or Script-Ware.")
    end
end

-- ── HTTP helper ──────────────────────────────────────────────────────────────
local function post(path, body)
    local ok, res = pcall(httpRequest, {
        Url     = BASE_URL .. path,
        Method  = "POST",
        Headers = { ["Content-Type"] = "application/json" },
        Body    = HttpService:JSONEncode(body),
    })
    if not ok then
        error("[ScriptVault] Request failed: " .. tostring(res))
    end
    if not res or not res.StatusCode then
        error("[ScriptVault] Invalid response from server")
    end
    local data = HttpService:JSONDecode(res.Body)
    if res.StatusCode == 403 then
        error("[ScriptVault] Access denied: " .. (data.error or "unknown"))
    end
    if res.StatusCode == 429 then
        error("[ScriptVault] Rate limited — wait a moment and try again")
    end
    if res.StatusCode ~= 200 then
        error("[ScriptVault] Server error " .. res.StatusCode .. ": " .. (data.error or ""))
    end
    return data
end

-- ── Main ─────────────────────────────────────────────────────────────────────
local ok, err = pcall(function()
    -- 1. Validate license + bind HWID on first use
    local auth = post("/validate", { key = LICENSE_KEY, hwid = HWID })
    if not auth.valid then
        error(auth.message or "Invalid license key")
    end

    -- 2. Fetch encrypted script, decrypted + watermarked by server
    local result = post("/scripts/" .. tostring(SCRIPT_ID) .. "/deliver", {
        key  = LICENSE_KEY,
        hwid = HWID,
    })
    if not result.script or result.script == "" then
        error("Server returned an empty script")
    end

    -- 3. Execute
    local fn, loadErr = loadstring(result.script)
    if not fn then
        error("Script parse error: " .. tostring(loadErr))
    end
    fn()
end)

if not ok then
    warn("[ScriptVault] " .. tostring(err))
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
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-muted/30 border border-border rounded text-sm font-mono text-muted-foreground">
                <div className="text-foreground font-bold mb-2">Supported executors</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  {[
                    "Solara","KRNL","Delta","Fluxus","Script-Ware",
                    "Electron","Wave","Oxygen U","Evon","Celery",
                    "Arceus X","Hydrogen","Vega X","Xeno","Comet",
                    "AWP X","Nihon","Temple","Coco Z","JJSploit",
                    "Synapse X","WeAreDevs API","+ any executor with request()",""
                  ].map((name, i) => name ? (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-primary">▸</span> {name}
                    </span>
                  ) : null)}
                </div>
              </div>
              <div className="p-4 bg-muted/30 border border-border rounded text-sm font-mono text-muted-foreground">
                <strong className="text-foreground">Setup:</strong> Replace <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">YOUR-DOMAIN</code> with your deployed URL, then set <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">LICENSE_KEY</code> and <code className="bg-background px-1 py-0.5 rounded text-primary border border-border">SCRIPT_ID</code> at the top of the script. Nothing else needs to change.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

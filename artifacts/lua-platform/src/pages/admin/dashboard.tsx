import { useGetStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminSecret } from "@/hooks/use-admin-secret";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, FileCode, Activity, XCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { getHeaders } = useAdminSecret();
  const { data: stats, isLoading } = useGetStats({ request: { headers: getHeaders() } });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-mono font-bold tracking-tight">System Overview</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Real-time telemetry and statistics.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-border bg-card animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-mono text-transparent bg-muted rounded h-4 w-24"></CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-muted text-transparent rounded h-8 w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-mono font-medium text-muted-foreground">Total Licenses</CardTitle>
                  <Key className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{stats.totalLicenses}</div>
                  <div className="flex gap-2 mt-1 text-xs font-mono">
                    <span className="text-primary">{stats.activeLicenses} active</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-destructive">{stats.revokedLicenses} revoked</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-mono font-medium text-muted-foreground">Scripts</CardTitle>
                  <FileCode className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{stats.totalScripts}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">Hosted encrypted files</div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-mono font-medium text-muted-foreground">Total Requests</CardTitle>
                  <Activity className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{stats.totalRequests}</div>
                  <div className="flex gap-2 mt-1 text-xs font-mono">
                    <span className="text-primary">{stats.successfulRequests} OK</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-destructive">{stats.failedRequests} ERR</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-mono font-medium text-muted-foreground">Success Rate</CardTitle>
                  <CheckCircle className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">
                    {stats.totalRequests > 0 
                      ? Math.round((stats.successfulRequests / stats.totalRequests) * 100) 
                      : 0}%
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">API request success rate</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivity.map((log) => (
                      <div key={log.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          {log.status === "success" ? (
                            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive shrink-0" />
                          )}
                          <div>
                            <div className="text-sm font-mono">
                              {log.licenseKey ? log.licenseKey.substring(0, 8) + "..." : "Unknown"}
                              <span className="text-muted-foreground mx-2">→</span>
                              {log.status}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-2">
                              <span>{format(new Date(log.createdAt), "MMM d HH:mm:ss")}</span>
                              {log.ip && <span>• {log.ip}</span>}
                            </div>
                          </div>
                        </div>
                        {log.message && (
                          <div className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded max-w-[200px] truncate">
                            {log.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground font-mono text-sm">
                    No recent activity.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

import { useState } from "react";
import { useListLogs } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminSecret } from "@/hooks/use-admin-secret";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Terminal, Search, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminLogs() {
  const { getHeaders } = useAdminSecret();
  const [status, setStatus] = useState<string>("all");
  const [searchId, setSearchId] = useState("");

  const params: any = { limit: 100 };
  if (status !== "all") params.status = status;
  if (searchId && !isNaN(Number(searchId))) params.licenseId = Number(searchId);

  const { data: logs, isLoading } = useListLogs(params, { request: { headers: getHeaders() } });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-mono font-bold tracking-tight">Access Logs</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Audit trail for all license validations and script deliveries.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <Input 
              placeholder="Search by License ID..." 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-9 font-mono bg-card border-border"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] font-mono bg-card border-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="font-mono bg-card border-border">
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground">TIMESTAMP</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">KEY</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">SCRIPT ID</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">IP / HWID</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">MESSAGE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono text-sm">
                    Reading logs...
                  </TableCell>
                </TableRow>
              ) : Array.isArray(logs) && logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-border font-mono text-xs">
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      {log.status === "success" ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 rounded-sm font-mono px-1.5 h-5 text-[10px]">OK</Badge>
                      ) : (
                        <Badge variant="destructive" className="rounded-sm font-mono px-1.5 h-5 text-[10px] uppercase">{log.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate" title={log.licenseKey || ""}>
                      {log.licenseKey ? (
                        <span className="font-medium">{log.licenseKey.substring(0, 8)}...</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{log.scriptId || "-"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[150px] truncate">
                      <div>{log.ip || "-"}</div>
                      <div className="text-[10px] truncate" title={log.hwid || ""}>{log.hwid || "-"}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {log.message || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono text-sm">
                    No logs match criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

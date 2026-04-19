import { useState } from "react";
import { useListLicenses, useCreateLicense, useRevokeLicense, useDeleteLicense, useUpdateLicense } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminSecret } from "@/hooks/use-admin-secret";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Key, Plus, MoreHorizontal, ShieldOff, Trash2, RefreshCw, Copy, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListLicensesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLicenses() {
  const { getHeaders } = useAdminSecret();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [note, setNote] = useState("");
  const [expiresDays, setExpiresDays] = useState("");

  const { data: licenses, isLoading } = useListLicenses(
    { search: search || undefined }, 
    { request: { headers: getHeaders() } }
  );

  const createLicense = useCreateLicense({ request: { headers: getHeaders() } });
  const revokeLicense = useRevokeLicense({ request: { headers: getHeaders() } });
  const deleteLicense = useDeleteLicense({ request: { headers: getHeaders() } });
  const updateLicense = useUpdateLicense({ request: { headers: getHeaders() } });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    let expiresAt = null;
    if (expiresDays && !isNaN(Number(expiresDays))) {
      const date = new Date();
      date.setDate(date.getDate() + Number(expiresDays));
      expiresAt = date.toISOString();
    }

    createLicense.mutate(
      { data: { note: note || null, expiresAt } },
      {
        onSuccess: (newLicense) => {
          toast({ title: "License Created", description: newLicense.key });
          setIsCreateOpen(false);
          setNote("");
          setExpiresDays("");
          queryClient.invalidateQueries({ queryKey: getListLicensesQueryKey() });
        }
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-mono font-bold tracking-tight">License Management</h2>
            <p className="text-muted-foreground font-mono text-sm">
              Generate and manage access keys.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono font-bold">
                <Plus className="w-4 h-4 mr-2" />
                NEW LICENSE
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border font-mono">
              <DialogHeader>
                <DialogTitle>Generate License Key</DialogTitle>
                <DialogDescription>
                  Create a new key for a client.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-xs text-muted-foreground uppercase">Note (Optional)</Label>
                  <Input 
                    id="note" 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    placeholder="e.g. User Discord ID"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires" className="text-xs text-muted-foreground uppercase">Expiry (Days)</Label>
                  <Input 
                    id="expires" 
                    type="number" 
                    value={expiresDays} 
                    onChange={e => setExpiresDays(e.target.value)} 
                    placeholder="Leave empty for lifetime"
                    className="bg-background border-border"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createLicense.isPending} className="w-full font-bold">
                    {createLicense.isPending ? "GENERATING..." : "GENERATE"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input 
            placeholder="Search keys, HWID, notes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono bg-card border-border max-w-md"
          />
        </div>

        <div className="border border-border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground">KEY</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">HWID</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">NOTE</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">CREATED</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono text-sm">
                    Loading keys...
                  </TableCell>
                </TableRow>
              ) : Array.isArray(licenses) && licenses.length > 0 ? (
                licenses.map((license) => (
                  <TableRow key={license.id} className="border-border">
                    <TableCell className="font-mono text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {license.key.substring(0, 16)}...
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => copyToClipboard(license.key)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {license.revoked ? (
                        <Badge variant="destructive" className="font-mono text-[10px]">REVOKED</Badge>
                      ) : license.expiresAt && new Date(license.expiresAt) < new Date() ? (
                        <Badge variant="secondary" className="font-mono text-[10px] text-muted-foreground">EXPIRED</Badge>
                      ) : (
                        <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-[10px]">ACTIVE</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {license.hwid ? (
                        <span className="truncate max-w-[100px] inline-block" title={license.hwid}>{license.hwid}</span>
                      ) : (
                        <span className="opacity-50">Unbound</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[150px]">
                      {license.note || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(license.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border font-mono text-sm">
                          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem className="cursor-pointer" onClick={() => copyToClipboard(license.key)}>
                            <Copy className="w-4 h-4 mr-2" /> Copy Full Key
                          </DropdownMenuItem>
                          
                          {license.hwid && (
                            <DropdownMenuItem 
                              className="cursor-pointer" 
                              onClick={() => {
                                updateLicense.mutate(
                                  { id: license.id, data: { hwid: null } },
                                  { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLicensesQueryKey() }) }
                                );
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" /> Reset HWID
                            </DropdownMenuItem>
                          )}
                          
                          {!license.revoked && (
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive focus:text-destructive" 
                              onClick={() => {
                                revokeLicense.mutate(
                                  { id: license.id },
                                  { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLicensesQueryKey() }) }
                                );
                              }}
                            >
                              <ShieldOff className="w-4 h-4 mr-2" /> Revoke Access
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm("Delete this license completely?")) {
                                deleteLicense.mutate(
                                  { id: license.id },
                                  { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLicensesQueryKey() }) }
                                );
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete License
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono text-sm">
                    No licenses found.
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

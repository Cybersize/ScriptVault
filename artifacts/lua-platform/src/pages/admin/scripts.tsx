import { useState } from "react";
import { useListScripts, useCreateScript, useDeleteScript } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminSecret } from "@/hooks/use-admin-secret";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { FileCode, Plus, Trash2, Code2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListScriptsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminScripts() {
  const { getHeaders } = useAdminSecret();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  const { data: scripts, isLoading } = useListScripts({ request: { headers: getHeaders() } });
  const createScript = useCreateScript({ request: { headers: getHeaders() } });
  const deleteScript = useDeleteScript({ request: { headers: getHeaders() } });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !version || !content) return;

    createScript.mutate(
      { data: { name, version, content, description: description || null } },
      {
        onSuccess: () => {
          toast({ title: "Script uploaded & encrypted" });
          setIsCreateOpen(false);
          setName("");
          setVersion("1.0.0");
          setDescription("");
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number, scriptName: string) => {
    if (confirm(`Permanently delete script "${scriptName}"?`)) {
      deleteScript.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Script deleted" });
            queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-mono font-bold tracking-tight">Script Repository</h2>
            <p className="text-muted-foreground font-mono text-sm">
              Manage payloads delivered to authenticated clients.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono font-bold">
                <Plus className="w-4 h-4 mr-2" />
                UPLOAD SCRIPT
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border font-mono max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Payload</DialogTitle>
                <DialogDescription>
                  Scripts are encrypted at rest and dynamically decrypted on delivery.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase">Script Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase">Version</Label>
                    <Input value={version} onChange={e => setVersion(e.target.value)} required className="bg-background border-border" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">Description (Optional)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">Raw Lua Content</Label>
                  <Textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    required 
                    className="bg-background border-border font-mono text-xs min-h-[200px] h-[30vh]" 
                    placeholder="print('Hello World')"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createScript.isPending} className="w-full font-bold">
                    {createScript.isPending ? "ENCRYPTING & UPLOADING..." : "UPLOAD SCRIPT"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground font-mono text-sm border border-border rounded-lg bg-card">
              Loading scripts...
            </div>
          ) : Array.isArray(scripts) && scripts.length > 0 ? (
            scripts.map(script => (
              <Card key={script.id} className="border-border bg-card">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-mono text-lg flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-primary" />
                      {script.name}
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-normal ml-2">v{script.version}</span>
                    </CardTitle>
                    <CardDescription className="font-mono mt-1 text-xs">
                      ID: {script.id} • Updated: {format(new Date(script.updatedAt), "MMM d, yyyy HH:mm")}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(script.id, script.name)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono text-muted-foreground mb-4">
                    {script.description || "No description provided."}
                  </p>
                  <div className="text-xs font-mono text-muted-foreground bg-background border border-border p-3 rounded break-all select-all">
                    {script.encryptedPath}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground font-mono text-sm border border-border rounded-lg bg-card">
              <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              No scripts uploaded yet.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

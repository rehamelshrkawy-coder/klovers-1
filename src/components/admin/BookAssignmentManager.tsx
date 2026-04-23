import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BookOpen, Plus, Trash2, Search, Clock, CheckCircle2, Lock } from "lucide-react";

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
}

interface Assignment {
  id: string;
  user_id: string;
  book_id: string;
  enrollment_id: string | null;
  available_from: string;
  assigned_at: string;
  assigned_by: string;
  notes: string | null;
  profile?: { name: string | null; email: string | null };
}

function availabilityStatus(available_from: string): "available" | "upcoming" | "soon" {
  const diff = new Date(available_from).getTime() - Date.now();
  if (diff <= 0) return "available";
  if (diff < 3 * 24 * 60 * 60 * 1000) return "soon";
  return "upcoming";
}

function defaultAvailableFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 16);
}

const BookAssignmentManager = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [availableFrom, setAvailableFrom] = useState(defaultAvailableFrom());
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [assignRes, profileRes] = await Promise.all([
      supabase.from("book_assignments").select("*").order("assigned_at", { ascending: false }),
      supabase.from("profiles").select("user_id, name, email").order("name"),
    ]);
    if (assignRes.error) toast({ title: "Error loading assignments", description: assignRes.error.message, variant: "destructive" });
    if (profileRes.error) toast({ title: "Error loading users", description: profileRes.error.message, variant: "destructive" });

    const profileMap = new Map((profileRes.data ?? []).map((p: Profile) => [p.user_id, p]));
    const enriched = (assignRes.data ?? []).map((a: Assignment) => ({
      ...a,
      profile: profileMap.get(a.user_id),
    }));
    setAssignments(enriched);
    setProfiles(profileRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const assignedUserIds = new Set(assignments.map(a => a.user_id));
  const filteredProfiles = profiles.filter(p => {
    const q = userSearch.toLowerCase();
    return (p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)) && !assignedUserIds.has(p.user_id);
  });

  const handleAssign = async () => {
    if (!selectedUser) { toast({ title: "Select a student first", variant: "destructive" }); return; }
    if (!availableFrom) { toast({ title: "Set an availability date", variant: "destructive" }); return; }

    const { data: { user } } = await supabase.auth.getUser();

    setSaving(true);
    const { error } = await supabase.from("book_assignments").insert({
      user_id: selectedUser.user_id,
      book_id: "hangul-1",
      available_from: new Date(availableFrom).toISOString(),
      assigned_by: user?.email ?? "admin",
      notes: notes.trim() || null,
    });
    setSaving(false);

    if (error) {
      toast({ title: "Failed to assign", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Book assigned!", description: `Hangul Book 1 assigned to ${selectedUser.name ?? selectedUser.email}` });
      setShowDialog(false);
      setSelectedUser(null);
      setUserSearch("");
      setNotes("");
      setAvailableFrom(defaultAvailableFrom());
      fetchData();
    }
  };

  const handleRemove = async (id: string, name: string | null | undefined) => {
    if (!confirm(`Remove Hangul Book 1 from ${name ?? "this student"}?`)) return;
    const { error } = await supabase.from("book_assignments").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Assignment removed" }); fetchData(); }
  };

  const filtered = assignments.filter(a => {
    const q = search.toLowerCase();
    return !q || a.profile?.name?.toLowerCase().includes(q) || a.profile?.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search students…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs w-56"
          />
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowDialog(true)}>
          <Plus className="h-3.5 w-3.5" /> Assign Book
        </Button>
      </div>

      {/* Book info banner */}
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-amber-500 shrink-0" />
          <div>
            <div className="text-sm font-semibold">Hangul Book 1 — الهانغول</div>
            <div className="text-xs text-muted-foreground">
              Assigned to students who purchased a class. Unlocks on the specified date (default: 1 week after assignment).
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">{assignments.length} assigned</Badge>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="text-xs text-muted-foreground py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground py-8 text-center">
          {search ? "No matches found." : "No books assigned yet. Click \"Assign Book\" to get started."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Student</TableHead>
              <TableHead className="text-xs">Book</TableHead>
              <TableHead className="text-xs">Available From</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Assigned By</TableHead>
              <TableHead className="text-xs">Notes</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => {
              const status = availabilityStatus(a.available_from);
              return (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">
                    <div className="font-medium">{a.profile?.name ?? "—"}</div>
                    <div className="text-muted-foreground">{a.profile?.email ?? a.user_id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">Hangul Book 1</TableCell>
                  <TableCell className="text-xs">
                    {new Date(a.available_from).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    <div className="text-muted-foreground">
                      {new Date(a.available_from).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {status === "available" && (
                      <Badge className="gap-1 text-xs bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3 w-3" /> Live
                      </Badge>
                    )}
                    {status === "soon" && (
                      <Badge className="gap-1 text-xs bg-amber-100 text-amber-800 border-amber-200">
                        <Clock className="h-3 w-3" /> Soon
                      </Badge>
                    )}
                    {status === "upcoming" && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Lock className="h-3 w-3" /> Scheduled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.assigned_by}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{a.notes ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(a.id, a.profile?.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Assign dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-amber-500" /> Assign Hangul Book 1
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Student search */}
            <div className="space-y-1.5">
              <Label className="text-xs">Student</Label>
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/40">
                  <div>
                    <div className="text-sm font-medium">{selectedUser.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setSelectedUser(null); setUserSearch(""); }}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email…"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  {userSearch.length > 1 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                      {filteredProfiles.length === 0 ? (
                        <div className="text-xs text-muted-foreground px-3 py-2">No unassigned students found</div>
                      ) : filteredProfiles.slice(0, 8).map(p => (
                        <button
                          key={p.user_id}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedUser(p)}
                        >
                          <div className="text-xs font-medium">{p.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Available from date */}
            <div className="space-y-1.5">
              <Label className="text-xs">Available from (default: 1 week from now)</Label>
              <Input
                type="datetime-local"
                value={availableFrom}
                onChange={e => setAvailableFrom(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Group A starts Jan 15 — 1 week unlock"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAssign} disabled={saving || !selectedUser}>
              {saving ? "Assigning…" : "Assign Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookAssignmentManager;

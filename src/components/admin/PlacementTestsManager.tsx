import { useEffect, useState, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Search, Download } from "lucide-react";
import { getLevelByKey } from "@/constants/levels";
import { exportCSV as exportCSVUtil } from "@/lib/admin-utils";

interface PlacementTestRow {
  id: string;
  user_id: string;
  score: number;
  level: string;
  created_at: string;
  profile_name?: string;
  profile_email?: string;
}

const PlacementTestsManager = () => {
  const [tests, setTests] = useState<PlacementTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchTests = async () => {
    setLoading(true);
    const [testsRes, profilesRes] = await Promise.all([
      supabase.from("placement_tests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, name, email"),
    ]);

    if (testsRes.error) {
      toast({ title: "Error loading placement tests", description: testsRes.error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const profileMap: Record<string, { name: string; email: string }> = {};
    if (profilesRes.data) {
      profilesRes.data.forEach((p) => {
        profileMap[p.user_id] = { name: p.name, email: p.email };
      });
    }

    const enriched = (testsRes.data || []).map((t) => ({
      ...t,
      profile_name: profileMap[t.user_id]?.name || "",
      profile_email: profileMap[t.user_id]?.email || "",
    }));

    setTests(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchTests(); }, []);

  const filtered = useMemo(() => {
    if (!search) return tests;
    const q = search.toLowerCase();
    return tests.filter((t) =>
      t.profile_name?.toLowerCase().includes(q) ||
      t.profile_email?.toLowerCase().includes(q) ||
      t.level.toLowerCase().includes(q)
    );
  }, [tests, search]);

  const exportCSV = () => {
    const headers = ["Name", "Email", "Score", "Level", "Date"];
    const rows = filtered.map((t) => [
      t.profile_name, t.profile_email, t.score,
      getLevelByKey(t.level)?.shortLabel || t.level,
      new Date(t.created_at).toLocaleDateString(),
    ]);
    exportCSVUtil(headers, rows, "placement-tests");
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Placement Test Results</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{tests.length} total</Badge>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={exportCSV}>
              <Download className="h-3 w-3" /> CSV
            </Button>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No placement tests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Placement test results">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const levelObj = getLevelByKey(t.level);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.profile_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.profile_email || "—"}</TableCell>
                      <TableCell className="text-center font-semibold">{t.score}/30</TableCell>
                      <TableCell>
                        <Badge variant="outline">{levelObj?.shortLabel || t.level}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(PlacementTestsManager);

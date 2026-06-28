import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Tag, Copy } from "lucide-react";
import type { TablesInsert } from "@/integrations/supabase/types";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_pct: number | null;
  discount_flat: number | null;
  currency: string | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  code: "",
  description: "",
  discount_type: "pct" as "pct" | "flat",
  discount_value: "",
  currency: "any",
  max_uses: "",
  expires_at: "",
};

const PromoCodesManager = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading codes", description: error.message, variant: "destructive" });
    } else {
      setCodes((data as PromoCode[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) { toast({ title: "Code is required", variant: "destructive" }); return; }
    const val = parseFloat(form.discount_value);
    if (isNaN(val) || val <= 0) { toast({ title: "Enter a valid discount value", variant: "destructive" }); return; }
    if (form.discount_type === "pct" && val > 100) { toast({ title: "Percentage must be ≤ 100", variant: "destructive" }); return; }

    setSaving(true);
    const payload: TablesInsert<"promo_codes"> = {
      code,
      description: form.description.trim() || null,
      discount_pct: form.discount_type === "pct" ? val : null,
      discount_flat: form.discount_type === "flat" ? val : null,
      currency: form.currency === "any" ? null : form.currency,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: true,
    };

    const { error } = await supabase.from("promo_codes").insert(payload);
    if (error) {
      toast({ title: "Failed to create code", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Code "${code}" created ✓` });
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      fetchCodes();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("promo_codes").update({ active }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setCodes(prev => prev.map(c => c.id === id ? { ...c, active } : c));
    }
  };

  const deleteCode = async (id: string, code: string) => {
    if (!window.confirm(`Delete promo code "${code}"?`)) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setCodes(prev => prev.filter(c => c.id !== id));
      toast({ title: `"${code}" deleted` });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast({ title: `Copied "${code}"` }));
  };

  const formatDiscount = (c: PromoCode) => {
    if (c.discount_pct) return `${c.discount_pct}% off`;
    if (c.discount_flat) {
      const sym = c.currency === "EGP" ? "EGP " : "$";
      return `${sym}${c.discount_flat} off`;
    }
    return "—";
  };

  const isExpired = (c: PromoCode) => c.expires_at ? new Date(c.expires_at) < new Date() : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Promo Codes</h3>
            <p className="text-xs text-muted-foreground">{codes.filter(c => c.active && !isExpired(c)).length} active codes</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Code
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Create Promo Code</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Code *</Label>
                <Input
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="uppercase placeholder:normal-case"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="e.g. 20% off for Ramadan"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v as "pct" | "flat" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pct">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{form.discount_type === "pct" ? "Percentage" : "Amount"} *</Label>
                <Input
                  type="number"
                  placeholder={form.discount_type === "pct" ? "e.g. 15" : "e.g. 10"}
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any (USD + EGP)</SelectItem>
                    <SelectItem value="USD">USD only</SelectItem>
                    <SelectItem value="EGP">EGP only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Max Uses (leave blank = unlimited)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expires At (leave blank = never)</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Code"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No promo codes yet. Create one above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table aria-label="Promo codes">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Active</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map(c => {
                const expired = isExpired(c);
                const exhausted = c.max_uses !== null && c.uses_count >= c.max_uses;
                return (
                  <TableRow key={c.id} className={!c.active || expired ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-sm">{c.code}</span>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`Copy code ${c.code}`}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatDiscount(c)}</TableCell>
                    <TableCell className="text-xs">{c.currency ?? "Any"}</TableCell>
                    <TableCell className="text-xs">
                      {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                      {exhausted && <Badge className="ml-1 text-[10px] bg-destructive/10 text-destructive border-destructive/20">Exhausted</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.expires_at
                        ? <>
                            {new Date(c.expires_at).toLocaleDateString()}
                            {expired && <Badge className="ml-1 text-[10px] bg-muted text-muted-foreground">Expired</Badge>}
                          </>
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {c.active && !expired && !exhausted ? (
                        <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">Active</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-muted text-muted-foreground">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.active}
                        onCheckedChange={v => toggleActive(c.id, v)}
                        aria-label={`Toggle ${c.code} active status`}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => deleteCode(c.id, c.code)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Delete code ${c.code}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default memo(PromoCodesManager);

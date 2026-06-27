import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Access denied", description: "Invalid credentials or insufficient permissions.", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user.email !== "admin@klovers.com") {
      await supabase.auth.signOut();
      toast({ title: "Access denied", description: "Invalid credentials or insufficient permissions.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      await supabase.auth.signOut();
      toast({ title: "Access denied", description: "Invalid credentials or insufficient permissions.", variant: "destructive" });
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary border border-black/25">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-sm font-medium text-foreground">Email</label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-medium text-foreground">Password</label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminResetPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFactoryReset = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("factory_reset_data");
      if (error) throw error;
      toast({ title: "Factory Reset Complete", description: String(data) });
    } catch (err: any) {
      toast({ title: "Reset Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-6">
        <ArrowLeft className="me-2 h-4 w-4 rtl-flip" /> Back to Dashboard
      </Button>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Factory Reset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Danger Zone</AlertTitle>
            <AlertDescription>
              This will permanently delete ALL leads, enrollments, attendance records,
              group memberships, preferences, and non-admin profiles. All existing users
              will be forced to sign up again. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            Admin accounts will be preserved but their operational data (credits, level) will be reset.
            Schedule packages and groups structure will be kept.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Factory Reset (DANGER)"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will wipe all student data and force every user to create a new account.
                  This cannot be reversed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFactoryReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResetPage;

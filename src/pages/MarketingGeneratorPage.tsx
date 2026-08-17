import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CreatorHub from "@/components/admin/CreatorHub";

export default function MarketingGeneratorPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto flex items-center gap-3 py-3 px-4 md:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 rtl-flip" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Marketing</h1>
            <p className="text-xs text-muted-foreground">Post creator & 30-post monthly generator</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <CreatorHub />
      </div>
    </div>
  );
}

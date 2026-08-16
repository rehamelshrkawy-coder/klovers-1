import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VocabWord {
  korean: string;
  romanization: string;
  meaning: string;
}

interface VisualVocabSceneProps {
  lessonId: number;
  title: string;
  titleKo: string;
  sceneImageUrl?: string;
  vocab: VocabWord[];
  isAdmin?: boolean;
  onImageGenerated?: (url: string) => void;
}

const VisualVocabScene = ({
  lessonId,
  title,
  titleKo,
  sceneImageUrl,
  vocab,
  isAdmin,
  onImageGenerated,
}: VisualVocabSceneProps) => {
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(sceneImageUrl || "");
  const { toast } = useToast();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson-scene", {
        body: { lesson_id: lessonId },
      });
      if (error) throw error;
      if (data?.url) {
        setImageUrl(data.url);
        onImageGenerated?.(data.url);
        toast({ title: "Scene generated!", description: "Visual vocabulary scene has been created." });
      }
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!imageUrl && !isAdmin) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-primary/10 px-5 py-3 text-center">
        <p className="text-xs font-bold text-primary-text text-outlined uppercase tracking-wider">Visual Vocabulary</p>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{titleKo}</p>
      </div>

      {/* Scene Image */}
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={`Visual scene for ${title}`}
            className="w-full max-h-[400px] object-contain bg-background"
            loading="lazy"
          />
        </div>
      ) : generating ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-text" />
          <p className="text-sm text-muted-foreground">Generating scene illustration...</p>
        </div>
      ) : (
        isAdmin && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No scene illustration yet</p>
            <Button onClick={handleGenerate} size="sm" className="gap-2">
              <ImageIcon className="h-4 w-4" /> Generate Scene
            </Button>
          </div>
        )
      )}

      {/* Vocab Labels */}
      {vocab.length > 0 && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {vocab.slice(0, 8).map((v, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center"
            >
              <span className="text-base font-bold text-foreground">{v.korean}</span>
              <span className="text-[10px] italic text-muted-foreground">{v.romanization}</span>
              <span className="text-xs text-foreground">{v.meaning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Admin regenerate button */}
      {isAdmin && imageUrl && (
        <div className="px-4 pb-3 flex justify-end">
          <Button onClick={handleGenerate} variant="outline" size="sm" disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
};

export default VisualVocabScene;

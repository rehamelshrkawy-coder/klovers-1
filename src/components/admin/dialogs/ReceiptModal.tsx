import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Props {
  receiptModal: { url: string; isPdf: boolean; studentName: string } | null;
  onClose: () => void;
}

export function ReceiptModal({ receiptModal, onClose }: Props) {
  return (
    <Dialog open={!!receiptModal} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> Receipt — {receiptModal?.studentName}
          </DialogTitle>
          <DialogDescription>Payment receipt uploaded by the student.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[300px] bg-muted/30 rounded-lg overflow-hidden">
          {receiptModal?.isPdf ? (
            <div className="text-center space-y-3 p-6">
              <p className="text-muted-foreground text-sm">PDF receipt — cannot preview inline.</p>
              <Button variant="outline" onClick={() => window.open(receiptModal.url, "_blank", "noopener,noreferrer")}>
                <Eye className="h-4 w-4 mr-2" /> Open PDF
              </Button>
            </div>
          ) : receiptModal ? (
            <img
              src={receiptModal.url}
              alt={`Receipt for ${receiptModal.studentName}`}
              className="max-w-full max-h-[60vh] object-contain rounded"
            />
          ) : null}
        </div>
        <DialogFooter className="gap-2">
          {receiptModal && !receiptModal.isPdf && (
            <Button variant="outline" onClick={() => window.open(receiptModal.url, "_blank", "noopener,noreferrer")}>
              <Eye className="h-4 w-4 mr-2" /> Open full size
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

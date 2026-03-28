import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KiwifyPayloadDialogProps {
  payload: any;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export function KiwifyPayloadDialog({ payload, isOpen, onClose, userName }: KiwifyPayloadDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Dados da Kiwify - {userName}</DialogTitle>
          <DialogDescription>
            Informações detalhadas do processamento de pagamento recebidas via Webhook.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 mt-4 rounded-md border p-4 bg-muted/50 font-mono text-[12px]">
          {payload ? (
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(payload, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground italic">Nenhum dado de payload disponível para este usuário.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

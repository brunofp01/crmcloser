import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/closer-logo.png";
import { Clock, LogOut, CheckCircle2 } from "lucide-react";

export function WaitingActivation() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        <div className="relative inline-block">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-2xl relative z-10">
            <img src={logo} alt="CLOSER" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center z-20 shadow-lg border-2 border-background">
            <Clock size={16} className="text-black animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-display font-bold text-foreground">Aguardando Ativação</h1>
          <p className="text-muted-foreground">
            Sua conta foi criada com sucesso! Estamos apenas aguardando a confirmação do seu pagamento pela <strong>Kiwify</strong>.
          </p>
        </div>

        <div className="card-elevated p-6 space-y-4 text-left border border-amber-500/10 bg-amber-500/[0.02]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <CheckCircle2 size={16} /> Próximos Passos
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">•</span>
              A ativação costuma ser instantânea para PIX e Cartão.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">•</span>
              Boletos podem levar até 3 dias úteis para compensar.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">•</span>
              Assim que aprovado, esta página atualizará sozinha.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            variant="outline" 
            fullWidth 
            onClick={() => window.location.reload()}
            className="h-12"
          >
            Já realizei o pagamento, atualizar página
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut size={16} className="mr-2" /> Sair
          </Button>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Dúvidas? Entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}

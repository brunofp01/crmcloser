import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import logo from '@/assets/closer-logo.png';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const signupSchema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function RegisterSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. The profile is usually created via a trigger, 
        // but we'll ensure the status is 'pending' (migration handles default)
        
        toast.success('Conta criada com sucesso! Redirecionando para o pagamento...');
        
        // 3. Redirect to Kiwify with pre-filled billing info
        // Replace 'YOUR_PRODUCT_ID' with the actual ID from the user later
        const kiwifyProductUrl = "https://pay.kiwify.com.br/arODqm7";
        const redirectUrl = `${kiwifyProductUrl}?name=${encodeURIComponent(data.fullName)}&email=${encodeURIComponent(data.email)}`;
        
        // Small delay to allow toast to be seen
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Left Panel - Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl">
            <img src={logo} alt="CLOSER" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-6">Comece sua jornada agora</h1>
          
          <div className="space-y-6 text-left">
            {[
              "Gestão de clientes com Inteligência Artificial",
              "Pipeline de vendas automatizado",
              "Lançamentos das melhores construtoras",
              "Acesso imediato após o pagamento"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="text-amber-400 shrink-0" size={20} />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <img src={logo} alt="CLOSER" className="w-12 h-12 mx-auto mb-3 rounded-xl" />
            <h1 className="text-xl font-display font-bold">Assinar Closer CRM</h1>
          </div>

          <div className="card-elevated p-6 md:p-10 border border-white/5 bg-white/[0.02]">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar ao site
            </button>

            <h2 className="text-2xl font-display font-bold mb-2">Crie sua conta</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Preencha os dados abaixo para iniciar sua contratação.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="Seu nome"
                  className="bg-white/5 border-white/10"
                  {...register('fullName')}
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Profissional</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-white/5 border-white/10"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Crie uma Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10"
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full gradient-primary h-12 text-base font-bold shadow-lg shadow-amber-500/10" 
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : (
                    "Prosseguir para Pagamento"
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground mt-6 uppercase tracking-widest font-medium">
                PAGAMENTO SEGURO VIA KIWIFY
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

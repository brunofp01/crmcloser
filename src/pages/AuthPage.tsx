import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import logo from '@/assets/closer-logo.png';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      loginForm.setError('root', { message: 'Email ou senha inválidos' });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      forgotPasswordForm.setError('root', { message: error.message });
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
      forgotPasswordForm.reset();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-2xl overflow-hidden">
            <img src={logo} alt="CLOSER" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">CLOSER</h1>
          <p className="text-xl text-white/80 mb-2">Gestão de Negócios Imobiliários</p>
          <p className="text-white/60 max-w-md">
            Gerencie seus clientes de forma inteligente e aumente suas vendas com nossa plataforma completa.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden">
              <img src={logo} alt="CLOSER" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">CLOSER</h1>
            <p className="text-xs text-muted-foreground">Gestão de Negócios Imobiliários</p>
          </div>

          <div className="card-elevated p-5 md:p-8">
            {showForgotPassword ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </button>
                <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
                  Recuperar senha
                </h2>
                <p className="text-muted-foreground mb-6">
                  Digite seu email para receber um link de recuperação
                </p>

                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgotEmail">Email</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="seu@email.com"
                      {...forgotPasswordForm.register('email')}
                    />
                    {forgotPasswordForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {forgotPasswordForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {forgotPasswordForm.formState.errors.root && (
                    <p className="text-sm text-destructive text-center">
                      {forgotPasswordForm.formState.errors.root.message}
                    </p>
                  )}

                  <Button type="submit" className="w-full gradient-gold" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Enviar email de recuperação
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
                  Bem-vindo de volta
                </h2>
                <p className="text-muted-foreground mb-6">
                  Entre com suas credenciais para acessar o CRM
                </p>

                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      {...loginForm.register('email')}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...loginForm.register('password')}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {loginForm.formState.errors.root && (
                    <p className="text-sm text-destructive text-center">
                      {loginForm.formState.errors.root.message}
                    </p>
                  )}

                  <Button type="submit" className="w-full gradient-gold" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Entrar
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-accent hover:underline"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Não tem acesso? Contate o administrador do sistema.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

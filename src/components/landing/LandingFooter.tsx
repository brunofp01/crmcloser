import { Mail } from 'lucide-react';

interface LandingFooterProps {
  logo: string;
}

export function LandingFooter({ logo }: LandingFooterProps) {
  return (
    <footer className="py-10 px-4 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Closer CRM" className="h-6 w-auto opacity-60" />
          <span className="text-[11px] text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>
            © {new Date().getFullYear()} Todos os direitos reservados
          </span>
        </div>
        <div className="flex items-center gap-6 text-[11px] text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>
          <a href="#funcionalidades" className="hover:text-gray-400 transition-colors">
            Funcionalidades
          </a>
          <a href="#preco" className="hover:text-gray-400 transition-colors">
            Preço
          </a>
          <a
            href="mailto:contato@closercrm.com.br"
            className="hover:text-gray-400 transition-colors flex items-center gap-1"
          >
            <Mail className="w-3 h-3" /> Contato
          </a>
        </div>
      </div>
    </footer>
  );
}

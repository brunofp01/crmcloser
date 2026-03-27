import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface LandingNavProps {
  logo: string;
  onCTA: () => void;
}

export function LandingNav({ logo, onCTA }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.04]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4">
        <img src={logo} alt="Closer CRM" className="h-7 sm:h-8 w-auto" />
        <div className="hidden md:flex items-center gap-10">
          {['funcionalidades', 'plataforma', 'preco', 'faq'].map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-[13px] text-gray-500 hover:text-white transition-colors duration-300 tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {id === 'funcionalidades' ? 'Funcionalidades' : id === 'plataforma' ? 'Plataforma' : id === 'preco' ? 'Preço' : 'FAQ'}
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onCTA}
            className="text-[13px] text-gray-400 hover:text-white transition-colors px-4 py-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Entrar
          </button>
          <button
            onClick={onCTA}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[13px] font-semibold hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Começar Grátis
          </button>
        </div>
        <button className="md:hidden text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#050505]/98 backdrop-blur-2xl border-t border-white/[0.04] px-5 py-6 space-y-4">
          <a href="#funcionalidades" className="block text-sm text-gray-400" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
          <a href="#plataforma" className="block text-sm text-gray-400" onClick={() => setMenuOpen(false)}>Plataforma</a>
          <a href="#preco" className="block text-sm text-gray-400" onClick={() => setMenuOpen(false)}>Preço</a>
          <a href="#faq" className="block text-sm text-gray-400" onClick={() => setMenuOpen(false)}>FAQ</a>
          <button onClick={onCTA} className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-sm font-semibold mt-2">
            Começar Grátis
          </button>
        </div>
      )}
    </nav>
  );
}

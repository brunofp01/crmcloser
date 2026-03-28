import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingNavProps {
  logo: string;
  onLogin: () => void;
  onSubscribe: () => void;
}

export function LandingNav({ logo, onLogin, onSubscribe }: LandingNavProps) {
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
              onClick={onLogin}
              className="text-[13px] text-gray-400 hover:text-white transition-colors px-4 py-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Entrar
            </button>
            <button
              onClick={onSubscribe}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[13px] font-semibold hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Assinar Agora
          </button>
        </div>
        <button className="md:hidden text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-[#0A0A0A]/f5 backdrop-blur-3xl border-t border-white/[0.08]"
          >
            <div className="px-6 py-8 space-y-6">
              <div className="space-y-4">
                {[
                  { id: 'funcionalidades', label: 'Funcionalidades' },
                  { id: 'plataforma', label: 'Plataforma' },
                  { id: 'preco', label: 'Preço' },
                  { id: 'faq', label: 'FAQ' }
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center justify-between text-base text-gray-200 font-medium py-2 group"
                    onClick={() => setMenuOpen(false)}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {item.label}
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-amber-500 transition-colors" />
                  </a>
                ))}
              </div>

              <div className="pt-6 border-t border-white/[0.05] space-y-3">
                <button
                  onClick={() => { setMenuOpen(false); onLogin(); }}
                  className="w-full py-4 text-sm font-semibold text-gray-200 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Entrar no Portal
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onSubscribe(); }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Assinar Agora
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const FAQ = [
  {
    q: 'Preciso instalar algo no computador?',
    a: 'Não! O Closer funciona 100% no navegador e pode ser instalado como app no celular. Acesse de qualquer lugar.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multa e sem burocracia. Cancele quando quiser diretamente na plataforma.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Absolutamente. Utilizamos criptografia de ponta e servidores seguros. Seus dados são só seus.',
  },
  {
    q: 'Funciona para imobiliárias com equipe?',
    a: 'Sim! O Closer suporta múltiplos corretores com visão gerencial, controle de equipe e relatórios.',
  },
  {
    q: 'Preciso de cartão para testar?',
    a: 'Não. Os 30 dias gratuitos não exigem cartão de crédito. Teste sem compromisso.',
  },
];

export function LandingFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="faq" ref={ref} className="py-24 sm:py-32 px-4 scroll-mt-20">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[11px] font-semibold text-amber-400/50 uppercase tracking-[0.2em]" style={{ fontFamily: "'Inter', sans-serif" }}>
            FAQ
          </span>
          <h2
            className="text-2xl sm:text-4xl font-extrabold mt-4 tracking-[-0.02em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Perguntas{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
        </motion.div>

        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <motion.button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full text-left p-5 rounded-xl bg-[#0F0F0F] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-white/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-gray-600 shrink-0 transition-transform duration-300',
                    openFaq === i && 'rotate-180 text-amber-400/60'
                  )}
                />
              </div>
              <div className={cn(
                'grid transition-all duration-300',
                openFaq === i ? 'grid-rows-[1fr] mt-3 opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}>
                <div className="overflow-hidden">
                  <p className="text-[13px] text-gray-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {item.a}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

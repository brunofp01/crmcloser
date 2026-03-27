import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { CheckCircle2, ArrowRight, Shield, Zap } from 'lucide-react';

interface LandingPricingProps {
  onCTA: () => void;
}

const FEATURES_LIST = [
  'Clientes e leads ilimitados',
  'Funil de vendas completo',
  'Match automático de imóveis',
  'Alertas de clientes sem atendimento',
  'Gestão de tarefas e compromissos',
  'Importação automática de imóveis',
  'Módulo de lançamentos',
  'Assistente de IA integrado',
  'App mobile (PWA)',
  'Suporte via WhatsApp',
];

export function LandingPricing({ onCTA }: LandingPricingProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="preco" ref={ref} className="py-24 sm:py-32 px-4 scroll-mt-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/[0.04] rounded-full blur-[180px]" />
      </div>

      <div className="relative max-w-lg mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[11px] font-semibold text-amber-400/50 uppercase tracking-[0.2em]" style={{ fontFamily: "'Inter', sans-serif" }}>
            Investimento
          </span>
          <h2
            className="text-2xl sm:text-4xl font-extrabold mt-4 mb-3 tracking-[-0.02em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Simples e{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              sem surpresas
            </span>
          </h2>
          <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            Um plano único com tudo incluso. Comece grátis.
          </p>
        </motion.div>

        {/* Pricing card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {/* Animated gradient border */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-amber-500/30 via-amber-500/5 to-amber-500/20 opacity-60" />
          <div className="absolute -inset-2 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-500/5 rounded-3xl blur-xl" />
          
          <div className="relative p-8 sm:p-10 rounded-2xl bg-[#0F0F0F] border border-amber-500/10">
            {/* Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <div className="px-6 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[11px] font-bold tracking-[0.1em] shadow-[0_10px_30px_-5px_rgba(245,158,11,0.4)]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                30 DIAS GRÁTIS
              </div>
            </div>

            <div className="text-center mb-8 mt-3">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-sm text-gray-500">R$</span>
                <span
                  className="text-6xl font-extrabold text-white tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  49
                </span>
                <span className="text-2xl font-bold text-gray-400">,90</span>
                <span className="text-sm text-gray-600">/mês</span>
              </div>
              <p className="text-[11px] text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                após o período de teste gratuito
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {FEATURES_LIST.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-500/70 shrink-0" />
                  <span className="text-[13px] text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={onCTA}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-[15px] hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(245,158,11,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Começar Meus 30 Dias Grátis
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-5 mt-5 text-[11px] text-gray-600" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Sem cartão</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Cancele quando quiser</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

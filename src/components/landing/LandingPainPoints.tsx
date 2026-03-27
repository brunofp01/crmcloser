import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FileSpreadsheet, Brain, PhoneOff, Search, Clock, TrendingDown } from 'lucide-react';

const PAIN_POINTS = [
  { icon: FileSpreadsheet, text: 'Anota clientes em papel ou caderno e depois não encontra' },
  { icon: Brain, text: 'Usa planilhas confusas que ninguém consegue atualizar' },
  { icon: PhoneOff, text: 'Esquece de retornar ligações e perde vendas' },
  { icon: Search, text: 'Não sabe qual imóvel combina com qual cliente' },
  { icon: Clock, text: 'Gasta horas organizando informações ao invés de vender' },
  { icon: TrendingDown, text: 'Não tem visão clara do seu funil e perde controle' },
];

export function LandingPainPoints() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/15 bg-red-500/[0.04] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[11px] font-medium text-red-400/70 tracking-[0.12em] uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              Identificou o problema?
            </span>
          </div>
          <h2
            className="text-2xl sm:text-4xl font-extrabold mb-4 leading-tight tracking-[-0.02em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Se você se identifica com{' '}
            <span className="text-gray-500">pelo menos 2 desses</span>,
            <br className="hidden sm:block" />
            o Closer vai{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              transformar sua rotina
            </span>
          </h2>
        </motion.div>

        {/* Masonry-style grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PAIN_POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                className="group flex items-start gap-4 p-5 rounded-2xl bg-[#0F0F0F] border border-white/[0.04] hover:border-red-500/15 transition-all duration-500"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/[0.06] flex items-center justify-center shrink-0 group-hover:bg-red-500/10 transition-colors">
                  <Icon className="w-4 h-4 text-red-400/60 group-hover:text-red-400/80 transition-colors" />
                </div>
                <p className="text-[13px] text-gray-400 group-hover:text-gray-300 leading-relaxed transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {p.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

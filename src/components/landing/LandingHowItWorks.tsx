import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Download, Rocket } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Crie sua conta',
    desc: 'Cadastre-se em menos de 2 minutos. Sem burocracia, sem cartão.',
  },
  {
    icon: Download,
    step: '02',
    title: 'Importe seus dados',
    desc: 'Cadastre clientes e imóveis. Cole um link e importamos tudo automaticamente.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Feche mais negócios',
    desc: 'Use o funil, matches e alertas para não perder nenhuma oportunidade.',
  },
];

export function LandingHowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-12 sm:py-20 px-4 relative">
      <div className="relative max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[11px] font-semibold text-amber-400/50 uppercase tracking-[0.2em]" style={{ fontFamily: "'Inter', sans-serif" }}>
            Como funciona
          </span>
          <h2
            className="text-2xl sm:text-4xl font-extrabold mt-4 tracking-[-0.02em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Comece a vender mais em{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              3 passos
            </span>
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/[0.06] via-amber-500/20 to-white/[0.06] sm:-translate-x-px" />

          <div className="space-y-12 sm:space-y-16">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isRight = i % 2 !== 0;
              return (
                <motion.div
                  key={i}
                  className={`relative flex items-center gap-6 sm:gap-0 ${
                    isRight ? 'sm:flex-row-reverse' : ''
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  {/* Timeline node */}
                  <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] z-10" />

                  {/* Content */}
                  <div className={`ml-16 sm:ml-0 sm:w-[45%] ${isRight ? 'sm:pr-0 sm:pl-0' : ''}`}>
                    <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-500">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/[0.08] flex items-center justify-center">
                          <Icon className="w-5 h-5 text-amber-400" />
                        </div>
                        <span
                          className="text-xs font-bold text-amber-500/40 tracking-widest"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          PASSO {s.step}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {s.title}
                      </h3>
                      <p className="text-[13px] text-gray-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

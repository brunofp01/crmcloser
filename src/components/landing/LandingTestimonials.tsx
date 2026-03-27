import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Marcos Oliveira',
    role: 'Corretor Autônomo',
    text: 'Em 2 meses usando o Closer, fechei 3 vendas que teriam sido perdidas. O match automático é incrível.',
    stars: 5,
  },
  {
    name: 'Fernanda Costa',
    role: 'Gerente - Imobiliária Premium',
    text: 'Minha equipe de 8 corretores agora tem total visibilidade do funil. A produtividade triplicou.',
    stars: 5,
  },
  {
    name: 'Ricardo Santos',
    role: 'Corretor CRECI-MG',
    text: 'Saí da planilha do Excel e nunca mais voltei. O alerta de clientes sem atendimento salvou muitas vendas.',
    stars: 5,
  },
];

export function LandingTestimonials() {
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
          <span className="text-[11px] font-semibold text-amber-400/50 uppercase tracking-[0.2em]" style={{ fontFamily: "'Inter', sans-serif" }}>
            Depoimentos
          </span>
          <h2
            className="text-2xl sm:text-4xl font-extrabold mt-4 tracking-[-0.02em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Quem usa,{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              recomenda
            </span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              className="relative p-6 rounded-2xl bg-[#0F0F0F] border border-white/[0.04] hover:border-amber-500/15 transition-all duration-500"
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Quote className="w-7 h-7 text-amber-500/[0.08] mb-4" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-[13px] text-gray-400 mb-6 leading-relaxed italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {t.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {t.name}
                  </p>
                  <p className="text-[11px] text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const stats = [
  { value: '500+', label: 'Corretores ativos' },
  { value: '12.000+', label: 'Leads gerenciados' },
  { value: 'R$ 85M+', label: 'Em vendas fechadas' },
  { value: '4.9 ★', label: 'Avaliação média' },
];

export function LandingSocialProof() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section ref={ref} className="relative py-8 border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-0">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              className="flex-1 min-w-[140px] text-center py-4 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {i > 0 && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/[0.06] hidden sm:block" />
              )}
              <p
                className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {s.value}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5 tracking-wide uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

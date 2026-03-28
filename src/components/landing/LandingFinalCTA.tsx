import { ArrowRight } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface LandingFinalCTAProps {
  onCTA: () => void;
}

export function LandingFinalCTA({ onCTA }: LandingFinalCTAProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-28 sm:py-36 px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-amber-500/[0.06] rounded-full blur-[180px]" />
      </div>
      
      <motion.div
        className="relative max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        <h2
          className="text-3xl sm:text-5xl font-extrabold mb-6 leading-tight tracking-[-0.02em]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Chega de perder vendas.
          <br />
          <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
            Comece hoje.
          </span>
        </h2>
        <p className="text-sm sm:text-base text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          Junte-se a mais de 500 corretores que já transformaram sua rotina de vendas.
          Otimize sua operação imobiliária com um clique.
        </p>
        <button
          onClick={onCTA}
          className="group px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-[15px] hover:scale-105 hover:shadow-[0_0_50px_rgba(245,158,11,0.3)] transition-all duration-300 inline-flex items-center gap-2"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Assinar Agora
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </motion.div>
    </section>
  );
}

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  Target, UserCheck, Bell, Calendar, Home, Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Target,
    title: 'Funil de Vendas Inteligente',
    desc: 'Visualize cada lead do primeiro contato ao fechamento. Nunca mais perca uma oportunidade.',
    gradient: 'from-blue-500 to-cyan-400',
    size: 'large',
  },
  {
    icon: UserCheck,
    title: 'Match Automático',
    desc: 'O sistema cruza o perfil dos clientes com imóveis disponíveis e sugere os melhores matches.',
    gradient: 'from-amber-500 to-orange-500',
    size: 'small',
  },
  {
    icon: Bell,
    title: 'Alertas de Inatividade',
    desc: 'Receba avisos quando um cliente está sem atendimento. Não deixe nenhum lead esfriar.',
    gradient: 'from-rose-500 to-pink-500',
    size: 'small',
  },
  {
    icon: Calendar,
    title: 'Gestão de Tarefas',
    desc: 'Organize visitas, follow-ups e compromissos com lembretes automáticos.',
    gradient: 'from-violet-500 to-purple-400',
    size: 'small',
  },
  {
    icon: Home,
    title: 'Catálogo de Imóveis',
    desc: 'Importe imóveis automaticamente via web scraping. Todo seu portfólio em um só lugar.',
    gradient: 'from-emerald-500 to-teal-400',
    size: 'small',
  },
  {
    icon: Sparkles,
    title: 'IA Integrada',
    desc: 'Assistente de IA que qualifica leads e ajuda você a vender mais com menos esforço.',
    gradient: 'from-amber-400 to-yellow-500',
    size: 'large',
  },
];

export function LandingFeatures() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section id="funcionalidades" ref={ref} className="py-24 sm:py-32 px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span
            className="text-[11px] font-semibold text-amber-400/50 uppercase tracking-[0.2em]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Funcionalidades
          </span>
          <h2
            className="text-2xl sm:text-4xl font-extrabold mt-4 mb-4 tracking-[-0.02em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tudo que você precisa para{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              vender mais
            </span>
          </h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Ferramentas profissionais que transformam a forma como você gerencia seus clientes e imóveis.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
          {FEATURES.map((f, i) => {
            const isLarge = f.size === 'large';
            const isHovered = hoveredIdx === i;
            return (
              <motion.div
                key={i}
                className={`group relative rounded-2xl overflow-hidden cursor-default ${
                  isLarge ? 'sm:col-span-2' : ''
                }`}
                initial={{ opacity: 0, y: 25 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-[#0F0F0F] border border-white/[0.04] rounded-2xl transition-all duration-500 group-hover:border-white/[0.08]" />
                
                {/* Hover glow on border */}
                {isHovered && (
                  <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${f.gradient} opacity-[0.12] blur-sm transition-opacity duration-500`} />
                )}
                
                {/* Backdrop blur effect */}
                <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-sm rounded-2xl" />

                <div className={`relative p-6 ${isLarge ? 'sm:p-8' : 'p-6'} h-full flex flex-col`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3
                    className="font-semibold text-[15px] text-white/90 mb-2"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

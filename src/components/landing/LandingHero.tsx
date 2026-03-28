import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingHeroProps {
  logo: string;
  dashboardImg: string;
  mobileImg: string;
  onCTA: () => void;
}

export function LandingHero({ logo, dashboardImg, mobileImg, onCTA }: LandingHeroProps) {
  return (
    <section className="relative pt-32 sm:pt-40 pb-8 px-4 overflow-hidden">
      {/* Deep ambient backgrounds */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-amber-500/[0.04] rounded-full blur-[180px]" />
        <div className="absolute top-10 right-[-10%] w-[500px] h-[500px] bg-amber-600/[0.02] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_0%,#050505_75%)]" />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-amber-500/15 bg-amber-500/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-medium text-amber-400/80 tracking-[0.15em] uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              Performance Máxima • IA Integrada
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="text-center max-w-5xl mx-auto mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <h1
            className="text-4xl sm:text-5xl lg:text-[4.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] mb-7"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            O CRM com IA que{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                transforma
              </span>
              {/* Glow behind the word */}
              <span className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-500/20 blur-2xl scale-150" />
            </span>
            <br />
            corretores em{' '}
            <span className="text-white">
              top performers
            </span>
          </h1>
          <p
            className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-light"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Gerencie clientes, imóveis e negociações em uma plataforma inteligente
            com IA integrada. Saia da planilha e comece a{' '}
            <span className="text-gray-200 font-medium">fechar mais vendas</span>.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 sm:mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={onCTA}
            className="w-full sm:w-auto group px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-[15px] hover:scale-105 hover:shadow-[0_0_50px_rgba(245,158,11,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <a
            href="#plataforma"
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/[0.08] text-gray-400 font-medium text-[15px] hover:bg-white/[0.03] hover:border-white/15 transition-all duration-300 flex items-center justify-center gap-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <Play className="w-4 h-4" />
            Ver Plataforma
          </a>
        </motion.div>

        {/* Dashboard composition with 3D perspective */}
        <motion.div
          className="relative mx-auto max-w-5xl"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Ambient glow behind dashboard */}
          <div className="absolute -inset-8 bg-gradient-to-t from-amber-500/[0.08] via-amber-500/[0.04] to-transparent rounded-3xl blur-3xl" />

          {/* Main dashboard with perspective */}
          <div className="relative rounded-xl overflow-hidden border border-white/[0.06] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]" style={{ perspective: '1200px' }}>
            {/* macOS title bar */}
            <div className="bg-[#0F0F0F] px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
              </div>
              <span className="text-[10px] text-white/15 ml-3 tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>closercrm.com.br/dashboard</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
            <img
              src={dashboardImg}
              alt="Closer CRM Dashboard - Funil de vendas inteligente"
              className="w-full h-auto"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Floating mobile mockup */}
          <div className="absolute -right-3 sm:-right-6 -bottom-6 sm:-bottom-10 w-24 sm:w-36 z-20">
            <div className="relative">
              <div className="absolute -inset-3 bg-amber-500/10 rounded-3xl blur-2xl" />
              <img
                src={mobileImg}
                alt="Closer CRM Mobile"
                className="relative w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          {/* Floating stat cards */}
          <motion.div
            className="absolute -left-2 sm:-left-8 top-1/4 z-20 hidden sm:block"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            <div className="bg-[#0F0F0F]/90 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
              <p className="text-[10px] text-gray-500 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Vendas este mês</p>
              <p className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>R$ 2,4M</p>
              <p className="text-[10px] text-emerald-400 mt-1 font-medium">↑ 23% vs mês anterior</p>
            </div>
          </motion.div>

          <motion.div
            className="absolute -right-2 sm:-right-8 top-8 z-20 hidden sm:block"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            <div className="bg-[#0F0F0F]/90 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
              <p className="text-[10px] text-gray-500 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Matches realizados</p>
              <p className="text-xl font-bold text-amber-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>347</p>
              <p className="text-[10px] text-gray-500 mt-1">clientes × imóveis</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

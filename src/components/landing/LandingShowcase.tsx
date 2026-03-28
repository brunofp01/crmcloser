import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Smartphone, LayoutDashboard, Search, Users } from 'lucide-react';

interface LandingShowcaseProps {
  dashboardImg: string;
  propertyImg: string;
  mobileImg: string;
}

export function LandingShowcase({ mobileImg }: LandingShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Animations linked to scroll
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.9]);
  const rotateY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-20, 0, 0, 15]);
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 1], [100, 0, -50]);
  
  // Dynamic floating labels
  const label1Opacity = useTransform(scrollYProgress, [0.1, 0.2, 0.3, 0.4], [0, 1, 1, 0]);
  const label2Opacity = useTransform(scrollYProgress, [0.4, 0.5, 0.6, 0.7], [0, 1, 1, 0]);
  const label3Opacity = useTransform(scrollYProgress, [0.7, 0.8, 0.9, 0.95], [0, 1, 1, 0]);

  return (
    <section 
      id="plataforma" 
      ref={containerRef} 
      className="relative min-h-[400vh] scroll-mt-20"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Ambient background light */}
        <div className="absolute inset-0">
          <motion.div 
            style={{ opacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[700px] bg-amber-500/[0.04] rounded-full blur-[180px]" 
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          {/* Header Text - moves up early in the scroll */}
          <motion.div
            style={{ opacity, y: useTransform(scrollYProgress, [0, 0.15], [20, 0]) }}
            className="text-center mb-12 sm:mb-20"
          >
            <span className="text-[11px] font-semibold text-amber-400/50 uppercase tracking-[0.2em]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Mobile Freedom
            </span>
            <h2 className="text-3xl sm:text-[4rem] font-extrabold mt-4 mb-6 tracking-[-0.03em] leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Seu CRM completo<br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                na palma da mão
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Instale o Closer como um App (PWA) e gerencie sua imobiliária com 
              liberdade total. Performance nativa em qualquer dispositivo.
            </p>
          </motion.div>

          {/* 3D Mobile Section */}
          <div className="relative flex items-center justify-center pt-8 sm:pt-12">
            
            {/* Floating Labels that appear during scroll */}
            <div className="absolute inset-0 pointer-events-none z-30">
              <motion.div 
                style={{ opacity: label1Opacity, x: -180, y: -60 }}
                className="absolute left-1/2 top-1/4 bg-[#0F0F0F]/90 backdrop-blur-xl border border-white/5 p-3 rounded-lg shadow-2xl hidden lg:flex items-center gap-3"
              >
                <div className="p-2 rounded bg-amber-500/10 text-amber-500"><LayoutDashboard size={18} /></div>
                <div className="text-left"><p className="text-xs font-bold text-white">Dashboard</p><p className="text-[10px] text-gray-500 whitespace-nowrap">Resumo em tempo real</p></div>
              </motion.div>

              <motion.div 
                style={{ opacity: label2Opacity, x: 200, y: 100 }}
                className="absolute left-1/2 top-1/3 bg-[#0F0F0F]/90 backdrop-blur-xl border border-white/5 p-3 rounded-lg shadow-2xl hidden lg:flex items-center gap-3"
              >
                <div className="p-2 rounded bg-blue-500/10 text-blue-500"><Users size={18} /></div>
                <div className="text-left"><p className="text-xs font-bold text-white">Leads</p><p className="text-[10px] text-gray-500 whitespace-nowrap">Controle total da base</p></div>
              </motion.div>

              <motion.div 
                style={{ opacity: label3Opacity, x: -200, y: 220 }}
                className="absolute left-1/2 top-1/2 bg-[#0F0F0F]/90 backdrop-blur-xl border border-white/5 p-3 rounded-lg shadow-2xl hidden lg:flex items-center gap-3"
              >
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-500"><Search size={18} /></div>
                <div className="text-left"><p className="text-xs font-bold text-white">Matches</p><p className="text-[10px] text-gray-500 whitespace-nowrap">IA buscando imóveis</p></div>
              </motion.div>
            </div>

            {/* 3D Mobile Mockup Container with Scroll Transforms */}
            <motion.div 
              style={{ scale, rotateY, perspective: 1200, y }}
              className="relative w-[280px] sm:w-[340px] aspect-[9/19] z-20"
            >
              {/* iPhone 15 Pro Style Frame */}
              <div className="absolute inset-0 rounded-[3.5rem] border-[10px] border-[#1A1A1A] bg-[#050505] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
                <div className="relative w-full h-full p-1">
                  {/* Notch / Dynamic Island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-3xl z-40 hidden sm:block" />
                  
                  {/* Status Bar Mockup */}
                  <div className="absolute top-0 left-0 right-0 h-10 flex justify-between items-center px-8 pt-3 z-30">
                    <span className="text-[11px] font-bold">9:41</span>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-4 h-2.5 border border-white/20 rounded-[2px] relative">
                         <div className="absolute inset-[1px] bg-white rounded-[1px]" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Screen Content */}
                  <div className="relative w-full h-full rounded-[3rem] overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={mobileImg}
                      alt="Closer CRM Mobile App"
                      className="w-full h-full object-cover"
                    />
                    {/* Glass simulation */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Physical Buttons Simulation */}
              <div className="absolute -right-2 top-28 w-1.5 h-16 bg-[#1A1A1A] rounded-l-md" />
              <div className="absolute -left-2 top-24 w-1.5 h-10 bg-[#1A1A1A] rounded-r-md" />
              <div className="absolute -left-2 top-40 w-1.5 h-16 bg-[#1A1A1A] rounded-r-md" />
            </motion.div>

            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] mix-blend-screen" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

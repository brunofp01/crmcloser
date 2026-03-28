import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Smartphone, Download, Zap, ShieldCheck } from 'lucide-react';

interface LandingShowcaseProps {
  dashboardImg: string;
  propertyImg: string;
  mobileImg: string;
}

export function LandingShowcase({ mobileImg }: LandingShowcaseProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="plataforma" ref={ref} className="py-24 sm:py-32 px-4 scroll-mt-20 relative overflow-hidden">
      {/* Background glow elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-6">
              <Zap size={12} className="fill-amber-500" />
              PWA Technology
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 leading-tight tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Leve o Closer com você,<br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                em qualquer lugar
              </span>
            </h2>
            
            <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-xl">
              Instale o Closer como um App (PWA) em segundos diretamente pelo seu navegador. 
              Tenha performance nativa, acesso offline e o controle total da sua imobiliária 
              na palma da sua mão.
            </p>

            <div className="space-y-6">
              {[
                { icon: Download, title: "Sem download em lojas", text: "Instale direto pelo navegador, sem ocupar espaço desnecessário." },
                { icon: Zap, title: "Performance Instantânea", text: "Otimizado para carregar em milissegundos mesmo em conexões lentas." },
                { icon: ShieldCheck, title: "Sempre Atualizado", text: "Tenha sempre a versão mais recente sem precisar de updates manuais." }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-amber-500 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all duration-300">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{feature.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Mobile Mockup Asset */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Backglow for the mockup */}
              <div className="absolute inset-0 bg-amber-500/10 rounded-3xl blur-3xl -z-10 animate-pulse" />
              
              <div className="w-[280px] sm:w-[320px] relative z-20 group">
                {/* Screen content - Using the asset directly since it already has a frame */}
                <div className="relative transform group-hover:scale-[1.02] transition-transform duration-700 drop-shadow-[0_35px_60px_rgba(0,0,0,0.8)]">
                  <img
                    src={mobileImg}
                    alt="Closer CRM Mobile Dashboard"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  {/* Subtle glass reflection overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-30 pointer-events-none rounded-[2rem]" />
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -bottom-6 -right-6 sm:-right-10 bg-gradient-to-br from-amber-400 to-orange-500 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-1 z-30 rotate-6 hover:rotate-0 transition-all duration-300 cursor-default"
              >
                <Smartphone className="text-black" size={24} />
                <span className="text-[10px] font-black text-black uppercase tracking-tighter">APP DISPONÍVEL</span>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Monitor, Smartphone, LayoutDashboard } from 'lucide-react';

interface LandingShowcaseProps {
  dashboardImg: string;
  propertyImg: string;
  mobileImg: string;
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'property', label: 'Imóveis', icon: Monitor },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
];

export function LandingShowcase({ dashboardImg, propertyImg, mobileImg }: LandingShowcaseProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeTab, setActiveTab] = useState('dashboard');

  const images: Record<string, string> = { dashboard: dashboardImg, property: propertyImg, mobile: mobileImg };

  return (
    <section id="plataforma" ref={ref} className="py-24 sm:py-32 px-4 scroll-mt-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-amber-500/[0.03] rounded-full blur-[180px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[11px] font-semibold text-amber-400/50 uppercase tracking-[0.2em]" style={{ fontFamily: "'Inter', sans-serif" }}>
            Plataforma
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold mt-4 mb-4 tracking-[-0.02em]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Uma experiência{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              completa
            </span>{' '}
            na palma da mão
          </h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Desktop ou celular, o Closer se adapta ao seu ritmo de trabalho.
          </p>
        </motion.div>

        {/* Interactive tabs */}
        <motion.div
          className="flex justify-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex gap-1 p-1 rounded-full bg-[#0F0F0F] border border-white/[0.04]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/[0.06] text-white shadow-lg'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Image display */}
        <motion.div
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="absolute -inset-6 bg-gradient-to-b from-amber-500/[0.06] to-transparent rounded-3xl blur-3xl" />
          
          <div className={`relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0F0F0F] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ${
            activeTab === 'mobile' ? 'max-w-xs mx-auto' : ''
          }`}>
            {activeTab !== 'mobile' && (
              <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
                </div>
                <span className="text-[10px] text-white/15 ml-3" style={{ fontFamily: "'Inter', sans-serif" }}>closercrm.com.br</span>
              </div>
            )}
            <motion.img
              key={activeTab}
              src={images[activeTab]}
              alt={`Closer CRM - ${activeTab}`}
              className={`w-full h-auto ${activeTab === 'mobile' ? 'p-4' : ''}`}
              loading="lazy"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

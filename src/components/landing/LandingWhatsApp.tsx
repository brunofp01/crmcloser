import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingWhatsApp() {
  const whatsappNumber = "5531973362545";
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <div className="relative flex items-center justify-center pointer-events-auto">
        {/* Pulsing ring 1 */}
        <motion.div
          className="absolute w-full h-full rounded-full border-2 border-[#25D366]"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
        
        {/* Pulsing ring 2 */}
        <motion.div
          className="absolute w-full h-full rounded-full border-2 border-[#25D366]"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.5,
            ease: "easeOut"
          }}
        />

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 hover:bg-[#20bd5a] transition-all duration-300 group"
          aria-label="Contate-nos via WhatsApp"
        >
          <MessageCircle size={28} className="fill-white" />
          
          {/* Tooltip on hover */}
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-[#0F0F0F] border border-white/10 text-white text-[12px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl">
            Falar com especialista
          </span>
        </a>
      </div>
    </div>
  );
}

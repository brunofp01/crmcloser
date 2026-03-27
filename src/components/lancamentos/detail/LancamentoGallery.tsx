import { useState } from 'react';
import { Lancamento } from '@/hooks/useLancamentos';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface Props {
  lancamento: Lancamento;
}

export function LancamentoGallery({ lancamento: l }: Props) {
  const photos = l.fotos || [];
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <p className="text-sm text-muted-foreground">Nenhuma foto disponível</p>
      </div>
    );
  }

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);

  const goPrev = () => {
    if (lightboxIdx === null) return;
    setLightboxIdx(lightboxIdx === 0 ? photos.length - 1 : lightboxIdx - 1);
  };
  const goNext = () => {
    if (lightboxIdx === null) return;
    setLightboxIdx(lightboxIdx === photos.length - 1 ? 0 : lightboxIdx + 1);
  };

  return (
    <>
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">{photos.length} foto{photos.length !== 1 ? 's' : ''}</p>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((foto, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className={cn(
                'relative aspect-[4/3] rounded-xl overflow-hidden bg-muted group cursor-pointer',
                i === 0 && 'col-span-2 sm:col-span-2 row-span-2 aspect-[16/10]'
              )}
            >
              <img src={String(foto)} alt={`Foto ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={closeLightbox}
        >
          <button
            onClick={e => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={e => { e.stopPropagation(); goPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={e => { e.stopPropagation(); goNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <img
            src={String(photos[lightboxIdx])}
            alt={`Foto ${lightboxIdx + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}

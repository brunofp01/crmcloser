import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Building,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Copy,
  Check,
  Heart,
  Phone,
  MessageCircle,
  Calendar,
  Home,
  Sparkles,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Expand,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
}

export function PropertyDetail({ property, onClose }: PropertyDetailProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const photos = property.fotos?.length ? property.fotos : ['/placeholder.svg'];

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Lightbox controls
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const lightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [photos.length]);

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [photos.length]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setImagePosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(photos[lightboxIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imovel-${property.codigo}-foto-${lightboxIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Erro ao baixar imagem', variant: 'destructive' });
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!showLightbox) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          lightboxNext();
          break;
        case 'ArrowLeft':
          lightboxPrev();
          break;
        case 'Escape':
          closeLightbox();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, lightboxNext, lightboxPrev]);

  const handleShare = async () => {
    const url = property.hotsite_url || window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.titulo || 'Imóvel',
          text: `Confira este imóvel: ${property.titulo}`,
          url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copiado!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenHotsite = () => {
    if (property.hotsite_url) {
      window.open(property.hotsite_url, '_blank');
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.titulo} - Código: ${property.codigo}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Feature items for the grid
  const features = [
    { icon: Bed, label: 'Quartos', value: property.quartos },
    { icon: Bed, label: 'Suítes', value: property.suites },
    { icon: Bath, label: 'Banheiros', value: property.banheiros },
    { icon: Car, label: 'Vagas', value: property.vagas },
    { icon: Maximize, label: 'Área útil', value: property.area_util ? `${property.area_util}m²` : null },
    { icon: Maximize, label: 'Área total', value: property.area_total ? `${property.area_total}m²` : null },
  ].filter(f => f.value);

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-l border-border/50">
        <div className="flex flex-col h-full bg-background">
          {/* Hero Photo Gallery */}
          <div className="relative aspect-[16/10] bg-muted overflow-hidden">
            {/* Main Image with Ken Burns effect */}
            <div className="absolute inset-0">
              <img
                src={photos[currentPhotoIndex]}
                alt={property.titulo || 'Imóvel'}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 cursor-pointer"
                onClick={() => openLightbox(currentPhotoIndex)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            </div>
            
            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background transition-all shadow-lg hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background transition-all shadow-lg hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Top Actions Bar */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                {property.destaque && (
                  <Badge className="bg-accent text-accent-foreground font-semibold shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Destaque
                  </Badge>
                )}
                {property.source && (
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "shadow-lg backdrop-blur-sm",
                      property.source === 'blow' && 'bg-blue-500/90 text-white hover:bg-blue-600/90'
                    )}
                  >
                    {property.source === 'blow' ? 'Blow' : 'Privus'}
                  </Badge>
                )}
                {property.tipo && (
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow-lg">
                    <Building className="w-3 h-3 mr-1" />
                    {property.tipo}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={cn(
                    "p-2.5 rounded-full backdrop-blur-sm transition-all shadow-lg hover:scale-105",
                    isFavorite 
                      ? "bg-red-500 text-white" 
                      : "bg-background/90 text-foreground hover:bg-background"
                  )}
                >
                  <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-background/90 backdrop-blur-sm text-foreground hover:bg-background transition-all shadow-lg hover:scale-105"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo Counter & Grid Button */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
              {/* Photo Counter */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-sm font-medium shadow-lg">
                  {currentPhotoIndex + 1} / {photos.length}
                </span>
              </div>

              {/* Show All Photos Button */}
              {photos.length > 1 && (
                <button
                  onClick={() => openLightbox(currentPhotoIndex)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-sm font-medium shadow-lg hover:bg-background transition-all"
                >
                  <Expand className="w-4 h-4" />
                  Tela cheia
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="absolute bottom-14 left-3 right-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {photos.slice(0, 8).map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={cn(
                        'flex-shrink-0 w-14 h-10 rounded-md overflow-hidden transition-all',
                        idx === currentPhotoIndex 
                          ? 'ring-2 ring-accent ring-offset-2 ring-offset-transparent scale-105' 
                          : 'opacity-70 hover:opacity-100'
                      )}
                    >
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </button>
                  ))}
                  {photos.length > 8 && (
                    <div className="flex-shrink-0 w-14 h-10 rounded-md bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs font-medium">
                      +{photos.length - 8}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">
              {/* Header Section */}
              <div className="space-y-3">
                {/* Price - Hero Element */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-accent">
                    {formatCurrency(property.valor)}
                  </span>
                  {property.categoria && (
                    <span className="text-sm text-muted-foreground">
                      / {property.categoria}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-foreground leading-tight">
                  {property.titulo || 'Imóvel sem título'}
                </h2>
                
                {/* Location */}
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                  <span className="text-sm">
                    {[property.endereco, property.bairro, property.cidade, property.estado]
                      .filter(Boolean)
                      .join(', ') || 'Localização não informada'}
                  </span>
                </div>

                {/* Property Code */}
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono">
                    Ref: {property.codigo}
                  </span>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Features Grid */}
              {features.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Características
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {features.map((feature, idx) => (
                      <div 
                        key={idx}
                        className="flex flex-col items-center p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-accent/30 transition-colors"
                      >
                        <feature.icon className="w-5 h-5 text-accent mb-1.5" />
                        <span className="text-lg font-semibold text-foreground">
                          {feature.value}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {property.descricao && (
                <>
                  <Separator className="bg-border/50" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                      Sobre o Imóvel
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {property.descricao}
                    </p>
                  </div>
                </>
              )}

              {/* Amenities/Characteristics */}
              {property.caracteristicas && Object.keys(property.caracteristicas).length > 0 && (() => {
                // Process characteristics to clean up display
                const cleanAmenities: string[] = [];
                
                const processValue = (val: unknown): string | null => {
                  if (typeof val === 'string') {
                    // Skip if it's a URL or markdown image
                    if (val.includes('http') || val.includes('![') || val.includes('.jpg') || val.includes('.png')) {
                      return null;
                    }
                    // Remove numeric prefix like "0: ", "1: ", etc.
                    const cleaned = val.replace(/^\d+:\s*/, '').trim();
                    return cleaned.length > 0 && cleaned.length < 100 ? cleaned : null;
                  }
                  return null;
                };

                // Handle array format (from Blow scraping)
                if (Array.isArray(property.caracteristicas)) {
                  for (const item of property.caracteristicas) {
                    const cleaned = processValue(item);
                    if (cleaned && !cleanAmenities.includes(cleaned)) {
                      cleanAmenities.push(cleaned);
                    }
                  }
                } else {
                  // Handle object format
                  for (const [key, value] of Object.entries(property.caracteristicas)) {
                    // Skip numeric keys or special keys
                    if (/^\d+$/.test(key)) {
                      const cleaned = processValue(value);
                      if (cleaned && !cleanAmenities.includes(cleaned)) {
                        cleanAmenities.push(cleaned);
                      }
                    } else if (typeof value === 'boolean' && value) {
                      if (!cleanAmenities.includes(key)) {
                        cleanAmenities.push(key);
                      }
                    } else if (typeof value === 'string') {
                      const cleaned = processValue(value);
                      if (cleaned) {
                        const display = `${key}: ${cleaned}`;
                        if (!cleanAmenities.includes(display)) {
                          cleanAmenities.push(display);
                        }
                      }
                    }
                  }
                }

                if (cleanAmenities.length === 0) return null;

                return (
                  <>
                    <Separator className="bg-border/50" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                        Diferenciais
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {cleanAmenities.map((amenity, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline"
                            className="bg-muted/30 border-border/50 text-foreground/80 font-normal py-1.5 px-3"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Quick Contact Section */}
              <div className="pt-2">
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Interessado neste imóvel?
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-accent/30 hover:bg-accent/10"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-accent/30 hover:bg-accent/10"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Fixed Bottom Actions */}
          <div className="p-4 border-t border-border/50 bg-background/95 backdrop-blur-sm">
            <div className="flex gap-2">
              {property.hotsite_url && (
                <Button 
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg"
                  onClick={handleOpenHotsite}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver no Site
                </Button>
              )}
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleShare}
                className="border-border/50 hover:bg-muted"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* All Photos Modal */}
        {showAllPhotos && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Todas as fotos ({photos.length})</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAllPhotos(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentPhotoIndex(idx);
                        setShowAllPhotos(false);
                      }}
                      className="aspect-video rounded-lg overflow-hidden hover:ring-2 ring-accent transition-all"
                    >
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Professional Lightbox Gallery */}
        {showLightbox && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <span className="text-white/90 font-medium">
                  {lightboxIndex + 1} / {photos.length}
                </span>
                <span className="text-white/60 text-sm hidden sm:block">
                  {property.titulo}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Zoom Controls */}
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className={cn(
                    "p-2.5 rounded-full transition-all",
                    zoomLevel <= 1 
                      ? "text-white/30 cursor-not-allowed" 
                      : "text-white/90 hover:bg-white/10"
                  )}
                  title="Diminuir zoom (-)"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                <span className="text-white/60 text-sm w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  className={cn(
                    "p-2.5 rounded-full transition-all",
                    zoomLevel >= 4 
                      ? "text-white/30 cursor-not-allowed" 
                      : "text-white/90 hover:bg-white/10"
                  )}
                  title="Aumentar zoom (+)"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleResetZoom}
                  className="p-2.5 rounded-full text-white/90 hover:bg-white/10 transition-all"
                  title="Resetar zoom (0)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-2" />
                
                <button
                  onClick={handleDownload}
                  className="p-2.5 rounded-full text-white/90 hover:bg-white/10 transition-all"
                  title="Baixar imagem"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setShowAllPhotos(true)}
                  className="p-2.5 rounded-full text-white/90 hover:bg-white/10 transition-all"
                  title="Ver grade de fotos"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-2" />
                
                <button
                  onClick={closeLightbox}
                  className="p-2.5 rounded-full text-white/90 hover:bg-white/10 transition-all"
                  title="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image Area */}
            <div 
              className={cn(
                "absolute inset-0 flex items-center justify-center pt-16 pb-24",
                zoomLevel > 1 ? "cursor-grab" : "cursor-default",
                isDragging && "cursor-grabbing"
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <img
                src={photos[lightboxIndex]}
                alt={`Foto ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                }}
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={lightboxPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                  title="Anterior (←)"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  onClick={lightboxNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                  title="Próxima (→)"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLightboxIndex(idx);
                      setZoomLevel(1);
                      setImagePosition({ x: 0, y: 0 });
                    }}
                    className={cn(
                      "flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all duration-200",
                      idx === lightboxIndex 
                        ? "ring-2 ring-white scale-110 z-10" 
                        : "opacity-50 hover:opacity-80"
                    )}
                  >
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
              
              {/* Keyboard Hints */}
              <div className="flex justify-center gap-4 mt-2 text-white/40 text-xs">
                <span>← → Navegar</span>
                <span>+ - Zoom</span>
                <span>0 Resetar</span>
                <span>Esc Fechar</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

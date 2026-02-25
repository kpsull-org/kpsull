'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

const LENS_SIZE = 220;
const ZOOM_FACTOR = 3;

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWRef = useRef(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!selectedImage) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    containerWRef.current = rect.width;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLensPos({ x, y });
  };

  const bgSizePct =
    containerWRef.current > 0
      ? (ZOOM_FACTOR * containerWRef.current / LENS_SIZE) * 100
      : ZOOM_FACTOR * 100;

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div
        ref={containerRef}
        className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-crosshair"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={selectedImage}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Magnifying glass lens */}
        {isHovering && (
          <div
            className="absolute pointer-events-none z-20 rounded-full"
            style={{
              width: `${LENS_SIZE}px`,
              height: `${LENS_SIZE}px`,
              left: `${lensPos.x}%`,
              top: `${lensPos.y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundImage: `url(${selectedImage})`,
              backgroundSize: `${bgSizePct}%`,
              backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
              border: '2px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.35)',
            }}
          />
        )}

        {/* Barres de navigation verticales — discrètes, pleine hauteur */}
        {images.length > 1 && (
          <>
            {/* Barre gauche */}
            <div
              className={`group absolute left-0 top-0 h-full w-10 z-30 cursor-pointer flex items-center transition-opacity duration-200 ${
                isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={goToPrevious}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && goToPrevious()}
              aria-label="Image précédente"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/0 to-transparent group-hover:from-black/20 transition-colors duration-200" />
              <div className="absolute right-0 top-[10%] h-[80%] w-px bg-white/25 group-hover:bg-white/55 group-hover:top-0 group-hover:h-full transition-all duration-200" />
              <ChevronLeft className="relative ml-1.5 h-4 w-4 text-white/0 group-hover:text-white drop-shadow-md transition-colors duration-200" />
            </div>

            {/* Barre droite */}
            <div
              className={`group absolute right-0 top-0 h-full w-10 z-30 cursor-pointer flex items-center justify-end transition-opacity duration-200 ${
                isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={goToNext}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && goToNext()}
              aria-label="Image suivante"
            >
              <div className="absolute inset-0 bg-gradient-to-l from-black/0 to-transparent group-hover:from-black/20 transition-colors duration-200" />
              <div className="absolute left-0 top-[10%] h-[80%] w-px bg-white/25 group-hover:bg-white/55 group-hover:top-0 group-hover:h-full transition-all duration-200" />
              <ChevronRight className="relative mr-1.5 h-4 w-4 text-white/0 group-hover:text-white drop-shadow-md transition-colors duration-200" />
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((url, index) => (
            <button
              key={url}
              onClick={() => setSelectedIndex(index)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                index === selectedIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground'
              }`}
            >
              <Image
                src={url}
                alt={`${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

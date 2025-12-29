"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ZoomImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt?: string;
  zoom?: number;
  classImage?: string;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

export const ZoomImage = React.forwardRef<HTMLDivElement, ZoomImageProps>(
  ({ 
    className, 
    src, 
    alt = "zoom-image", 
    zoom = 2, 
    classImage, 
    minZoom = 1,
    maxZoom = 5,
    zoomStep = 0.5,
    ...props 
  }, ref) => {
    const [isZoomed, setIsZoomed] = React.useState(false);
    const [currentZoom, setCurrentZoom] = React.useState(zoom);
    const [position, setPosition] = React.useState({ x: 50, y: 50 });
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const handleMove = (e: React.MouseEvent) => {
      if (!isZoomed) return;
      
      const rect = containerRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPosition({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      });
    };

    const handleClick = (e: React.MouseEvent) => {
      if (e.button === 0) {
        e.preventDefault();
        setIsZoomed(true);
        
        const rect = containerRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setPosition({
          x: (x / rect.width) * 100,
          y: (y / rect.height) * 100,
        });
      }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      if (isZoomed) {
        e.preventDefault();
        
        if (currentZoom > minZoom + zoomStep) {
          setCurrentZoom(prev => Math.max(minZoom, prev - zoomStep));
        } else {
          setIsZoomed(false);
          setCurrentZoom(zoom);
        }
      }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsZoomed(true);
      setCurrentZoom(zoom);
      
      const rect = containerRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPosition({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      });
    };

    const containerClass = cn(
      "relative overflow-hidden cursor-zoom-in",
      isZoomed && "cursor-zoom-out",
      className
    );

    const imageClass = cn(
      "w-full h-full object-contain pointer-events-none select-none",
      classImage
    );

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={containerClass}
        onMouseMove={handleMove}
        onMouseDown={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        {...props}
      >
        <img 
          src={src} 
          alt={alt} 
          className={imageClass}
          style={{
            transform: isZoomed ? `scale(${currentZoom})` : 'scale(1)',
            transformOrigin: `${position.x}% ${position.y}%`
          }}
        />
        
        {isZoomed && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs z-20">
            {Math.round(currentZoom * 100)}%
          </div>
        )}
      </div>
    );
  }
);

ZoomImage.displayName = "ZoomImage";
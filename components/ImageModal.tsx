'use client';

import { useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiDownload, FiX } from 'react-icons/fi';
import { ModalState } from '@/types';

interface ImageModalProps extends ModalState {
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDownload: () => void;
  totalImages: number;
  currentImageName?: string;
}

export default function ImageModal({
  show,
  currentIndex,
  imageUrls,
  thumbnailUrls,
  imagesLoaded,
  onClose,
  onNext,
  onPrev,
  onDownload,
  totalImages,
  currentImageName = 'converted_image'
}: ImageModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
      if (e.key === 'ArrowRight' && show) {
        onNext();
      }
      if (e.key === 'ArrowLeft' && show) {
        onPrev();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [show, onClose, onNext, onPrev]);

  if (!show || imageUrls.length === 0) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh]">
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <button
            onClick={onDownload}
            className="bg-white text-black p-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            title="Download current image"
          >
            <FiDownload size={20} />
          </button>
          <button
            onClick={onClose}
            className="bg-white text-black p-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>
        
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white text-black px-3 py-1 rounded-lg shadow-lg text-sm font-medium">
            {currentIndex + 1} / {totalImages}
          </div>
        </div>
        
        <div className="relative w-full h-[85vh] bg-black rounded-xl overflow-hidden shadow-2xl">
          {!imagesLoaded[currentIndex] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white">Loading image...</p>
              </div>
            </div>
          )}
          
          <img
            src={imageUrls[currentIndex]}
            alt={`Converted image ${currentIndex + 1}`}
            className={`w-full h-full object-contain transition-opacity duration-300 ${imagesLoaded[currentIndex] ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => {
              // This will be handled by parent component
            }}
          />
          
          {totalImages > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-lg transition-colors z-10"
                title="Previous image (Left Arrow)"
              >
                <FiChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-lg transition-colors z-10"
                title="Next image (Right Arrow)"
              >
                <FiChevronRight size={24} />
              </button>
            </>
          )}
        </div>
        
        {totalImages > 1 && thumbnailUrls.length > 0 && (
          <div className="mt-4 flex justify-center space-x-2 overflow-x-auto py-2">
            {thumbnailUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => {
                  // This will be handled by parent component
                }}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex ? 'border-white scale-110' : 'border-gray-600 hover:border-gray-400'}`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Click outside the image or press ESC to close • Use arrow keys to navigate</p>
          {totalImages > 1 && (
            <p className="mt-1">Click on thumbnails below to switch images</p>
          )}
        </div>
      </div>
    </div>
  );
}
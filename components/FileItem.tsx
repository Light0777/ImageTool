'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiImage, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ProcessedFile } from '@/types';

interface FileItemProps {
  files: ProcessedFile[];
  onPreview: (index: number) => void;
}

export default function FileItem({
  files,
  onPreview
}: FileItemProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);

  // Get current file based on slider index
  const currentFile = files[currentIndex];

  // Check if file is HEIC/HEIF
  const isHeicFile = (fileToCheck: ProcessedFile) => {
    const fileName = fileToCheck.file.name.toLowerCase();
    return fileName.endsWith('.heic') || 
           fileName.endsWith('.heif') || 
           fileName.endsWith('.hif') ||
           fileToCheck.file.type.includes('heic') ||
           fileToCheck.file.type.includes('heif');
  };

  // Create preview URLs for all files
  useEffect(() => {
    const newPreviewUrls: (string | null)[] = [];
    
    files.forEach((file, index) => {
      if (file.convertedUrl) {
        // Use converted JPG URL
        newPreviewUrls[index] = file.convertedUrl;
      } else if (!isHeicFile(file)) {
        // Try to create preview for non-HEIC files
        try {
          const url = URL.createObjectURL(file.file);
          newPreviewUrls[index] = url;
        } catch (error) {
          console.error('Failed to create preview:', error);
          newPreviewUrls[index] = null;
        }
      } else {
        // For HEIC files, we can't create a preview
        newPreviewUrls[index] = null;
      }
    });
    
    setPreviewUrls(newPreviewUrls);
    
    // Clean up function
    return () => {
      newPreviewUrls.forEach((url, index) => {
        if (url && !url.startsWith('blob:') && !files[index]?.convertedUrl) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'uploading':
      case 'converting': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Converted';
      case 'error': return 'Failed';
      case 'uploading': return 'Uploading...';
      case 'converting': return 'Converting...';
      default: return 'Ready';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file extension
  const getFileExtension = (fileToCheck: ProcessedFile) => {
    return fileToCheck.file.name.split('.').pop()?.toUpperCase() || 'HEIC';
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + files.length) % files.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % files.length);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  return (
    <div className="p-4 sm:p-4">
      {/* 1. Image Slider - Centered */}
      <div className="mb-6">
        <div className="relative mx-auto w-full max-w-xs aspect-square overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
          {/* Current image display */}
          {previewUrls[currentIndex] && currentFile.convertedUrl ? (
            // Converted JPG image
            <div
              className="relative w-full h-full cursor-pointer"
              onClick={() => onPreview(currentIndex)}
>
              <Image
                src={previewUrls[currentIndex]!}
                alt={`Converted ${currentFile.file.name}`}
                fill
                className="object-contain"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center">
                <div className="opacity-0 hover:opacity-100 transition-opacity bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                  Click to enlarge
                </div>
              </div>
              
              {/* Success indicator */}
              <div className="absolute top-2 right-2">
                <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                  ✓ JPG
                </div>
              </div>
            </div>
          ) : previewUrls[currentIndex] && !isHeicFile(currentFile) ? (
            // Preview for non-HEIC files
            <div className="relative w-full h-full">
              <Image
                src={previewUrls[currentIndex]!}
                alt={`Preview of ${currentFile.file.name}`}
                fill
                className="object-contain"
                unoptimized
              />
              <div className="absolute top-2 right-2">
                <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                  PREVIEW
                </div>
              </div>
            </div>
          ) : (
            // HEIC file placeholder or loading
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <div className="text-gray-300 text-5xl mb-4">
                <FiImage size={48} />
              </div>
              <div className="text-center">
                <div className="bg-gray-200 text-gray-700 text-sm font-bold px-3 py-1 rounded-md mb-2 inline-block">
                  {getFileExtension(currentFile)} FILE
                </div>
                <p className="text-gray-400 text-sm font-medium">
                  {currentFile.convertedUrl ? 'JPG Preview' : 'HEIC/HEIF Format'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {currentFile.convertedUrl ? 'Converted successfully' : 'Browser does not support HEIC preview'}
                </p>
              </div>
              
              {/* Show loading spinner if converting */}
              {currentFile.isProcessing && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-blue-500 text-xs mt-2">Converting to JPG...</p>
                </div>
              )}
            </div>
          )}
          
          {/* Error indicator */}
          {currentFile.error && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-red-50 border border-red-200 rounded-md p-2">
                <p className="text-red-600 text-xs font-medium text-center">
                  ❌ Conversion failed
                </p>
              </div>
            </div>
          )}

          {/* Navigation arrows for multiple files */}
          {files.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-colors"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-colors"
              >
                <FiChevronRight size={20} />
              </button>
            </>
          )}

          {/* File counter */}
          {files.length > 1 && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
              {currentIndex + 1} / {files.length}
            </div>
          )}
        </div>

        {/* Thumbnail dots for multiple files */}
        {files.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {files.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex ? 'bg-black' : 'bg-gray-300 hover:bg-gray-400'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. File Name - Centered (updates with slider) */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-900 truncate px-2">
          {currentFile.file.name}
        </h3>
        <div className="flex items-center justify-center mt-2 gap-2">
          <span className="text-sm font-medium text-gray-500">
            {getFileExtension(currentFile)}
          </span>
          <span className="text-gray-300">→</span>
          <span className="text-sm font-bold text-green-600">
            JPG
          </span>
        </div>
      </div>

      {/* 3. File Information - Sequential (updates with slider) */}
      <div className="space-y-3 mb-2">
        {/* File Size */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">File Size:</span>
          <span className="text-sm text-gray-800 font-medium">{formatFileSize(currentFile.file.size)}</span>
        </div>

        {/* Format Info */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Format:</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${currentFile.convertedUrl ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
              {getFileExtension(currentFile)}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
              JPG
            </span>
          </div>
        </div>
      </div>

      {/* Preview button for converted images */}
      {currentFile.convertedUrl && currentFile.convertedBlob && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button
            onClick={() => onPreview(currentIndex)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center mx-auto"
          >
            👁️ Click image to preview full size
          </button>
        </div>
      )}
    </div>
  );
}
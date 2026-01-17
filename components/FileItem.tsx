'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FiImage, FiChevronLeft, FiChevronRight, FiPlus, FiX } from 'react-icons/fi';
import { ProcessedFile } from '@/types';

interface FileItemProps {
  files: ProcessedFile[];
  onPreview: (index: number) => void;
  onAddMoreFiles?: () => void;
  onCurrentIndexChange?: (index: number) => void;
  onRemoveFile?: (id: string) => void; // New prop for removing files
}

export default function FileItem({
  files,
  onPreview,
  onAddMoreFiles,
  onCurrentIndexChange,
  onRemoveFile
}: FileItemProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Get current file based on slider index
  const currentFile = files[currentIndex];

  useEffect(() => {
    if (onCurrentIndexChange) {
      onCurrentIndexChange(currentIndex);
    }
  }, [currentIndex, onCurrentIndexChange]);

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

  // Enhanced "Add More Files" logic - fixed
  const handleAddMoreFiles = () => {
    if (onAddMoreFiles) {
      onAddMoreFiles();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      // This should trigger the parent component's file handling
      console.log('Selected new files:', selectedFiles);
      // Note: You'll need to connect this to your parent component's file handling
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fixed cancel button logic
  const handleRemoveFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering thumbnail click
    e.preventDefault(); // Prevent any default behavior

    if (onRemoveFile) {
      onRemoveFile(fileId);

      // Adjust current index if needed
      const removedIndex = files.findIndex(f => f.id === fileId);
      if (removedIndex !== -1) {
        // If we removed the current file
        if (removedIndex === currentIndex) {
          // If it's the only file, stay at index 0
          if (files.length === 1) {
            setCurrentIndex(0);
          } else if (currentIndex === files.length - 1) {
            // If it's the last file, go to previous
            setCurrentIndex(Math.max(0, currentIndex - 1));
          }
          // If it's not the last file, currentIndex will automatically point to next file
          // because array indices shift
        } else if (removedIndex < currentIndex) {
          // If removed file is before current, adjust current index
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }
    }
  };

  return (
    <div className="p-1">
      {/* Hidden file input for adding more files */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".heic,.heif,.hif,image/heic,image/heif"
        multiple
        onChange={handleFileSelect}
      />

      {/* 1. Main Image Display - Fixed width issue */}
      <div className="flex flex-col items-center mb-6">
        {/* Fixed: Main image container with constant max width */}
        <div className="relative w-[90vw] sm:w-full max-w-4xl mx-auto mb-4">
          <div className="relative rounded-2xl overflow-hidden border border-gray-300 bg-gray-50">
            {/* Current image display */}
            {previewUrls[currentIndex] && currentFile.convertedUrl ? (
              // Converted JPG image
              <div
                className="relative w-full cursor-pointer"
                onClick={() => onPreview(currentIndex)}>
                <div className="relative w-full h-auto max-h-[60vh] flex items-center justify-center p-4">
                  <Image
                    src={previewUrls[currentIndex]!}
                    alt={`Converted ${currentFile.file.name}`}
                    width={800}
                    height={800}
                    className="w-auto h-auto max-w-[30vw] max-h-[50vh] object-contain"
                    unoptimized
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center">
                  <div className="opacity-0 hover:opacity-100 transition-opacity bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                    Click to enlarge
                  </div>
                </div>

                {/* Success indicator */}
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                    ✓ JPG
                  </div>
                </div>
              </div>
            ) : previewUrls[currentIndex] && !isHeicFile(currentFile) ? (
              // Preview for non-HEIC files
              <div className="relative w-full">
                <div className="relative w-full h-auto max-h-[60vh] flex items-center justify-center p-4">
                  <Image
                    src={previewUrls[currentIndex]!}
                    alt={`Preview of ${currentFile.file.name}`}
                    width={800}
                    height={800}
                    className="w-auto h-auto max-h-[50vh] max-w-[30vw] object-contain"
                    unoptimized
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                    PREVIEW
                  </div>
                </div>
              </div>
            ) : (
              // HEIC file placeholder or loading
              <div className="flex flex-col items-center justify-center p-10 min-h-75">
                <div className="text-gray-300 text-5xl mb-4">
                  <FiImage size={64} />
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
              <div className="absolute bottom-4 left-4 right-4">
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-colors"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-colors"
                >
                  <FiChevronRight size={20} />
                </button>
              </>
            )}

            {/* File counter */}
            {files.length > 1 && (
              <div className="absolute top-4 left-4 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                {currentIndex + 1} / {files.length}
              </div>
            )}
          </div>
        </div>

        {/* 2. File Name - Centered */}
        <div className="mb-4 text-center w-full max-w-4xl px-4">
          <h3 className="text-lg font-bold text-gray-900 truncate">
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

        {/* 3. Thumbnail preview strip - Fixed width issue */}
        <div className="w-full max-w-4xl px-4">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-2">
            {/* Thumbnail container with fixed width */}
            <div className="w-full max-w-4xl px-4">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-2 relative">
                {/* Left navigation for thumbnails if many files */}
                {files.length > 4 && (
                  <button
                    onClick={goToPrevious}
                    className="hidden sm:flex p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0 z-10"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                )}

                {/* Thumbnail container with dynamic fade effects */}
                <div className="w-auto sm:w-full relative">
                  {/* Left fade gradient - shows when scrolled to the right */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-linear-to-r from-white to-transparent z-10 pointer-events-none transition-opacity duration-300"
                    style={{
                      opacity: (thumbnailContainerRef.current?.scrollLeft ?? 0) > 0 ? 1 : 0
                    }}></div>

                  {/* Thumbnail container - no scrollbar */}
                  <div
                    ref={thumbnailContainerRef}
                    className="overflow-x-auto max-w-100 py-2 px-20 scrollbar-hide"
                    onScroll={() => {
                      // Force re-render for fade effects
                      const event = new Event('scroll');
                      window.dispatchEvent(event);
                    }}
                  >
                    <div
                      className="flex justify-start sm:justify-center items-center gap-3 px-4 sm:px-6"
                      style={{ minWidth: 'min-content' }}
                    >
                      {files.map((file, idx) => (
                        <div
                          key={file.id}
                          className="relative shrink-0"
                        >
                          <button
                            onClick={() => goToSlide(idx)}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex
                              ? 'border-black shadow-md scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            {previewUrls[idx] ? (
                              <Image
                                src={previewUrls[idx]!}
                                alt={`Thumbnail ${idx + 1}`}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <FiImage size={20} className="text-gray-400" />
                              </div>
                            )}
                            {idx === currentIndex && (
                              <div className="absolute inset-0 bg-black/20" />
                            )}
                          </button>

                          {/* Fixed cancel button */}
                          {onRemoveFile && (
                            <button
                              onClick={(e) => handleRemoveFile(file.id, e)}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors z-20 w-5 h-5 flex items-center justify-center"
                              title="Remove file"
                              type="button"
                            >
                              <FiX size={10} />
                            </button>
                          )}

                          {/* Status indicator for errors */}
                          {file.status === 'error' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-700 text-[10px] font-medium px-1 py-0.5 text-center truncate">
                              Error
                            </div>
                          )}
                        </div>
                      ))}

                      {/* "+" button to add more files */}
                      <button
                        onClick={handleAddMoreFiles}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-all flex flex-col items-center justify-center text-gray-500 hover:text-black"
                        title="Add more files"
                        type="button"
                      >
                        <FiPlus size={20} />
                        <span className="text-xs mt-1">Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Right fade gradient - shows when not scrolled to the end */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-linear-to-l from-white to-transparent z-10 pointer-events-none transition-opacity duration-300"
                    style={{
                      opacity: thumbnailContainerRef.current &&
                        (thumbnailContainerRef.current.scrollWidth - thumbnailContainerRef.current.clientWidth) >
                        thumbnailContainerRef.current.scrollLeft ? 1 : 0
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Right navigation for thumbnails if many files */}
            {files.length > 4 && (
              <button
                onClick={goToNext}
                className="hidden sm:flex p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0"
              >
                <FiChevronRight size={20} />
              </button>
            )}

            {/* Mobile navigation buttons */}
            {files.length > 1 && (
              <div className="flex sm:hidden gap-4 mt-2">
                <button
                  onClick={goToPrevious}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  onClick={goToNext}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            )}
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
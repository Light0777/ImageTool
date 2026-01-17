'use client';

import { useState } from 'react';
import { FiImage, FiSettings } from 'react-icons/fi';
import { ProcessedFile, ConversionOptions } from '@/types';
import FileItem from './FileItem';

interface FileListProps {
  files: ProcessedFile[];
  convertedFiles: ProcessedFile[];
  onConvert: (id: string) => void;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
  onPreview: (index: number) => void;
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
}

export default function FileList({
  files,
  convertedFiles,
  onConvert,
  onDownload,
  onRemove,
  onPreview,
  options,
  onOptionsChange
}: FileListProps) {
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0); // Add this state

  // Calculate total size of all files
  const calculateTotalSize = () => {
    const totalBytes = files.reduce((sum, file) => sum + file.file.size, 0);

    // Format the size
    if (totalBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(totalBytes) / Math.log(k));
    return parseFloat((totalBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format individual file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get current file
  const currentFile = files[currentFileIndex];

  const handleCurrentIndexChange = (index: number) => {
    setCurrentFileIndex(index);
  };

  if (files.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-xl font-medium mb-2">No Files Selected</h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Drop HEIC files or click "Select Files" to begin conversion.
          You can select up to 10 images at once.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg w-full">
        <div className="p-6 flex flex-row items-center justify-between gap-4 w-105 sm:w-full">
          {/* Desktop version - normal layout */}
          <div className="hidden sm:flex flex-row items-center gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-md font-medium flex items-center">
                <FiImage className="mr-2" /> Selected Files: {files.length}
              </h3>
            </div>

            {/* Individual File Size */}
            {currentFile && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center gap-1">
                  <span className="text-sm font-medium text-gray-600">
                    Image Size:
                  </span>
                  <span className="text-sm text-gray-800 font-medium">{formatFileSize(currentFile.file.size)}</span>
                </div>
              </div>
            )}

            {/* Total Size */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center gap-1">
                <span className="text-sm font-medium text-gray-600">Total Size:</span>
                <span className="text-sm text-gray-800 font-bold">{calculateTotalSize()}</span>
              </div>
            </div>
          </div>

          {/* Mobile version - scrollable with fade effects */}
          <div className="flex-1 sm:hidden relative overflow-hidden scrollbar-hide">
            {/* Left fade gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-linear-to-r from-white to-transparent z-10 pointer-events-none"></div>

            {/* Scrollable stats container */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pl-25 scrollbar-hide">
              <div className="flex flex-row items-center gap-2 min-w-max py-2">
                <div className="bg-gray-50 rounded-lg p-3 shrink-0">
                  <h3 className="text-sm font-medium flex items-center">
                    <FiImage className="mr-2" /> Selected: {files.length}
                  </h3>
                </div>

                {/* Individual File Size */}
                {currentFile && (
                  <div className="bg-gray-50 rounded-lg p-3 shrink-0">
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-sm font-medium text-gray-600">
                        File Size:
                      </span>
                      <span className="text-sm text-gray-800 font-medium">{formatFileSize(currentFile.file.size)}</span>
                    </div>
                  </div>
                )}

                {/* Total Size */}
                <div className="bg-gray-50 rounded-lg p-3 shrink-0">
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-sm font-medium text-gray-600">Total:</span>
                    <span className="text-sm text-gray-800 font-bold">{calculateTotalSize()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right fade gradient - fades into settings icon area */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-white to-transparent z-10 pointer-events-none"></div>
          </div>

          {/* Settings Icon - positioned for both mobile and desktop */}
          <div className="flex items-center ml-2 sm:ml-0">
            <button
              onClick={() => setShowSettingsPopup(true)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
              title="Conversion Settings"
            >
              <FiSettings size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Single FileItem component with slider that shows all files */}
          <FileItem
            files={files}  // Pass ALL files array
            onPreview={onPreview}
            onCurrentIndexChange={handleCurrentIndexChange} // Add this prop
          />
        </div>
      </div>

      {/* Settings Popup Modal */}
      {showSettingsPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-medium flex items-center">
                <FiSettings className="mr-2" /> Conversion Settings
              </h3>
              <button
                onClick={() => setShowSettingsPopup(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Quality Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Image Quality: {options.quality}%</label>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                      {getQualityLabel(options.quality)}
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={options.quality}
                      onChange={(e) => onOptionsChange({ ...options, quality: parseInt(e.target.value) })}
                      className="w-full h-1 sm:h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer
                 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:h-4
                 [&::-webkit-slider-thumb]:w-4
                 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-black
                 [&::-webkit-slider-thumb]:border-2
                 [&::-webkit-slider-thumb]:border-white
                 [&::-webkit-slider-thumb]:shadow-lg
                 [&::-moz-range-thumb]:h-4
                 [&::-moz-range-thumb]:w-4
                 [&::-moz-range-thumb]:rounded-full
                 [&::-moz-range-thumb]:bg-black
                 [&::-moz-range-thumb]:border-2
                 [&::-moz-range-thumb]:border-white
                 [&::-moz-range-thumb]:shadow-lg"
                    />
                    {/* Custom progress track */}
                    <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 pointer-events-none">
                      <div
                        className="h-full bg-black rounded-full"
                        style={{ width: `${options.quality}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span className="font-medium">Smaller File</span>
                    <span className="font-medium">Better Quality</span>
                  </div>
                </div>

                {/* Metadata Toggle */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Keep Metadata</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Preserve EXIF data including location, camera settings, and creation date.
                    </p>
                  </div>
                  <button
                    onClick={() => onOptionsChange({ ...options, keepMetadata: !options.keepMetadata })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${options.keepMetadata ? 'bg-black' : 'bg-gray-300'
                      } cursor-pointer hover:opacity-90`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all ${options.keepMetadata ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Advanced Options Section */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium mb-3">Advanced Options</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resize Images</span>
                      <span className="text-xs text-gray-500">Coming soon</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Format Optimization</span>
                      <span className="text-xs text-gray-500">Coming soon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => setShowSettingsPopup(false)}
                className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to get quality label
const getQualityLabel = (quality: number) => {
  if (quality === 100) return 'Best';
  if (quality >= 90) return 'High';
  if (quality >= 80) return 'Good';
  if (quality >= 70) return 'Medium';
  return 'Low';
};

// Helper function to calculate average file size
const calculateAverageSize = (files: ProcessedFile[]) => {
  if (files.length === 0) return '0 Bytes';

  const totalBytes = files.reduce((sum, file) => sum + file.file.size, 0);
  const averageBytes = totalBytes / files.length;

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(averageBytes) / Math.log(k));
  return parseFloat((averageBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get largest file size
const getLargestFileSize = (files: ProcessedFile[]) => {
  if (files.length === 0) return '0 Bytes';

  const largestFile = files.reduce((largest, file) =>
    file.file.size > largest.file.size ? file : largest
  );

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(largestFile.file.size) / Math.log(k));
  return parseFloat((largestFile.file.size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
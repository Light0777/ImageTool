'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Image from 'next/image';
import { FiZoomIn, FiDownload, FiTrash2, FiSettings, FiImage, FiUpload, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type ConversionOptions = {
  quality: number;
  keepMetadata: boolean;
};

type UploadStatus = 'idle' | 'uploading' | 'converting' | 'success' | 'error';

type ProcessedFile = {
  id: string;
  file: File;
  convertedUrl: string | null;
  convertedBlob: Blob | null;
  status: UploadStatus;
  error: string | null;
  isProcessing: boolean;
  isImageLoaded: boolean;
};

export default function Home() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    quality: 85,
    keepMetadata: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImageUrls, setModalImageUrls] = useState<string[]>([]);
  const [modalImageBlobs, setModalImageBlobs] = useState<Blob[]>([]);
  const [modalThumbnailUrls, setModalThumbnailUrls] = useState<string[]>([]);
  const [modalImagesLoaded, setModalImagesLoaded] = useState<boolean[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get all converted files
  const convertedFiles = files.filter(file => file.convertedBlob && file.convertedUrl);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.convertedUrl) {
          URL.revokeObjectURL(file.convertedUrl);
        }
      });
      modalImageUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
      modalThumbnailUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, [files, modalImageUrls, modalThumbnailUrls]);

  const isValidHeicFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.heic', '.heif', '.heics', '.heifs', '.hif', '.hief', '.avci', '.avcs'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    const validMimeTypes = [
      'image/heic',
      'image/heif',
      'image/heic-sequence',
      'image/heif-sequence',
      'image/avif',
      'image/avif-sequence',
      'application/octet-stream',
    ];

    const hasValidMimeType = validMimeTypes.includes(file.type);

    return hasValidExtension || hasValidMimeType;
  };

  const handleFilesSelect = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const validFiles: ProcessedFile[] = [];
    const invalidFiles: string[] = [];

    selectedFiles.forEach(selectedFile => {
      if (!isValidHeicFile(selectedFile)) {
        invalidFiles.push(selectedFile.name);
      } else {
        validFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file: selectedFile,
          convertedUrl: null,
          convertedBlob: null,
          status: 'idle',
          error: null,
          isProcessing: false,
          isImageLoaded: false,
        });
      }
    });

    if (validFiles.length > 0) {
      setFiles(prev => {
        const newFiles = [...prev, ...validFiles];
        return newFiles.slice(0, 10);
      });
    }

    if (invalidFiles.length > 0) {
      setError(`The following files are not valid HEIC/HEIF files: ${invalidFiles.join(', ')}`);
    } else {
      setError(null);
    }

    setStatus('idle');
    setIsProcessing(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFilesSelect(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.heic', '.heif', '.hif']
    },
    multiple: true,
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024,
  });

  const handleManualFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      handleFilesSelect(selectedFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertImage = async (fileId: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const fileToConvert = files[fileIndex];
    if (fileToConvert.isProcessing) return;

    setFiles(prev => prev.map((file, idx) => 
      idx === fileIndex ? { ...file, status: 'uploading', isProcessing: true, error: null } : file
    ));
    setError(null);

    const formData = new FormData();
    formData.append('file', fileToConvert.file);
    formData.append('quality', options.quality.toString());
    formData.append('keepMetadata', options.keepMetadata.toString());

    try {
      const response = await axios.post('/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
        timeout: 300000,
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty response from server');
      }

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'image/jpeg'
      });
      const url = URL.createObjectURL(blob);

      setFiles(prev => prev.map((file, idx) => 
        idx === fileIndex ? { 
          ...file, 
          convertedUrl: url, 
          convertedBlob: blob,
          status: 'success', 
          isProcessing: false 
        } : file
      ));
    } catch (err: any) {
      console.error('Conversion error:', err);
      
      let errorMessage = 'Conversion failed';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The file might be too large or server is busy.';
      } else if (err.response) {
        if (err.response.data instanceof Blob) {
          try {
            const errorText = await err.response.data.text();
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorJson.message || errorMessage;
            } catch {
              errorMessage = errorText || 'Server returned an error';
            }
          } catch {
            errorMessage = 'Server error occurred';
          }
        } else if (typeof err.response.data === 'object') {
          errorMessage = err.response.data.message || err.response.data.error || errorMessage;
        }

        if (err.response.status === 413) {
          errorMessage = 'File too large. Maximum size is 100MB.';
        } else if (err.response.status === 400) {
          errorMessage = 'Invalid file format. Please upload a valid HEIC/HEIF file.';
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = err.message || errorMessage;
      }

      setFiles(prev => prev.map((file, idx) => 
        idx === fileIndex ? { 
          ...file, 
          status: 'error', 
          isProcessing: false, 
          error: errorMessage 
        } : file
      ));
    }
  };

  const convertAllImages = async () => {
    const filesToConvert = files.filter(file => !file.convertedUrl && file.status !== 'error');
    if (filesToConvert.length === 0) return;

    setIsProcessing(true);
    setStatus('converting');

    for (const file of filesToConvert) {
      if (file.status === 'idle') {
        await convertImage(file.id);
      }
    }

    setIsProcessing(false);
    setStatus('idle');
  };

  const downloadImage = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file?.convertedBlob) {
      console.error('No blob available for download');
      return;
    }

    try {
      const downloadUrl = URL.createObjectURL(file.convertedBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const originalName = file.file.name.replace(/\.[^/.]+$/, '');
      link.download = `${originalName}_converted.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download image');
    }
  };

  const downloadAllImages = async () => {
    const filesToDownload = files.filter(f => f.convertedBlob && f.status === 'success');
    
    if (filesToDownload.length === 0) return;
    
    if (filesToDownload.length === 1) {
      downloadImage(filesToDownload[0].id);
      return;
    }
    
    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i];
      const downloadUrl = URL.createObjectURL(file.convertedBlob!);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const originalName = file.file.name.replace(/\.[^/.]+$/, '');
      link.download = `${originalName}_converted.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      
      if (i < filesToDownload.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.convertedUrl) {
        URL.revokeObjectURL(fileToRemove.convertedUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const removeAllFiles = () => {
    files.forEach(file => {
      if (file.convertedUrl) {
        URL.revokeObjectURL(file.convertedUrl);
      }
    });
    setFiles([]);
    setError(null);
    setStatus('idle');
    setIsProcessing(false);
  };

  const openImageModal = (startIndex: number) => {
    if (convertedFiles.length === 0) return;

    // Clear any pending timeout
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }
    
    // Clean up previous modal URLs
    modalImageUrls.forEach(url => URL.revokeObjectURL(url));
    modalThumbnailUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Create new blob URLs for modal (full size)
    const urls: string[] = [];
    const blobs: Blob[] = [];
    const thumbnailUrls: string[] = [];
    
    convertedFiles.forEach(file => {
      if (file.convertedBlob) {
        // Create URL for full size modal image
        const modalUrl = URL.createObjectURL(file.convertedBlob);
        urls.push(modalUrl);
        blobs.push(file.convertedBlob);
        
        // Create URL for thumbnail (using the same blob)
        const thumbnailUrl = URL.createObjectURL(file.convertedBlob);
        thumbnailUrls.push(thumbnailUrl);
      }
    });
    
    setModalImageUrls(urls);
    setModalImageBlobs(blobs);
    setModalThumbnailUrls(thumbnailUrls);
    setCurrentImageIndex(startIndex);
    setModalImagesLoaded(new Array(urls.length).fill(false));
    setShowImageModal(true);
  };

  const handleImageLoad = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, isImageLoaded: true } : file
    ));
  };

  const downloadCurrentModalImage = () => {
    if (!modalImageBlobs[currentImageIndex]) {
      console.error('No blob available for modal download');
      return;
    }

    try {
      const downloadUrl = URL.createObjectURL(modalImageBlobs[currentImageIndex]);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileName = convertedFiles[currentImageIndex]?.file.name.replace(/\.[^/.]+$/, '') || 'converted_image';
      link.download = `${fileName}_converted.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (err) {
      console.error('Modal download error:', err);
      setError('Failed to download image');
    }
  };

  const nextImage = () => {
    if (convertedFiles.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % convertedFiles.length);
    }
  };

  const prevImage = () => {
    if (convertedFiles.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + convertedFiles.length) % convertedFiles.length);
    }
  };

  const closeModal = () => {
    setShowImageModal(false);
    
    // Clear any pending timeout
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }
    
    // Revoke modal URLs after a delay
    modalTimeoutRef.current = setTimeout(() => {
      modalImageUrls.forEach(url => URL.revokeObjectURL(url));
      modalThumbnailUrls.forEach(url => URL.revokeObjectURL(url));
      setModalImageUrls([]);
      setModalImageBlobs([]);
      setModalThumbnailUrls([]);
      setModalImagesLoaded([]);
    }, 300);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showImageModal) {
        closeModal();
      }
      if (e.key === 'ArrowRight' && showImageModal) {
        nextImage();
      }
      if (e.key === 'ArrowLeft' && showImageModal) {
        prevImage();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showImageModal, currentImageIndex, convertedFiles.length]);

  const hasFiles = files.length > 0;
  const canConvertAll = files.some(f => !f.convertedUrl && f.status !== 'error');
  const canDownloadAll = files.some(f => f.convertedBlob && f.status === 'success');

  return (
    <main className="min-h-screen bg-white text-black p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-2">
            HEIC to JPG Converter
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Convert HEIC/HEIF images to JPEG format (Max 10 images)
          </p>
          <div className="mt-2 text-sm text-gray-500">
            {files.length}/10 images selected
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Options */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Zone */}
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              <div className="text-5xl mb-4">📤</div>
              <h3 className="text-xl font-medium mb-2">Drop HEIC files here</h3>
              <p className="text-gray-600 mb-4">or click to browse</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Supports HEIC/HEIF formats</p>
                <p>Max 10 files • Max 100MB each</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center mx-auto"
              >
                <FiUpload className="mr-2" />
                Select Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleManualFileSelect}
                className="hidden"
                accept=".heic,.heif,.hif"
                multiple
              />
            </div>

            {error && status === 'idle' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">⚠️</span>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {hasFiles && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <FiSettings className="mr-2" /> Bulk Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={convertAllImages}
                    disabled={isProcessing || !canConvertAll}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center ${isProcessing || !canConvertAll
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 active:scale-[0.98]'
                      }`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></span>
                        Converting All...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🔄</span>
                        Convert All ({files.filter(f => !f.convertedUrl).length})
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={downloadAllImages}
                    disabled={!canDownloadAll}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center ${!canDownloadAll
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
                      }`}
                  >
                    <FiDownload className="mr-2" />
                    Download All ({files.filter(f => f.convertedBlob).length})
                  </button>
                  
                  <button
                    onClick={removeAllFiles}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <FiTrash2 className="mr-2" />
                    Clear All Files
                  </button>
                </div>
              </div>
            )}

            {/* Options */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FiSettings className="mr-2" /> Conversion Options
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Image Quality: {options.quality}%</label>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                      {options.quality === 100 ? 'Best' :
                        options.quality >= 90 ? 'High' :
                          options.quality >= 80 ? 'Good' :
                            options.quality >= 70 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={options.quality}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      quality: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    disabled={isProcessing}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span className="font-medium">Smaller File</span>
                    <span className="font-medium">Better Quality</span>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Keep Metadata</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Preserve EXIF data including location, camera settings, and creation date.
                    </p>
                  </div>
                  <button
                    onClick={() => setOptions(prev => ({
                      ...prev,
                      keepMetadata: !prev.keepMetadata
                    }))}
                    disabled={isProcessing}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${options.keepMetadata ? 'bg-black' : 'bg-gray-300'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all ${options.keepMetadata ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - File List & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* File List */}
            {hasFiles && (
              <div className="border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-medium flex items-center justify-between">
                    <span className="flex items-center">
                      <FiImage className="mr-2" /> Selected Files ({files.length})
                    </span>
                    <span className="text-sm font-normal text-gray-500">
                      {files.filter(f => f.convertedBlob).length} converted
                    </span>
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-125 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1 min-w-0">
                          <div className="text-2xl mt-1 shrink-0">📄</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="truncate font-medium text-base">{file.file.name}</p>
                              <div className="flex items-center space-x-2 shrink-0 ml-2">
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                  title="Remove file"
                                >
                                  <FiX size={18} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Size:</span> {(file.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Status:</span>
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${file.status === 'success' ? 'bg-green-100 text-green-800' :
                                    file.status === 'error' ? 'bg-red-100 text-red-800' :
                                      file.status === 'uploading' || file.status === 'converting' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                  }`}>
                                  {file.status === 'success' ? 'Converted' :
                                    file.status === 'error' ? 'Failed' :
                                      file.status === 'uploading' ? 'Uploading...' :
                                        file.status === 'converting' ? 'Converting...' : 'Ready'}
                                </span>
                              </p>
                            </div>
                            
                            {file.error && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{file.error}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2 mt-4">
                              {!file.convertedUrl && file.status !== 'error' && (
                                <button
                                  onClick={() => convertImage(file.id)}
                                  disabled={file.isProcessing}
                                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center ${file.isProcessing
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800'
                                    }`}
                                >
                                  {file.isProcessing ? (
                                    <>
                                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></span>
                                      Processing...
                                    </>
                                  ) : (
                                    'Convert to JPG'
                                  )}
                                </button>
                              )}
                              
                              {file.convertedUrl && file.convertedBlob && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      const convertedIndex = convertedFiles.findIndex(f => f.id === file.id);
                                      if (convertedIndex >= 0) {
                                        openImageModal(convertedIndex);
                                      }
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center"
                                  >
                                    <FiZoomIn className="mr-2" />
                                    Preview
                                  </button>
                                  <button
                                    onClick={() => downloadImage(file.id)}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center"
                                  >
                                    <FiDownload className="mr-2" />
                                    Download
                                  </button>
                                </div>
                              )}
                              
                              {file.status === 'error' && (
                                <button
                                  onClick={() => convertImage(file.id)}
                                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                  Retry
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {file.convertedUrl && (
                        <div className="mt-4">
                          <div className="relative h-48 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                            {!file.isImageLoaded && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                                  <p className="text-gray-600 text-sm">Loading...</p>
                                </div>
                              </div>
                            )}
                            <div 
                              className={`relative w-full h-full ${!file.isImageLoaded ? 'invisible' : 'visible'} cursor-pointer`}
                              onClick={() => {
                                const convertedIndex = convertedFiles.findIndex(f => f.id === file.id);
                                if (convertedIndex >= 0) {
                                  openImageModal(convertedIndex);
                                }
                              }}
                            >
                              <Image
                                src={file.convertedUrl}
                                alt={`Converted ${file.file.name}`}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 33vw"
                                unoptimized={true}
                                onLoad={() => handleImageLoad(file.id)}
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center">
                                <div className="opacity-0 hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                                  Click to enlarge
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasFiles && (
              <div className="border border-gray-200 rounded-lg p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-medium mb-2">No Files Selected</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Drop HEIC files or click "Select Files" to begin conversion.
                  You can select up to 10 images at once.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center"
                >
                  <FiUpload className="mr-2" />
                  Select Files
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal with Slider */}
        {showImageModal && modalImageUrls.length > 0 && (
          <div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <div className="relative w-full max-w-5xl max-h-[90vh]">
              <div className="absolute top-4 right-4 z-10 flex space-x-2">
                <button
                  onClick={downloadCurrentModalImage}
                  className="bg-white text-black p-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                  title="Download current image"
                >
                  <FiDownload size={20} />
                </button>
                <button
                  onClick={closeModal}
                  className="bg-white text-black p-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                  title="Close (ESC)"
                >
                  ✕
                </button>
              </div>
              
              {/* Image counter */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-white text-black px-3 py-1 rounded-lg shadow-lg text-sm font-medium">
                  {currentImageIndex + 1} / {convertedFiles.length}
                </div>
              </div>
              
              <div className="relative w-full h-[85vh] bg-black rounded-xl overflow-hidden shadow-2xl">
                {!modalImagesLoaded[currentImageIndex] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-white">Loading image...</p>
                    </div>
                  </div>
                )}
                
                {/* Use regular img tag for blob URLs */}
                {modalImageUrls[currentImageIndex] && (
                  <img
                    src={modalImageUrls[currentImageIndex]}
                    alt={`Converted image ${currentImageIndex + 1}`}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${modalImagesLoaded[currentImageIndex] ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => {
                      setModalImagesLoaded(prev => {
                        const newLoaded = [...prev];
                        newLoaded[currentImageIndex] = true;
                        return newLoaded;
                      });
                    }}
                    onError={(e) => {
                      console.error('Failed to load modal image:', e);
                      console.error('Image URL:', modalImageUrls[currentImageIndex]);
                      setModalImagesLoaded(prev => {
                        const newLoaded = [...prev];
                        newLoaded[currentImageIndex] = false;
                        return newLoaded;
                      });
                    }}
                  />
                )}
                
                {/* Navigation arrows - only show if multiple images */}
                {convertedFiles.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-lg transition-colors z-10"
                      title="Previous image (Left Arrow)"
                    >
                      <FiChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-lg transition-colors z-10"
                      title="Next image (Right Arrow)"
                    >
                      <FiChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
              
              {/* Image thumbnails for navigation - only show if multiple images */}
              {convertedFiles.length > 1 && modalThumbnailUrls.length > 0 && (
                <div className="mt-4 flex justify-center space-x-2 overflow-x-auto py-2">
                  {convertedFiles.map((file, index) => (
                    <button
                      key={file.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-white scale-110' : 'border-gray-600 hover:border-gray-400'}`}
                    >
                      {modalThumbnailUrls[index] && (
                        <img
                          src={modalThumbnailUrls[index]}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load thumbnail:', index);
                            // Fallback to main image URL if thumbnail fails
                            e.currentTarget.src = modalImageUrls[index] || '';
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="mt-4 text-white/80 text-center text-sm">
                <p>Click outside the image or press ESC to close • Use arrow keys to navigate</p>
                {convertedFiles.length > 1 && (
                  <p className="mt-1">Click on thumbnails below to switch images</p>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>HEIC to JPG Converter • Simple, fast, and privacy-focused • Max 10 files</p>
        </footer>
      </div>
    </main>
  );
}
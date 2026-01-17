'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import OptionsPanel from '@/components/OptionsPanel';
import BulkActions from '@/components/BulkActions';
import FileList from '@/components/FileList';
import ImageModal from '@/components/ImageModal';
import ErrorAlert from '@/components/ErrorAlert';
import { ProcessedFile, ConversionOptions, ModalState, UploadStatus } from '@/types';

interface ConversionInterfaceProps {
  files: File[];
  onBack: () => void;
}

export default function ConversionInterface({ files: initialFiles, onBack }: ConversionInterfaceProps) {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    quality: 85,
    keepMetadata: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    show: false,
    currentIndex: 0,
    imageUrls: [],
    imageBlobs: [],
    thumbnailUrls: [],
    imagesLoaded: [],
  });

  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved options from localStorage on mount
  useEffect(() => {
    const savedOptions = localStorage.getItem('heic-conversion-options');
    if (savedOptions) {
      try {
        const parsedOptions = JSON.parse(savedOptions);
        // Validate the parsed options
        if (parsedOptions.quality && parsedOptions.keepMetadata !== undefined) {
          setOptions(parsedOptions);
        }
      } catch (error) {
        console.error('Failed to parse saved options:', error);
        // Use default options if parsing fails
        setOptions({
          quality: 85,
          keepMetadata: false,
        });
      }
    }
  }, []);

  // Save options to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('heic-conversion-options', JSON.stringify(options));
    } catch (error) {
      console.error('Failed to save options to localStorage:', error);
    }
  }, [options]);

  // Initialize files from props
  useEffect(() => {
    const processedFiles: ProcessedFile[] = initialFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      convertedUrl: null,
      convertedBlob: null,
      status: 'idle' as UploadStatus,
      error: null,
      isProcessing: false,
      isImageLoaded: false,
    }));
    
    setFiles(processedFiles);
  }, [initialFiles]);

  // Get all converted files
  const convertedFiles = files.filter(file => file.convertedBlob && file.convertedUrl);
  const hasFiles = files.length > 0;

  // Handle options change
  const handleOptionsChange = (newOptions: ConversionOptions) => {
    setOptions(newOptions);
  };

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.convertedUrl) {
          URL.revokeObjectURL(file.convertedUrl);
        }
      });
      modalState.imageUrls.forEach(url => URL.revokeObjectURL(url));
      modalState.thumbnailUrls.forEach(url => URL.revokeObjectURL(url));
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, [files, modalState.imageUrls, modalState.thumbnailUrls]);

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

  // New function to convert all images
  const convertAllImages = () => {
    files.forEach(file => {
      if (!file.isProcessing && file.status !== 'success') {
        convertImage(file.id);
      }
    });
  };

  const downloadImage = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file?.convertedBlob) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(file.convertedBlob);
    link.download = file.file.name.replace(/\.[^/.]+$/, '') + '.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const downloadAllImages = () => {
    convertedFiles.forEach(file => {
      if (file.convertedBlob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file.convertedBlob);
        link.download = file.file.name.replace(/\.[^/.]+$/, '') + '.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    });
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

  // Define openImageModal to open the modal with the selected image by index
  const openImageModal = (index: number) => {
    const imageFiles = files.filter(f => f.convertedUrl);
    if (index < 0 || index >= imageFiles.length) return;
    setModalState(prev => ({
      ...prev,
      show: true,
      currentIndex: index,
      imageUrls: imageFiles.map(f => f.convertedUrl!),
      imageBlobs: imageFiles.map(f => f.convertedBlob!),
      thumbnailUrls: [], // Add logic if you have thumbnails
      imagesLoaded: imageFiles.map(() => false),
    }));
  };

  const nextImage = () => {
    setModalState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex < prev.imageUrls.length - 1 ? prev.currentIndex + 1 : 0,
    }));
  };

  const prevImage = () => {
    setModalState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.imageUrls.length - 1,
    }));
  };

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      show: false,
    }));
  };

  const downloadCurrentModalImage = () => {
    const currentImageBlob = modalState.imageBlobs[modalState.currentIndex];
    if (currentImageBlob) {
      const currentFile = convertedFiles[modalState.currentIndex];
      const link = document.createElement('a');
      link.href = URL.createObjectURL(currentImageBlob);
      link.download = currentFile.file.name.replace(/\.[^/.]+$/, '') + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <>
      <header className="">
        
      </header>
      <div className='h-20'></div>

      <div className="grid gap-8 justify-center items-center overflow-hidden">
        {/* Left Column - Options */}
        <div className="flex space-y-6 gap-10">
          <FileList
            files={files}
            convertedFiles={convertedFiles}
            onConvert={convertImage}
            onDownload={downloadImage}
            onRemove={removeFile}
            onPreview={openImageModal}
            options={options}
            onOptionsChange={handleOptionsChange}
          />
        </div>
          <div className='h-20'></div>


        <div className="flex flex-col w-100">
          {hasFiles && (
            <BulkActions
              files={files}
              onConvertAll={convertAllImages}
              onDownloadAll={downloadAllImages}
              onRemoveAll={() => {
                // Clear files and go back
                setFiles([]);
                onBack();
              }}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </div>

      <ImageModal
        {...modalState}
        onClose={closeModal}
        onNext={nextImage}
        onPrev={prevImage}
        onDownload={downloadCurrentModalImage}
        totalImages={convertedFiles.length}
        currentImageName={convertedFiles[modalState.currentIndex]?.file.name.replace(/\.[^/.]+$/, '')}
      />

      <ErrorAlert error={error} />
    </>
  );
}
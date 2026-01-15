export type UploadStatus = 'idle' | 'uploading' | 'converting' | 'success' | 'error';

export type ConversionOptions = {
  quality: number;
  keepMetadata: boolean;
};

export type ProcessedFile = {
  id: string;
  file: File;
  convertedUrl: string | null;
  convertedBlob: Blob | null;
  status: UploadStatus;
  error: string | null;
  isProcessing: boolean;
  isImageLoaded: boolean;
};

export type ModalState = {
  show: boolean;
  currentIndex: number;
  imageUrls: string[];
  imageBlobs: Blob[];
  thumbnailUrls: string[];
  imagesLoaded: boolean[];
};
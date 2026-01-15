'use client';

import { FiSettings, FiDownload, FiTrash2 } from 'react-icons/fi';
import { ProcessedFile } from '@/types';

interface BulkActionsProps {
  files: ProcessedFile[];
  onConvertAll: () => void;
  onDownloadAll: () => void;
  onRemoveAll: () => void;
  isProcessing: boolean;
}

export default function BulkActions({ 
  files, 
  onConvertAll, 
  onDownloadAll, 
  onRemoveAll, 
  isProcessing 
}: BulkActionsProps) {
  const canConvertAll = files.some(f => !f.convertedUrl && f.status !== 'error');
  const canDownloadAll = files.some(f => f.convertedBlob && f.status === 'success');
  const filesToConvertCount = files.filter(f => !f.convertedUrl).length;
  const convertedFilesCount = files.filter(f => f.convertedBlob).length;

  return (
    <div className="">
      <div className="">
        {/* Fixed bottom action bar */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-gray-200 p-3 flex items-center gap-3 z-10 w-72">
          {/* Convert All button - Full size with label */}
          <button
            onClick={onConvertAll}
            disabled={isProcessing || !canConvertAll}
            className={`py-3 px-6 rounded-full font-medium text-sm transition-all flex items-center justify-center ${isProcessing || !canConvertAll
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800 active:scale-[0.98]'
              }`}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></span>
                Converting...
              </>
            ) : (
              <>
                Convert All ({filesToConvertCount})
              </>
            )}
          </button>
          
          {/* Download All button - Icon only with black circle */}
          <button
            onClick={onDownloadAll}
            disabled={!canDownloadAll}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${!canDownloadAll
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 active:scale-95'
              }`}
            title={`Download All (${convertedFilesCount} files)`}
          >
            <div className={`absolute inset-0 rounded-full ${!canDownloadAll ? 'bg-gray-300' : 'bg-black'} opacity-10`}></div>
            <FiDownload size={20} />
            {convertedFilesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                {convertedFilesCount}
              </span>
            )}
          </button>
          
          {/* Clear All button - Icon only with black circle */}
          <button
            onClick={onRemoveAll}
            className="relative w-12 h-12 rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
            title="Clear All Files"
          >
            <div className="absolute inset-0 rounded-full bg-black opacity-10"></div>
            <FiTrash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
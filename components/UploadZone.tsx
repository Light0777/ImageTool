'use client';

import { useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload } from 'react-icons/fi';

interface UploadZoneProps {
    onFilesSelect: (files: File[]) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    maxFiles?: number;
    maxSize?: number;
}

export default function UploadZone({
    onFilesSelect,
    fileInputRef,
    maxFiles = 10,
    maxSize = 100 * 1024 * 1024,
}: UploadZoneProps) {
    
    const onDrop = (acceptedFiles: File[]) => {
        onFilesSelect(acceptedFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.heic', '.heif', '.hif']
        },
        multiple: true,
        maxFiles,
        maxSize,
    });

    const handleManualFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length > 0) {
            onFilesSelect(selectedFiles);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            {...getRootProps()}
            className={`rounded-2xl sm:rounded-3xl md:rounded-4xl w-full max-w-md md:w-96 lg:w-110 h-auto min-h-75 sm:h-60 md:h-70 lg:h-85 text-center cursor-pointer transition-all shadow-lg hover:shadow-xl grid justify-center items-center p-4 sm:p-6 md:p-8 mx-auto sm:mx-0`}
        >
            <input {...getInputProps()} ref={fileInputRef} />
            
            {/* Button */}
            <button
                onClick={handleButtonClick}
                className="mt-4 sm:mt-6 px-12 lg:px-15 py-3 sm:py-3.5 md:py-4 bg-black text-white text-base sm:text-lg md:text-xl rounded-full cursor-pointer hover:bg-gray-800 transition-colors font-medium flex items-center justify-center mx-auto">
                <FiUpload className="mr-2 text-lg sm:text-xl" />
                Select Files
            </button>
            
            {/* Info Text */}
            <div className="text-gray-500 mt-4 sm:mt-6 md:mt-8 text-sm sm:text-base">
                <p className="text-gray-600 font-bold text-lg sm:text-xl mb-1">
                    or drop a file
                </p>
                <p className='font-medium'>
                    Max {maxFiles} files • Max {(maxSize / 1024 / 1024).toFixed(0)}MB each
                </p>
                
                {/* Mobile-only extra info */}
                <div className="mt-2 text-xs sm:text-sm text-gray-400 block sm:hidden">
                    <p>Supports: .heic, .heif, .hif formats</p>
                </div>
            </div>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleManualFileSelect}
                className="hidden"
                accept=".heic,.heif,.hif"
                multiple
            />
        </div>
    );
}
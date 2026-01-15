'use client';

import { FiSettings } from 'react-icons/fi';
import { ConversionOptions } from '@/types';

interface OptionsPanelProps {
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
  disabled?: boolean;
}

export default function OptionsPanel({ options, onOptionsChange, disabled = false }: OptionsPanelProps) {
  const handleQualityChange = (quality: number) => {
    onOptionsChange({ ...options, quality });
  };

  const handleMetadataToggle = () => {
    onOptionsChange({ ...options, keepMetadata: !options.keepMetadata });
  };

  const getQualityLabel = (quality: number) => {
    if (quality === 100) return 'Best';
    if (quality >= 90) return 'High';
    if (quality >= 80) return 'Good';
    if (quality >= 70) return 'Medium';
    return 'Low';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <FiSettings className="mr-2" /> Conversion Options
      </h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Image Quality: {options.quality}%</label>
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
              {getQualityLabel(options.quality)}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={options.quality}
            onChange={(e) => handleQualityChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            disabled={disabled}
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
            onClick={handleMetadataToggle}
            disabled={disabled}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${options.keepMetadata ? 'bg-black' : 'bg-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all ${options.keepMetadata ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
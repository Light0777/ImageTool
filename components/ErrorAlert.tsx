'use client';

interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
}

export default function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">⚠️</span>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
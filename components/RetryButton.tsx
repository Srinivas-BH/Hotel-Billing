'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  label?: string;
  className?: string;
}

/**
 * Retry button component for failed operations
 * Requirements: 14.4
 */
export function RetryButton({
  onRetry,
  label = 'Retry',
  className = '',
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={isRetrying}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        bg-blue-600 text-white rounded-md
        hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
        transition-colors
        ${className}
      `}
    >
      <RefreshCw
        className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
      />
      {isRetrying ? 'Retrying...' : label}
    </button>
  );
}

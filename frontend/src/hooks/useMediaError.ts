import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

interface MediaError extends Error {
  code?: number;
  MEDIA_ERR_ABORTED?: number;
  MEDIA_ERR_NETWORK?: number;
  MEDIA_ERR_DECODE?: number;
  MEDIA_ERR_SRC_NOT_SUPPORTED?: number;
  details?: any;
  mediaElement?: HTMLMediaElement;
}

interface UseMediaErrorOptions {
  context: string;
  onError?: (error: MediaError) => void;
  onAborted?: (error: MediaError) => void;
  onNetworkError?: (error: MediaError) => void;
  onDecodeError?: (error: MediaError) => void;
  onUnsupportedFormat?: (error: MediaError) => void;
}

/**
 * Custom hook for handling media errors consistently across the application
 */
export function useMediaError({
  context,
  onError,
  onAborted,
  onNetworkError,
  onDecodeError,
  onUnsupportedFormat,
}: UseMediaErrorOptions) {
  const handleError = useCallback(
    (error: MediaError) => {
      // Create a standardized error object
      const mediaError: MediaError = {
        name: error.name || 'MediaError',
        message: error.message || 'A media error occurred',
        code: error.code,
        MEDIA_ERR_ABORTED: error.MEDIA_ERR_ABORTED,
        MEDIA_ERR_NETWORK: error.MEDIA_ERR_NETWORK,
        MEDIA_ERR_DECODE: error.MEDIA_ERR_DECODE,
        MEDIA_ERR_SRC_NOT_SUPPORTED: error.MEDIA_ERR_SRC_NOT_SUPPORTED,
        details: error.details,
        mediaElement: error.mediaElement,
      };

      // Log the error using our error service
      errorService.handleError(mediaError, context, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific media error cases
      if (mediaError.code === mediaError.MEDIA_ERR_ABORTED) {
        // Handle aborted media loading
        if (onAborted) {
          onAborted(mediaError);
        }
        return;
      }

      if (mediaError.code === mediaError.MEDIA_ERR_NETWORK) {
        // Handle network errors
        if (onNetworkError) {
          onNetworkError(mediaError);
        }
        return;
      }

      if (mediaError.code === mediaError.MEDIA_ERR_DECODE) {
        // Handle decode errors
        if (onDecodeError) {
          onDecodeError(mediaError);
        }
        return;
      }

      if (mediaError.code === mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        // Handle unsupported format errors
        if (onUnsupportedFormat) {
          onUnsupportedFormat(mediaError);
        }
        return;
      }

      // Handle specific error codes
      switch (mediaError.code) {
        case 1: // MEDIA_ERR_ABORTED
          // Handle aborted
          break;
        case 2: // MEDIA_ERR_NETWORK
          // Handle network error
          break;
        case 3: // MEDIA_ERR_DECODE
          // Handle decode error
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          // Handle unsupported format
          break;
        default:
          // Handle unknown error codes
          break;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(mediaError);
      }
    },
    [context, onError, onAborted, onNetworkError, onDecodeError, onUnsupportedFormat]
  );

  const isMediaError = useCallback((error: any): boolean => {
    return (
      error.name === 'MediaError' ||
      error.code?.toString().startsWith('MEDIA_') ||
      error.message?.toLowerCase().includes('media') ||
      error.message?.toLowerCase().includes('video') ||
      error.message?.toLowerCase().includes('audio')
    );
  }, []);

  const isAbortedError = useCallback((error: any): boolean => {
    return (
      error.code === 1 ||
      error.code === error.MEDIA_ERR_ABORTED ||
      error.message?.toLowerCase().includes('aborted')
    );
  }, []);

  const isNetworkError = useCallback((error: any): boolean => {
    return (
      error.code === 2 ||
      error.code === error.MEDIA_ERR_NETWORK ||
      error.message?.toLowerCase().includes('network')
    );
  }, []);

  const isDecodeError = useCallback((error: any): boolean => {
    return (
      error.code === 3 ||
      error.code === error.MEDIA_ERR_DECODE ||
      error.message?.toLowerCase().includes('decode')
    );
  }, []);

  const isUnsupportedFormatError = useCallback((error: any): boolean => {
    return (
      error.code === 4 ||
      error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED ||
      error.message?.toLowerCase().includes('unsupported') ||
      error.message?.toLowerCase().includes('format')
    );
  }, []);

  const getErrorMessage = useCallback((error: MediaError): string => {
    switch (error.code) {
      case 1:
        return 'Media loading was aborted.';
      case 2:
        return 'A network error occurred while loading the media.';
      case 3:
        return 'The media could not be decoded. The format may be unsupported.';
      case 4:
        return 'The media format is not supported by your browser.';
      default:
        return error.message || 'A media error occurred';
    }
  }, []);

  const getSupportedFormats = useCallback((): string[] => {
    const formats: string[] = [];
    const video = document.createElement('video');
    const audio = document.createElement('audio');

    // Check video formats
    if (video.canPlayType('video/mp4')) formats.push('MP4');
    if (video.canPlayType('video/webm')) formats.push('WebM');
    if (video.canPlayType('video/ogg')) formats.push('OGG');

    // Check audio formats
    if (audio.canPlayType('audio/mpeg')) formats.push('MP3');
    if (audio.canPlayType('audio/ogg')) formats.push('OGG');
    if (audio.canPlayType('audio/wav')) formats.push('WAV');

    return formats;
  }, []);

  return {
    handleError,
    isMediaError,
    isAbortedError,
    isNetworkError,
    isDecodeError,
    isUnsupportedFormatError,
    getErrorMessage,
    getSupportedFormats,
  };
} 
import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

/**
 * Custom hook for handling file upload errors consistently across the application
 */
export function useFileUploadError({
  context,
  onError,
  onSizeError,
  onTypeError,
  onNetworkError,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], // Default image types
}) {
  const handleError = useCallback(
    (error) => {
      // Create a standardized error object
      const uploadError = {
        name: error.name || 'FileUploadError',
        message: error.message || 'A file upload error occurred',
        code: error.code,
        file: error.file,
        size: error.size,
        type: error.type,
        details: error.details,
      };

      // Log the error using our error service
      errorService.handleError(uploadError, context, {
        timestamp: new Date().toISOString(),
        maxFileSize,
        allowedTypes,
      });

      // Handle specific file upload error cases
      if (uploadError.code === 'FILE_TOO_LARGE' && uploadError.file) {
        // Handle file size errors
        if (onSizeError) {
          onSizeError(uploadError.file);
        }
        return;
      }

      if (uploadError.code === 'INVALID_FILE_TYPE' && uploadError.file) {
        // Handle file type errors
        if (onTypeError) {
          onTypeError(uploadError.file);
        }
        return;
      }

      if (uploadError.code === 'NETWORK_ERROR' && uploadError.file) {
        // Handle network errors
        if (onNetworkError) {
          onNetworkError(uploadError.file);
        }
        return;
      }

      // Handle specific error codes
      switch (uploadError.code) {
        case 'UPLOAD_CANCELLED':
          // Handle upload cancellation
          break;
        case 'UPLOAD_TIMEOUT':
          // Handle upload timeout
          break;
        case 'UPLOAD_FAILED':
          // Handle general upload failure
          break;
        case 'FILE_CORRUPTED':
          // Handle corrupted file
          break;
        case 'VIRUS_DETECTED':
          // Handle virus detection
          break;
        case 'QUOTA_EXCEEDED':
          // Handle storage quota exceeded
          break;
        default:
          // Handle unknown error codes
          break;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(uploadError);
      }
    },
    [context, onError, onSizeError, onTypeError, onNetworkError, maxFileSize, allowedTypes]
  );

  const validateFile = useCallback(
    (file) => {
      // Check file size
      if (file.size > maxFileSize) {
        return {
          name: 'FileUploadError',
          message: `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`,
          code: 'FILE_TOO_LARGE',
          file,
          size: file.size,
          type: file.type,
        };
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        return {
          name: 'FileUploadError',
          message: `File type ${file.type} is not allowed`,
          code: 'INVALID_FILE_TYPE',
          file,
          size: file.size,
          type: file.type,
        };
      }

      return null;
    },
    [maxFileSize, allowedTypes]
  );

  const isFileSizeError = useCallback((error) => {
    return (
      error.code === 'FILE_TOO_LARGE' ||
      error.message?.toLowerCase().includes('size') ||
      error.message?.toLowerCase().includes('large')
    );
  }, []);

  const isFileTypeError = useCallback((error) => {
    return (
      error.code === 'INVALID_FILE_TYPE' ||
      error.message?.toLowerCase().includes('type') ||
      error.message?.toLowerCase().includes('format')
    );
  }, []);

  const isUploadError = useCallback((error) => {
    return (
      error.name === 'FileUploadError' ||
      error.code?.startsWith('UPLOAD_') ||
      error.message?.toLowerCase().includes('upload')
    );
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    handleError,
    validateFile,
    isFileSizeError,
    isFileTypeError,
    isUploadError,
    formatFileSize,
  };
} 
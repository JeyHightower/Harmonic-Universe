import { useCallback } from 'react';
import errorService from '../services/error.service.mjs';

/**
 * Custom hook for handling IndexedDB errors consistently across the application
 */
export function useIndexedDBError({
  context,
  onError,
  onDatabaseError,
  onTransactionError,
  onStorageError,
}) {
  const handleError = useCallback(
    (error) => {
      // Create a standardized error object
      const idbError = {
        name: error.name || 'IndexedDBError',
        message: error.message || 'An IndexedDB error occurred',
        code: error.code,
        type: error.type,
        details: error.details,
        database: error.database,
        store: error.store,
        operation: error.operation,
      };

      // Log the error using our error service
      errorService.handleError(idbError, context, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific IndexedDB error cases
      if (idbError.type === 'database') {
        // Handle database errors
        if (onDatabaseError) {
          onDatabaseError(idbError);
        }
        return;
      }

      if (idbError.type === 'transaction') {
        // Handle transaction errors
        if (onTransactionError) {
          onTransactionError(idbError);
        }
        return;
      }

      if (idbError.type === 'storage') {
        // Handle storage errors
        if (onStorageError) {
          onStorageError(idbError);
        }
        return;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(idbError);
      }
    },
    [context, onError, onDatabaseError, onTransactionError, onStorageError]
  );

  const isIndexedDBError = useCallback((error) => {
    return (
      error.name === 'IndexedDBError' ||
      error.type === 'database' ||
      error.type === 'transaction' ||
      error.type === 'storage' ||
      error.message?.toLowerCase().includes('indexeddb')
    );
  }, []);

  const isDatabaseError = useCallback((error) => {
    return error.type === 'database' || error.message?.toLowerCase().includes('database');
  }, []);

  const isTransactionError = useCallback((error) => {
    return error.type === 'transaction' || error.message?.toLowerCase().includes('transaction');
  }, []);

  const isStorageError = useCallback((error) => {
    return error.type === 'storage' || error.message?.toLowerCase().includes('storage');
  }, []);

  const getErrorMessage = useCallback((error) => {
    switch (error.code) {
      case 1:
        return 'Database not found.';
      case 2:
        return 'Database version mismatch.';
      case 3:
        return 'Database is blocked.';
      case 4:
        return 'Database is blocked.';
      case 5:
        return 'Database is blocked.';
      case 6:
        return 'Database is blocked.';
      case 7:
        return 'Database is blocked.';
      case 8:
        return 'Database is blocked.';
      case 9:
        return 'Database is blocked.';
      case 10:
        return 'Database is blocked.';
      case 11:
        return 'Database is blocked.';
      case 12:
        return 'Database is blocked.';
      default:
        return error.message || 'An error occurred with the IndexedDB operation.';
    }
  }, []);

  const getStorageQuota = useCallback(async () => {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();
        return {
          usage,
          quota,
          percentage: quota ? (usage / quota) * 100 : 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting storage quota:', error);
      return null;
    }
  }, []);

  return {
    handleError,
    isIndexedDBError,
    isDatabaseError,
    isTransactionError,
    isStorageError,
    getErrorMessage,
    getStorageQuota,
  };
}

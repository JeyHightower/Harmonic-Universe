import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

interface IndexedDBError extends Error {
  code?: number;
  type?: string;
  details?: any;
  database?: string;
  store?: string;
  operation?: string;
}

interface UseIndexedDBErrorOptions {
  context: string;
  onError?: (error: IndexedDBError) => void;
  onDatabaseError?: (error: IndexedDBError) => void;
  onTransactionError?: (error: IndexedDBError) => void;
  onStorageError?: (error: IndexedDBError) => void;
}

/**
 * Custom hook for handling IndexedDB errors consistently across the application
 */
export function useIndexedDBError({
  context,
  onError,
  onDatabaseError,
  onTransactionError,
  onStorageError,
}: UseIndexedDBErrorOptions) {
  const handleError = useCallback(
    (error: IndexedDBError) => {
      // Create a standardized error object
      const dbError: IndexedDBError = {
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
      errorService.handleError(dbError, context, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific IndexedDB error cases
      if (dbError.type === 'database') {
        // Handle database errors
        if (onDatabaseError) {
          onDatabaseError(dbError);
        }
        return;
      }

      if (dbError.type === 'transaction') {
        // Handle transaction errors
        if (onTransactionError) {
          onTransactionError(dbError);
        }
        return;
      }

      if (dbError.type === 'storage') {
        // Handle storage errors
        if (onStorageError) {
          onStorageError(dbError);
        }
        return;
      }

      // Handle specific error codes
      switch (dbError.code) {
        case 1: // Unknown error
          // Handle unknown error
          break;
        case 2: // Database not found
          // Handle database not found
          break;
        case 3: // Version mismatch
          // Handle version mismatch
          break;
        case 4: // Quota exceeded
          // Handle quota exceeded
          break;
        case 5: // Invalid state
          // Handle invalid state
          break;
        case 6: // Constraint error
          // Handle constraint error
          break;
        case 7: // Data error
          // Handle data error
          break;
        case 8: // Transaction inactive
          // Handle transaction inactive
          break;
        case 9: // Read only
          // Handle read only
          break;
        case 10: // Version change
          // Handle version change
          break;
        case 11: // Abort error
          // Handle abort error
          break;
        case 12: // Timeout error
          // Handle timeout error
          break;
        default:
          // Handle unknown error codes
          break;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(dbError);
      }
    },
    [context, onError, onDatabaseError, onTransactionError, onStorageError]
  );

  const isIndexedDBError = useCallback((error: any): boolean => {
    return (
      error.name === 'IndexedDBError' ||
      error.code?.toString().startsWith('IDB_') ||
      error.message?.toLowerCase().includes('indexeddb') ||
      error.message?.toLowerCase().includes('database')
    );
  }, []);

  const isDatabaseError = useCallback((error: any): boolean => {
    return (
      error.type === 'database' ||
      error.message?.toLowerCase().includes('database') ||
      error.message?.toLowerCase().includes('db')
    );
  }, []);

  const isTransactionError = useCallback((error: any): boolean => {
    return (
      error.type === 'transaction' ||
      error.message?.toLowerCase().includes('transaction') ||
      error.message?.toLowerCase().includes('tx')
    );
  }, []);

  const isStorageError = useCallback((error: any): boolean => {
    return (
      error.type === 'storage' ||
      error.message?.toLowerCase().includes('storage') ||
      error.message?.toLowerCase().includes('quota')
    );
  }, []);

  const getErrorMessage = useCallback((error: IndexedDBError): string => {
    switch (error.code) {
      case 1:
        return 'An unknown IndexedDB error occurred.';
      case 2:
        return 'The database was not found.';
      case 3:
        return 'The database version does not match.';
      case 4:
        return 'The storage quota has been exceeded.';
      case 5:
        return 'The database is in an invalid state.';
      case 6:
        return 'A constraint error occurred.';
      case 7:
        return 'A data error occurred.';
      case 8:
        return 'The transaction is inactive.';
      case 9:
        return 'The operation is read-only.';
      case 10:
        return 'A version change is in progress.';
      case 11:
        return 'The operation was aborted.';
      case 12:
        return 'The operation timed out.';
      default:
        return error.message || 'An IndexedDB error occurred';
    }
  }, []);

  const getStorageQuota = useCallback(async (): Promise<{
    usage: number;
    quota: number;
  }> => {
    if (!navigator.storage || !navigator.storage.estimate) {
      throw new Error('Storage API not supported');
    }

    try {
      const { usage, quota } = await navigator.storage.estimate();
      return {
        usage: usage || 0,
        quota: quota || 0,
      };
    } catch (error) {
      throw new Error('Failed to get storage quota');
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
import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

/**
 * Custom hook for handling payment errors consistently across the application
 */
export function usePaymentError({
  context,
  onError,
  onDeclined,
  onInsufficientFunds,
  onInvalidCard,
  onProcessingError,
}) {
  const handleError = useCallback(
    (error) => {
      // Create a standardized error object
      const paymentError = {
        name: error.name || 'PaymentError',
        message: error.message || 'A payment error occurred',
        code: error.code,
        status: error.status,
        details: error.details,
        transactionId: error.transactionId,
        amount: error.amount,
        currency: error.currency,
      };

      // Log the error using our error service
      errorService.handleError(paymentError, context, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific payment error cases
      if (paymentError.code === 'PAYMENT_DECLINED') {
        // Handle declined payments
        if (onDeclined) {
          onDeclined(paymentError);
        }
        return;
      }

      if (paymentError.code === 'INSUFFICIENT_FUNDS') {
        // Handle insufficient funds
        if (onInsufficientFunds) {
          onInsufficientFunds(paymentError);
        }
        return;
      }

      if (paymentError.code === 'INVALID_CARD') {
        // Handle invalid card errors
        if (onInvalidCard) {
          onInvalidCard(paymentError);
        }
        return;
      }

      if (paymentError.code === 'PROCESSING_ERROR') {
        // Handle processing errors
        if (onProcessingError) {
          onProcessingError(paymentError);
        }
        return;
      }

      // Handle specific error codes
      switch (paymentError.code) {
        case 'CARD_EXPIRED':
          // Handle expired card
          break;
        case 'CARD_DECLINED':
          // Handle card declined
          break;
        case 'INVALID_AMOUNT':
          // Handle invalid amount
          break;
        case 'CURRENCY_NOT_SUPPORTED':
          // Handle unsupported currency
          break;
        case 'TRANSACTION_FAILED':
          // Handle failed transaction
          break;
        case 'DUPLICATE_TRANSACTION':
          // Handle duplicate transaction
          break;
        case 'FRAUD_DETECTED':
          // Handle fraud detection
          break;
        case 'PAYMENT_METHOD_NOT_SUPPORTED':
          // Handle unsupported payment method
          break;
        case 'PAYMENT_CANCELLED':
          // Handle payment cancellation
          break;
        case 'REFUND_FAILED':
          // Handle refund failure
          break;
        default:
          // Handle unknown error codes
          break;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(paymentError);
      }
    },
    [context, onError, onDeclined, onInsufficientFunds, onInvalidCard, onProcessingError]
  );

  const isPaymentError = useCallback((error) => {
    return (
      error.name === 'PaymentError' ||
      error.code?.startsWith('PAYMENT_') ||
      error.message?.toLowerCase().includes('payment') ||
      error.message?.toLowerCase().includes('transaction')
    );
  }, []);

  const isCardError = useCallback((error) => {
    return (
      error.code === 'INVALID_CARD' ||
      error.code === 'CARD_EXPIRED' ||
      error.code === 'CARD_DECLINED' ||
      error.message?.toLowerCase().includes('card')
    );
  }, []);

  const isTransactionError = useCallback((error) => {
    return (
      error.code === 'TRANSACTION_FAILED' ||
      error.code === 'DUPLICATE_TRANSACTION' ||
      error.message?.toLowerCase().includes('transaction')
    );
  }, []);

  const isRefundError = useCallback((error) => {
    return (
      error.code === 'REFUND_FAILED' ||
      error.message?.toLowerCase().includes('refund')
    );
  }, []);

  const formatAmount = useCallback(
    (amount, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    },
    []
  );

  return {
    handleError,
    isPaymentError,
    isCardError,
    isTransactionError,
    isRefundError,
    formatAmount,
  };
} 
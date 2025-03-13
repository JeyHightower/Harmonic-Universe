/**
 * React-is compatibility shim
 *
 * This shim provides ForwardRef and other exports that might be missing
 * in different versions of react-is
 */

// Import all available exports from the installed version
import * as ReactIs from 'react-is';

// Define exports that might be missing in some versions
export const ForwardRef = ReactIs.ForwardRef || { $$typeof: Symbol.for('react.forward_ref') };
export const Memo = ReactIs.Memo || { $$typeof: Symbol.for('react.memo') };
export const isForwardRef = ReactIs.isForwardRef || (obj => obj?.$$typeof === ForwardRef.$$typeof);
export const isMemo = ReactIs.isMemo || (obj => obj?.$$typeof === Memo.$$typeof);

// Re-export everything from react-is
export * from 'react-is';

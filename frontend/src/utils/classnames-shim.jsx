// This is a shim for the classnames package to handle both named and default exports
import classNamesOriginal from 'classnames';

// Re-export as both named and default export to support different import styles
export default classNamesOriginal;
export const classNames = classNamesOriginal;

import PropTypes from 'prop-types';

export const AlertMessagePropTypes = {
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']).isRequired,
  message: PropTypes.string.isRequired,
};

export const ConfirmDialogPropTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string.isRequired,
  cancelLabel: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

export const LoadingStatePropTypes = {
  isLoading: PropTypes.bool.isRequired,
  message: PropTypes.string,
};

export const ThemeConfigPropTypes = {
  mode: PropTypes.oneOf(['light', 'dark']).isRequired,
  primary: PropTypes.shape({
    main: PropTypes.string.isRequired,
    light: PropTypes.string.isRequired,
    dark: PropTypes.string.isRequired,
    contrastText: PropTypes.string.isRequired,
  }).isRequired,
  secondary: PropTypes.shape({
    main: PropTypes.string.isRequired,
    light: PropTypes.string.isRequired,
    dark: PropTypes.string.isRequired,
    contrastText: PropTypes.string.isRequired,
  }).isRequired,
  background: PropTypes.shape({
    default: PropTypes.string.isRequired,
    paper: PropTypes.string.isRequired,
    alternate: PropTypes.string.isRequired,
  }).isRequired,
  text: PropTypes.shape({
    primary: PropTypes.string.isRequired,
    secondary: PropTypes.string.isRequired,
    disabled: PropTypes.string.isRequired,
  }).isRequired,
  divider: PropTypes.string.isRequired,
  error: PropTypes.shape({
    main: PropTypes.string.isRequired,
    light: PropTypes.string.isRequired,
    dark: PropTypes.string.isRequired,
    contrastText: PropTypes.string.isRequired,
  }).isRequired,
  warning: PropTypes.shape({
    main: PropTypes.string.isRequired,
    light: PropTypes.string.isRequired,
    dark: PropTypes.string.isRequired,
    contrastText: PropTypes.string.isRequired,
  }).isRequired,
  info: PropTypes.shape({
    main: PropTypes.string.isRequired,
    light: PropTypes.string.isRequired,
    dark: PropTypes.string.isRequired,
    contrastText: PropTypes.string.isRequired,
  }).isRequired,
  success: PropTypes.shape({
    main: PropTypes.string.isRequired,
    light: PropTypes.string.isRequired,
    dark: PropTypes.string.isRequired,
    contrastText: PropTypes.string.isRequired,
  }).isRequired,
};

export const UIStatePropTypes = {
  theme: PropTypes.oneOf(['light', 'dark']).isRequired,
  sidebarOpen: PropTypes.bool.isRequired,
  alert: PropTypes.shape(AlertMessagePropTypes),
  confirmDialog: PropTypes.shape(ConfirmDialogPropTypes).isRequired,
  isLoading: PropTypes.bool.isRequired,
  loadingMessage: PropTypes.string.isRequired,
};

export interface AlertMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primary: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  background: {
    default: string;
    paper: string;
    alternate: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  divider: string;
  error: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  warning: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  info: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  success: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  alert: AlertMessage | null;
  confirmDialog: ConfirmDialog;
  isLoading: boolean;
  loadingMessage: string;
}

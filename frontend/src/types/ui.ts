export interface AlertMessage {
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

export interface ConfirmDialog {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface UIState {
  alert: AlertMessage | null;
  confirmDialog: ConfirmDialog | null;
  isLoading: boolean;
  theme: 'light' | 'dark';
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
  };
}


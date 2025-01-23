/**
 * @vitest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import universeReducer, {
  exportUniverse,
  importUniverse,
  resetExportStatus,
  resetImportStatus,
} from '../../../store/slices/universeSlice';

// Mock the universe actions
vi.mock('../../../store/slices/universeSlice', () => ({
  exportUniverse: vi.fn(() => ({
    type: 'universe/exportUniverse',
    payload: undefined,
  })),
  importUniverse: vi.fn(() => ({
    type: 'universe/importUniverse',
    payload: undefined,
  })),
  resetExportStatus: vi.fn(() => ({
    type: 'universe/resetExportStatus',
    payload: undefined,
  })),
  resetImportStatus: vi.fn(() => ({
    type: 'universe/resetImportStatus',
    payload: undefined,
  })),
  __esModule: true,
  default: (state = { exportStatus: null, importStatus: null }) => state,
}));

// Mock CSS modules
vi.mock('../Universe.module.css', () => ({
  default: {
    exportSection: 'exportSection',
    button: 'button',
    success: 'success',
    error: 'error',
  },
}));

describe('UniverseExport Component', () => {
  const mockUniverse = {
    id: 1,
    name: 'Test Universe',
    description: 'Test Description',
  };

  const renderWithProviders = (
    ui,
    {
      preloadedState = {
        universe: {
          currentUniverse: mockUniverse,
          exportStatus: null,
          importStatus: null,
          error: null,
        },
      },
      store = configureStore({
        reducer: {
          universe: universeReducer,
        },
        preloadedState,
      }),
      ...renderOptions
    } = {}
  ) => {
    const Wrapper = ({ children }) => (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
  };

  it('renders export and import buttons', () => {
    renderWithProviders(<UniverseExport universeId="1" />);

    expect(screen.getByText('Export Universe')).toBeInTheDocument();
    expect(screen.getByText('Import Universe')).toBeInTheDocument();
  });

  it('handles successful export', async () => {
    const user = userEvent.setup();
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(<UniverseExport universeId="1" />);
    store.dispatch = mockDispatch;

    await user.click(screen.getByText('Export Universe'));

    await waitFor(() => {
      expect(exportUniverse).toHaveBeenCalledWith('1');
    });
  });

  it('handles successful import', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test universe data'], 'universe.json', {
      type: 'application/json',
    });
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(<UniverseExport universeId="1" />);
    store.dispatch = mockDispatch;

    const input = screen.getByLabelText('Import Universe');
    await user.upload(input, mockFile);

    await waitFor(() => {
      expect(importUniverse).toHaveBeenCalled();
    });
  });

  it('displays export success message', () => {
    renderWithProviders(<UniverseExport universeId="1" />, {
      preloadedState: {
        universe: {
          currentUniverse: mockUniverse,
          exportStatus: 'success',
          importStatus: null,
          error: null,
        },
      },
    });

    expect(screen.getByText('Export successful!')).toBeInTheDocument();
  });

  it('displays export error message', () => {
    renderWithProviders(<UniverseExport universeId="1" />, {
      preloadedState: {
        universe: {
          currentUniverse: mockUniverse,
          exportStatus: 'error',
          importStatus: null,
          error: 'Export failed',
        },
      },
    });

    expect(screen.getByText('Export failed')).toBeInTheDocument();
  });

  it('displays import success message', () => {
    renderWithProviders(<UniverseExport universeId="1" />, {
      preloadedState: {
        universe: {
          currentUniverse: mockUniverse,
          exportStatus: null,
          importStatus: 'success',
          error: null,
        },
      },
    });

    expect(screen.getByText('Import successful!')).toBeInTheDocument();
  });

  it('displays import error message', () => {
    renderWithProviders(<UniverseExport universeId="1" />, {
      preloadedState: {
        universe: {
          currentUniverse: mockUniverse,
          exportStatus: null,
          importStatus: 'error',
          error: 'Import failed',
        },
      },
    });

    expect(screen.getByText('Import failed')).toBeInTheDocument();
  });

  it('resets status messages on unmount', () => {
    const { unmount } = renderWithProviders(<UniverseExport universeId="1" />);
    unmount();

    expect(resetExportStatus).toHaveBeenCalled();
    expect(resetImportStatus).toHaveBeenCalled();
  });

  it('validates file type on import', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['invalid data'], 'invalid.txt', {
      type: 'text/plain',
    });

    renderWithProviders(<UniverseExport universeId="1" />);

    const input = screen.getByLabelText('Import Universe');
    await user.upload(input, mockFile);

    expect(screen.getByText('Please select a JSON file')).toBeInTheDocument();
  });
});

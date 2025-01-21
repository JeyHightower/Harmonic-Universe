import { act, renderHook } from '@testing-library/react';
import React from 'react';
import {
  NotificationProvider,
  useNotification,
} from '../../contexts/NotificationContext';

describe('NotificationContext', () => {
  const wrapper = ({ children }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it('provides notification context', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.notifications).toEqual([]);
  });

  it('adds a notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.addNotification({
        message: 'Test notification',
        type: 'info',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Test notification',
      type: 'info',
    });
  });

  it('removes a notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    let notificationId;
    act(() => {
      notificationId = result.current.addNotification({
        message: 'Test notification',
        type: 'info',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.addNotification({ message: 'Test 1', type: 'info' });
      result.current.addNotification({ message: 'Test 2', type: 'error' });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('shows different types of notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.showError('Error message');
      result.current.showWarning('Warning message');
      result.current.showSuccess('Success message');
      result.current.showInfo('Info message');
    });

    const notifications = result.current.notifications;
    expect(notifications).toHaveLength(4);
    expect(notifications[0].type).toBe('error');
    expect(notifications[1].type).toBe('warning');
    expect(notifications[2].type).toBe('success');
    expect(notifications[3].type).toBe('info');
  });

  it('automatically removes notifications after duration', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.addNotification({
        message: 'Test notification',
        type: 'info',
        duration: 1000,
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.notifications).toHaveLength(0);
    jest.useRealTimers();
  });

  it('handles notifications with no duration', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.addNotification({
        message: 'Persistent notification',
        type: 'info',
        duration: null,
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    jest.advanceTimersByTime(10000);
    expect(result.current.notifications).toHaveLength(1);
  });
});

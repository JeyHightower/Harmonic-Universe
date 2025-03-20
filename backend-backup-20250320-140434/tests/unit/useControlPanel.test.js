import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useControlPanel from "../useControlPanel";

describe("useControlPanel", () => {
  const defaultValues = {
    value1: 10,
    value2: "test",
  };

  const initialValues = {
    value1: 20,
  };

  const onChange = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    onChange.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with merged default and initial values", () => {
    const { result } = renderHook(() =>
      useControlPanel(initialValues, defaultValues, onChange),
    );

    expect(result.current.parameters).toEqual({
      value1: 20,
      value2: "test",
    });
  });

  it("should update parameters when calling updateParameter", () => {
    const { result } = renderHook(() =>
      useControlPanel(initialValues, defaultValues, onChange),
    );

    act(() => {
      result.current.updateParameter("value1", 30);
    });

    expect(result.current.parameters.value1).toBe(30);
  });

  it("should call onChange with debounce when parameters change", () => {
    const { result } = renderHook(() =>
      useControlPanel(initialValues, defaultValues, onChange),
    );

    act(() => {
      result.current.updateParameter("value1", 30);
    });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onChange).toHaveBeenCalledWith({
      value1: 30,
      value2: "test",
    });
  });

  it("should reset parameters to initial values", () => {
    const { result } = renderHook(() =>
      useControlPanel(initialValues, defaultValues, onChange),
    );

    act(() => {
      result.current.updateParameter("value1", 30);
      result.current.updateParameter("value2", "changed");
    });

    act(() => {
      result.current.resetParameters();
    });

    expect(result.current.parameters).toEqual({
      value1: 20,
      value2: "test",
    });
  });

  it("should validate parameter values within bounds", () => {
    const { result } = renderHook(() =>
      useControlPanel(initialValues, defaultValues, onChange),
    );

    const bounds = { min: 0, max: 100 };

    expect(result.current.validateParameter("value1", -10, bounds)).toBe(0);
    expect(result.current.validateParameter("value1", 50, bounds)).toBe(50);
    expect(result.current.validateParameter("value1", 150, bounds)).toBe(100);
  });

  it("should cleanup debounced onChange on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useControlPanel(initialValues, defaultValues, onChange),
    );

    act(() => {
      result.current.updateParameter("value1", 30);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});

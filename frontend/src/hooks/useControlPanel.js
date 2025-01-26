import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";

const useControlPanel = (
  initialValues,
  defaultValues,
  onChange,
  debounceMs = 100,
) => {
  // Initialize state with provided values or defaults
  const [parameters, setParameters] = useState(() => ({
    ...defaultValues,
    ...initialValues,
  }));

  // Create debounced onChange handler
  const debouncedOnChange = useCallback(
    debounce((newValues) => {
      onChange?.(newValues);
    }, debounceMs),
    [onChange, debounceMs],
  );

  // Notify parent of changes
  useEffect(() => {
    debouncedOnChange(parameters);
    // Cleanup debounced function
    return () => debouncedOnChange.cancel();
  }, [parameters, debouncedOnChange]);

  // Handle parameter updates
  const updateParameter = useCallback((parameter, value) => {
    setParameters((prev) => ({
      ...prev,
      [parameter]: value,
    }));
  }, []);

  // Reset parameters to initial values
  const resetParameters = useCallback(() => {
    setParameters({
      ...defaultValues,
      ...initialValues,
    });
  }, [defaultValues, initialValues]);

  // Validate parameter value is within bounds
  const validateParameter = useCallback((parameter, value, bounds) => {
    if (bounds.min !== undefined && value < bounds.min) return bounds.min;
    if (bounds.max !== undefined && value > bounds.max) return bounds.max;
    return value;
  }, []);

  return {
    parameters,
    updateParameter,
    resetParameters,
    validateParameter,
  };
};

export default useControlPanel;

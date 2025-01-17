import { useState, useCallback } from 'react';
import { validateForm } from '../utils/validations';

const useForm = (initialValues, validations) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    const fieldValidations = { [name]: validations[name] };
    const fieldErrors = validateForm({ [name]: values[name] }, fieldValidations);
    setErrors(prev => ({ ...prev, ...fieldErrors }));
  }, [values, validations]);

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    const formErrors = validateForm(values, validations);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      try {
        await onSubmit(values);
      } catch (error) {
        setErrors({ submit: error.message });
      }
    }
    setIsSubmitting(false);
  }, [values, validations]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors
  };
};

export default useForm;

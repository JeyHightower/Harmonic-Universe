import { useCallback, useState } from 'react';

const useForm = (initialValues = {}, validationSchema = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback(
    e => {
      const { name, value } = e.target;
      setValues(prev => ({ ...prev, [name]: value }));

      if (touched[name] && validationSchema[name]) {
        const error = validationSchema[name](value);
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    },
    [validationSchema, touched]
  );

  const handleBlur = useCallback(
    e => {
      const { name } = e.target;
      setTouched(prev => ({ ...prev, [name]: true }));

      if (validationSchema[name]) {
        const error = validationSchema[name](values[name]);
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    },
    [validationSchema, values]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(field => {
      const error = validationSchema[field](values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setValues,
  };
};

export default useForm;

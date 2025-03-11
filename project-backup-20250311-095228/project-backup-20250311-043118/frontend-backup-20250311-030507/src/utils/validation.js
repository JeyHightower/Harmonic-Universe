export const validateEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  return '';
};

export const validatePassword = password => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password))
    return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password))
    return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password))
    return 'Password must contain at least one number';
  return '';
};

export const validateUsername = username => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 20) return 'Username must be less than 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'Username can only contain letters, numbers, and underscores';
  return '';
};

export const validateUniverseName = name => {
  if (!name) return 'Universe name is required';
  if (name.length < 3) return 'Universe name must be at least 3 characters';
  if (name.length > 50) return 'Universe name must be less than 50 characters';
  return '';
};

export const validateDescription = description => {
  if (!description) return 'Description is required';
  if (description.length < 10)
    return 'Description must be at least 10 characters';
  if (description.length > 500)
    return 'Description must be less than 500 characters';
  return '';
};

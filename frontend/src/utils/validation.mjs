export const validateEmail = (email) => {
  if (!email) return "Email is required";

  // RFC 5322 compliant email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }

  if (email.length > 254) {
    return "Email address is too long";
  }

  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";

  // Password requirements:
  // - At least 8 characters
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  // - At least one special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character";
  }

  if (password.length > 128) {
    return "Password is too long";
  }

  return "";
};

export const validateUsername = (username) => {
  if (!username) return "Username is required";

  // Username requirements:
  // - 3-30 characters
  // - Only letters, numbers, underscores, and hyphens
  // - Must start with a letter
  // - No consecutive special characters
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;

  if (!usernameRegex.test(username)) {
    return "Username must be 3-30 characters long, start with a letter, and can only contain letters, numbers, underscores, and hyphens";
  }

  return "";
};

export const validateUniverseName = (name) => {
  if (!name) return "Universe name is required";
  if (name.length < 3) return "Universe name must be at least 3 characters";
  if (name.length > 50) return "Universe name must be less than 50 characters";
  return "";
};

export const validateDescription = (description) => {
  if (!description) return "Description is required";
  if (description.length < 10)
    return "Description must be at least 10 characters";
  if (description.length > 500)
    return "Description must be less than 500 characters";
  return "";
};

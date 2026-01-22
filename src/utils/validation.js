/**
 * Validation utility functions for form inputs
 */

// Email validation
export const validateEmail = email => {
  if (!email || !email.trim()) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return "Please enter a valid email address";
  }
  return null;
};

// Password validation
export const validatePassword = (password, isLogin = false) => {
  if (!password || !password.trim()) {
    return "Password is required";
  }
  // Only enforce minimum length for signup, not login
  if (!isLogin && password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || !confirmPassword.trim()) {
    return "Please confirm your password";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
};

// Username validation
export const validateUsername = username => {
  if (!username || !username.trim()) {
    return "Username is required";
  }
  if (username.trim().length < 3) {
    return "Username must be at least 3 characters";
  }
  if (username.trim().length > 30) {
    return "Username must be less than 30 characters";
  }
  return null;
};

// OTP validation (4-digit code)
export const validateOTP = otp => {
  if (!otp || !otp.trim()) {
    return "Verification code is required";
  }
  if (otp.length !== 4) {
    return "Please enter a valid 4-digit code";
  }
  if (!/^\d{4}$/.test(otp)) {
    return "Code must contain only numbers";
  }
  return null;
};

// Validate multiple fields at once
export const validateForm = validations => {
  const errors = {};
  let isValid = true;

  for (const [field, validation] of Object.entries(validations)) {
    const error = validation();
    if (error) {
      errors[field] = error;
      isValid = false;
    }
  }

  return {isValid, errors};
};

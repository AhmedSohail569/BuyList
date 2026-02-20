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

// Username/Full name validation
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

// Full name validation (for profile)
export const validateFullName = (name, required = true) => {
  if (required && (!name || !name.trim())) {
    return "Full name is required";
  }
  if (name && name.trim().length > 0 && name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  if (name && name.trim().length > 50) {
    return "Name must be less than 50 characters";
  }
  // Only allow letters, spaces, and common name characters
  if (name && name.trim() && !/^[a-zA-Z\s\-'.]+$/.test(name.trim())) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes";
  }
  return null;
};

// Phone number validation
export const validatePhone = (phone, required = false) => {
  if (required && (!phone || !phone.trim())) {
    return "Phone number is required";
  }
  if (phone && phone.trim()) {
    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      return "Phone number is too short";
    }
    if (digitsOnly.length > 15) {
      return "Phone number is too long";
    }
    // Basic phone validation - only digits allowed
    if (!/^\d+$/.test(digitsOnly)) {
      return "Please enter a valid phone number";
    }
  }
  return null;
};

// Gender validation
export const validateGender = (gender, required = false) => {
  if (required && (!gender || !gender.trim())) {
    return "Gender is required";
  }
  if (gender && gender.trim()) {
    const validGenders = ["male", "female", "other"];
    if (!validGenders.includes(gender.toLowerCase())) {
      return "Please select a valid gender";
    }
  }
  return null;
};

// Date of birth validation with minimum age
export const validateDateOfBirth = (dob, minAge = 13, required = false) => {
  if (required && !dob) {
    return "Date of birth is required";
  }
  if (dob) {
    const birthDate = dob instanceof Date ? dob : new Date(dob);
    if (isNaN(birthDate.getTime())) {
      return "Please enter a valid date";
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < minAge) {
      return `You must be at least ${minAge} years old`;
    }

    if (age > 120) {
      return "Please enter a valid date of birth";
    }
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

  return { isValid, errors };
};

// Remove emojis from string
export const removeEmojis = str => {
  if (!str) return "";
  // Match emoji ranges and replace with empty string
  return str.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );
};

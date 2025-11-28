/**
 * Validation and sanitization utilities for menu items and other inputs
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Sanitize string input by trimming whitespace and removing potentially dangerous characters
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitize email input
 * @param email - The email to sanitize
 * @returns Sanitized email in lowercase
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();
  
  // Remove any whitespace
  sanitized = sanitized.replace(/\s/g, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitize numeric input
 * @param input - The number to sanitize
 * @returns Sanitized number or NaN if invalid
 */
export function sanitizeNumber(input: unknown): number {
  if (typeof input === 'number') {
    return input;
  }
  
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const parsed = parseFloat(trimmed);
    return parsed;
  }
  
  return NaN;
}

/**
 * Sanitize file name to prevent path traversal
 * @param fileName - The file name to sanitize
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') {
    return '';
  }
  
  // Remove path separators and parent directory references
  let sanitized = fileName.replace(/[\/\\]/g, '_');
  sanitized = sanitized.replace(/\.\./g, '_');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 255);
  
  return sanitized;
}

export interface MenuItemValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate and sanitize menu item input data
 * @param dishName - The dish name to validate
 * @param price - The price to validate
 * @returns Validation result with errors if any and sanitized values
 */
export function validateMenuItemInput(
  dishName: unknown,
  price: unknown
): MenuItemValidationResult & { sanitizedDishName?: string; sanitizedPrice?: number } {
  const errors: ValidationError[] = [];
  let sanitizedDishName: string | undefined;
  let sanitizedPrice: number | undefined;

  // Validate and sanitize dish name
  if (dishName === undefined || dishName === null) {
    errors.push({
      field: 'dishName',
      message: 'Dish name is required',
    });
  } else if (typeof dishName !== 'string') {
    errors.push({
      field: 'dishName',
      message: 'Dish name must be a string',
    });
  } else {
    sanitizedDishName = sanitizeString(dishName);
    if (sanitizedDishName === '') {
      errors.push({
        field: 'dishName',
        message: 'Dish name must be non-empty',
      });
    }
  }

  // Validate and sanitize price
  if (price === undefined || price === null) {
    errors.push({
      field: 'price',
      message: 'Price is required',
    });
  } else {
    sanitizedPrice = sanitizeNumber(price);
    if (isNaN(sanitizedPrice)) {
      errors.push({
        field: 'price',
        message: 'Price must be a valid number',
      });
    } else if (sanitizedPrice <= 0) {
      errors.push({
        field: 'price',
        message: 'Price must be a positive number',
      });
    } else if (!isFinite(sanitizedPrice)) {
      errors.push({
        field: 'price',
        message: 'Price must be a finite number',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedDishName,
    sanitizedPrice,
  };
}

/**
 * Validate table number
 * @param tableNumber - The table number to validate
 * @param maxTableCount - The maximum table count for the hotel
 * @returns Validation result with errors if any
 */
export function validateTableNumber(
  tableNumber: unknown,
  maxTableCount: number
): MenuItemValidationResult {
  const errors: ValidationError[] = [];

  if (tableNumber === undefined || tableNumber === null) {
    errors.push({
      field: 'tableNumber',
      message: 'Table number is required',
    });
  } else if (typeof tableNumber !== 'number') {
    errors.push({
      field: 'tableNumber',
      message: 'Table number must be a number',
    });
  } else if (!Number.isInteger(tableNumber)) {
    errors.push({
      field: 'tableNumber',
      message: 'Table number must be an integer',
    });
  } else if (tableNumber < 1) {
    errors.push({
      field: 'tableNumber',
      message: 'Table number must be at least 1',
    });
  } else if (tableNumber > maxTableCount) {
    errors.push({
      field: 'tableNumber',
      message: `Table number must not exceed ${maxTableCount}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate order quantity
 * @param quantity - The quantity to validate
 * @returns Validation result with errors if any
 */
export function validateQuantity(quantity: unknown): MenuItemValidationResult {
  const errors: ValidationError[] = [];

  if (quantity === undefined || quantity === null) {
    errors.push({
      field: 'quantity',
      message: 'Quantity is required',
    });
  } else if (typeof quantity !== 'number') {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be a number',
    });
  } else if (!Number.isInteger(quantity)) {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be a positive integer',
    });
  } else if (quantity < 1) {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be at least 1',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate profile update input data
 * @param hotelName - The hotel name to validate (optional)
 * @param tableCount - The table count to validate (optional)
 * @returns Validation result with errors if any
 */
export function validateProfileUpdate(
  hotelName?: unknown,
  tableCount?: unknown
): MenuItemValidationResult {
  const errors: ValidationError[] = [];

  // Validate hotel name if provided
  if (hotelName !== undefined) {
    if (hotelName === null) {
      errors.push({
        field: 'hotelName',
        message: 'Hotel name must be non-empty',
      });
    } else if (typeof hotelName !== 'string') {
      errors.push({
        field: 'hotelName',
        message: 'Hotel name must be a string',
      });
    } else if (hotelName.trim() === '') {
      errors.push({
        field: 'hotelName',
        message: 'Hotel name must be non-empty',
      });
    }
  }

  // Validate table count if provided
  if (tableCount !== undefined) {
    if (tableCount === null) {
      errors.push({
        field: 'tableCount',
        message: 'Table count must be a positive integer',
      });
    } else if (typeof tableCount !== 'number') {
      errors.push({
        field: 'tableCount',
        message: 'Table count must be a number',
      });
    } else if (!Number.isInteger(tableCount)) {
      errors.push({
        field: 'tableCount',
        message: 'Table count must be an integer',
      });
    } else if (tableCount <= 0) {
      errors.push({
        field: 'tableCount',
        message: 'Table count must be a positive integer',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate and sanitize email input
 * @param email - The email to validate
 * @returns Validation result with errors if any and sanitized email
 */
export function validateEmail(
  email: unknown
): MenuItemValidationResult & { sanitizedEmail?: string } {
  const errors: ValidationError[] = [];
  let sanitizedEmail: string | undefined;

  if (email === undefined || email === null) {
    errors.push({
      field: 'email',
      message: 'Email is required',
    });
  } else if (typeof email !== 'string') {
    errors.push({
      field: 'email',
      message: 'Email must be a string',
    });
  } else {
    sanitizedEmail = sanitizeEmail(email);
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      errors.push({
        field: 'email',
        message: 'Email must be a valid email address',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedEmail,
  };
}

/**
 * Validate password input
 * @param password - The password to validate
 * @returns Validation result with errors if any
 */
export function validatePassword(password: unknown): MenuItemValidationResult {
  const errors: ValidationError[] = [];

  if (password === undefined || password === null) {
    errors.push({
      field: 'password',
      message: 'Password is required',
    });
  } else if (typeof password !== 'string') {
    errors.push({
      field: 'password',
      message: 'Password must be a string',
    });
  } else if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters long',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate and sanitize signup input data
 * @param email - The email to validate
 * @param password - The password to validate
 * @param hotelName - The hotel name to validate
 * @param tableCount - The table count to validate
 * @returns Validation result with errors if any and sanitized values
 */
export function validateSignupInput(
  email: unknown,
  password: unknown,
  hotelName: unknown,
  tableCount: unknown
): MenuItemValidationResult & {
  sanitizedEmail?: string;
  sanitizedHotelName?: string;
  sanitizedTableCount?: number;
} {
  const errors: ValidationError[] = [];
  let sanitizedEmail: string | undefined;
  let sanitizedHotelName: string | undefined;
  let sanitizedTableCount: number | undefined;

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.push(...emailValidation.errors);
  } else {
    sanitizedEmail = emailValidation.sanitizedEmail;
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.push(...passwordValidation.errors);
  }

  // Validate hotel name
  if (hotelName === undefined || hotelName === null) {
    errors.push({
      field: 'hotelName',
      message: 'Hotel name is required',
    });
  } else if (typeof hotelName !== 'string') {
    errors.push({
      field: 'hotelName',
      message: 'Hotel name must be a string',
    });
  } else {
    sanitizedHotelName = sanitizeString(hotelName);
    if (sanitizedHotelName === '') {
      errors.push({
        field: 'hotelName',
        message: 'Hotel name must be non-empty',
      });
    }
  }

  // Validate table count
  if (tableCount === undefined || tableCount === null) {
    errors.push({
      field: 'tableCount',
      message: 'Table count is required',
    });
  } else {
    sanitizedTableCount = sanitizeNumber(tableCount);
    if (isNaN(sanitizedTableCount)) {
      errors.push({
        field: 'tableCount',
        message: 'Table count must be a valid number',
      });
    } else if (!Number.isInteger(sanitizedTableCount)) {
      errors.push({
        field: 'tableCount',
        message: 'Table count must be an integer',
      });
    } else if (sanitizedTableCount <= 0) {
      errors.push({
        field: 'tableCount',
        message: 'Table count must be a positive integer',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedEmail,
    sanitizedHotelName,
    sanitizedTableCount,
  };
}

/**
 * Security utilities for invitation-based user setup
 * This module handles secure token validation and company isolation
 */

import { API_CONFIG } from '../api/config';

// Token validation patterns
const TOKEN_PATTERN = /^[A-Za-z0-9]{64,}$/; // Base64-like token pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates invitation token format
 * @param token - The invitation token to validate
 * @returns boolean indicating if token format is valid
 */
export const validateTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check token length and format
  if (token.length < 64 || token.length > 128) {
    return false;
  }
  
  // Check if token matches expected pattern
  return TOKEN_PATTERN.test(token);
};

/**
 * Validates email format
 * @param email - The email to validate
 * @returns boolean indicating if email format is valid
 */
export const validateEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  return EMAIL_PATTERN.test(email.trim());
};

/**
 * Sanitizes invitation token for safe storage and transmission
 * @param token - The raw invitation token
 * @returns Sanitized token string
 */
export const sanitizeToken = (token: string): string => {
  if (!token) {
    return '';
  }
  
  // Remove any whitespace and special characters
  return token.trim().replace(/[^A-Za-z0-9]/g, '');
};

/**
 * Validates password strength for invitation setup
 * @param password - The password to validate
 * @returns Object with validation results
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
  score: number; // 0-4 scale
} => {
  const errors: string[] = [];
  let score = 0;
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must contain at least one number');
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /123456/,
    /password/,
    /qwerty/,
    /admin/,
    /letmein/,
    /welcome/,
  ];
  
  const lowerPassword = password.toLowerCase();
  for (const pattern of weakPatterns) {
    if (pattern.test(lowerPassword)) {
      errors.push('Password contains common weak patterns');
      score = Math.max(0, score - 1);
      break;
    }
  }
  
  return {
    isValid: errors.length === 0 && score >= 4,
    errors,
    score: Math.min(4, score),
  };
};

/**
 * Generates a secure invitation URL
 * @param baseUrl - The base URL of the application
 * @param token - The invitation token
 * @returns Complete invitation URL
 */
export const generateInvitationUrl = (baseUrl: string, token: string): string => {
  const sanitizedToken = sanitizeToken(token);
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  return `${cleanBaseUrl}/setup-password?token=${encodeURIComponent(sanitizedToken)}`;
};

/**
 * Extracts token from URL parameters
 * @param url - The URL to extract token from
 * @returns The extracted token or null if invalid
 */
export const extractTokenFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    
    if (!token) {
      return null;
    }
    
    // Validate token format
    if (!validateTokenFormat(token)) {
      return null;
    }
    
    return sanitizeToken(token);
  } catch (error) {
    console.error('Error extracting token from URL:', error);
    return null;
  }
};

/**
 * Validates company isolation for invitation tokens
 * This ensures tokens are only valid for the intended company
 * @param token - The invitation token
 * @param companyId - The company ID to validate against
 * @returns boolean indicating if token is valid for the company
 */
export const validateCompanyIsolation = async (
  token: string,
  companyId: number
): Promise<boolean> => {
  try {
    // This would typically make an API call to verify the token
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/verify-company-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: sanitizeToken(token),
        company_id: companyId,
      }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('Error validating company isolation:', error);
    return false;
  }
};

/**
 * Rate limiting for invitation attempts
 * Prevents brute force attacks on invitation tokens
 */
class InvitationRateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Reset if window has passed
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Increment attempt count
    attempt.count += 1;
    attempt.lastAttempt = now;
    
    return attempt.count > this.maxAttempts;
  }
  
  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const invitationRateLimiter = new InvitationRateLimiter();

/**
 * Security headers for invitation-related requests
 */
export const getInvitationSecurityHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  'X-Invitation-Context': 'setup-password',
});

/**
 * Logs security events for audit purposes
 * @param event - The security event to log
 * @param details - Additional details about the event
 */
export const logSecurityEvent = (event: string, details: Record<string, any>): void => {
  const securityEvent = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  // In production, this would send to a security logging service
  console.log('Security Event:', securityEvent);

}; 
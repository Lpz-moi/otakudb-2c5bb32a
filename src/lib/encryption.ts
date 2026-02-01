/**
 * AES-256-GCM Encryption utilities for secure local storage
 * Uses Web Crypto API for client-side encryption
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derive an encryption key from a password/secret using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-256-GCM
 * Returns base64 encoded string: salt + iv + ciphertext
 */
export async function encrypt(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key from secret
  const key = await deriveKey(secret, salt);

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    dataBuffer.buffer as ArrayBuffer
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export async function decrypt(encryptedData: string, secret: string): Promise<string> {
  // Decode from base64
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  // Extract salt, iv, and ciphertext
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  // Derive key from secret
  const key = await deriveKey(secret, salt);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256
 */
export async function hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer.buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Secure storage wrapper with encryption
 */
export const secureStorage = {
  async setItem(key: string, value: string, secret: string): Promise<void> {
    try {
      const encrypted = await encrypt(value, secret);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  },

  async getItem(key: string, secret: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return await decrypt(encrypted, secret);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
};

/**
 * Rate limiter for security
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const rateLimit = {
  check(key: string, maxAttempts: number = 5, windowMs: number = 3600000): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= maxAttempts) {
      return false;
    }

    entry.count++;
    return true;
  },

  reset(key: string): void {
    rateLimitStore.delete(key);
  },

  getRemainingAttempts(key: string, maxAttempts: number = 5): number {
    const entry = rateLimitStore.get(key);
    if (!entry || Date.now() > entry.resetTime) return maxAttempts;
    return Math.max(0, maxAttempts - entry.count);
  },
};

/**
 * Input sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

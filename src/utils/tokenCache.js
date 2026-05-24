/**
 * Token Cache Utility for Clerk
 * 
 * This utility implements the required Clerk token caching interface using expo-secure-store.
 * It safely stores and retrieves authentication tokens on device.
 * 
 * Required by @clerk/clerk-expo for proper session management on Android/iOS.
 */

import * as SecureStore from 'expo-secure-store';

export const tokenCache = {
  /**
   * Get token from secure storage
   * @returns {Promise<string|null>} The cached token or null if not found
   */
  getToken: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn('Failed to retrieve token cache:', err);
      return null;
    }
  },

  /**
   * Save token to secure storage
   * @param {any} token The token/session data to cache
   * @returns {Promise<void>}
   */
  saveToken: async (key, token) => {
    try {
      await SecureStore.setItemAsync(key, token);
    } catch (err) {
      console.warn('Failed to save token cache:', err);
    }
  },

  /**
   * Clear the token cache
   * @returns {Promise<void>}
   */
  clearToken: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('Failed to clear token cache:', err);
    }
  },
};
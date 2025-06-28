/**
 * @file networkUtils.ts
 * @description Utility functions for network connectivity checks and offline state handling
 */

/**
 * Check if the device has an active internet connection
 * @returns Promise<boolean> - true if connected, false otherwise
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Use a simple fetch with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Network connectivity check failed:', error);
    return false;
  }
}

/**
 * Get user-friendly network status message
 * @param isConnected Whether the device is connected to the internet
 * @returns User-friendly message about network status
 */
export function getNetworkStatusMessage(isConnected: boolean): string {
  return isConnected
    ? 'Connected to the internet'
    : 'No internet connection. Please check your network settings.';
}

/**
 * Check if the error is related to network connectivity
 * @param error Error message or object
 * @returns true if the error is network-related
 */
export function isNetworkError(error: string | Error): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('offline')
  );
}

/**
 * Get retry delay based on retry count (exponential backoff)
 * @param retryCount Number of previous retries
 * @returns Delay in milliseconds
 */
export function getRetryDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 10000; // 10 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
}

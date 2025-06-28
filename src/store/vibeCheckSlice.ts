/**
 * @file vibeCheckSlice.ts
 * @description Redux slice for managing Vibe Check state (shortSummary, detailedReport, sourceURL, confidence, status, error).
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  analyzeDogImageWithValidation,
  analyzeDogImageWithOptimization,
  VibeCheckRequest,
  VibeCheckResponse,
} from '../services/vibeCheckService';

export interface VibeCheckState {
  shortSummary: string | null;
  detailedReport: string | null;
  sourceURL: string | null;
  confidence: number | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  retryCount: number;
  lastErrorType: 'network' | 'api' | 'validation' | 'unknown' | null;
}

const initialState: VibeCheckState = {
  shortSummary: null,
  detailedReport: null,
  sourceURL: null,
  confidence: null,
  status: 'idle',
  error: null,
  retryCount: 0,
  lastErrorType: null,
};

// Async thunk for performing a Vibe Check with base64 input (legacy)
export const performVibeCheck = createAsyncThunk<
  VibeCheckResponse,
  VibeCheckRequest,
  { rejectValue: { message: string; type: 'network' | 'api' | 'validation' | 'unknown' } }
>('vibeCheck/performVibeCheck', async ({ imageBase64, userId }, { rejectWithValue }) => {
  try {
    const result = await analyzeDogImageWithValidation(imageBase64, userId);
    return result;
  } catch (error) {
    const errorMessage = (error as Error).message;

    // Categorize errors based on message content
    let errorType: 'network' | 'api' | 'validation' | 'unknown' = 'unknown';

    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('fetch')
    ) {
      errorType = 'network';
    } else if (
      errorMessage.includes('unsupported image format') ||
      errorMessage.includes('no dog detected') ||
      errorMessage.includes('image too small') ||
      errorMessage.includes('resolution')
    ) {
      errorType = 'validation';
    } else if (
      errorMessage.includes('500') ||
      errorMessage.includes('internal server error') ||
      errorMessage.includes('service temporarily unavailable')
    ) {
      errorType = 'api';
    }

    return rejectWithValue({ message: errorMessage, type: errorType });
  }
});

// Async thunk for performing a Vibe Check with image optimization (new)
export const performVibeCheckOptimized = createAsyncThunk<
  VibeCheckResponse,
  { imageUri: string; userId: string },
  { rejectValue: { message: string; type: 'network' | 'api' | 'validation' | 'unknown' } }
>('vibeCheck/performVibeCheckOptimized', async ({ imageUri, userId }, { rejectWithValue }) => {
  try {
    const result = await analyzeDogImageWithOptimization(imageUri, userId);
    return result;
  } catch (error) {
    const errorMessage = (error as Error).message;

    // Categorize errors based on message content
    let errorType: 'network' | 'api' | 'validation' | 'unknown' = 'unknown';

    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('fetch')
    ) {
      errorType = 'network';
    } else if (
      errorMessage.includes('unsupported image format') ||
      errorMessage.includes('no dog detected') ||
      errorMessage.includes('image too small') ||
      errorMessage.includes('resolution') ||
      errorMessage.includes('compression') ||
      errorMessage.includes('optimization')
    ) {
      errorType = 'validation';
    } else if (
      errorMessage.includes('500') ||
      errorMessage.includes('internal server error') ||
      errorMessage.includes('service temporarily unavailable')
    ) {
      errorType = 'api';
    }

    return rejectWithValue({ message: errorMessage, type: errorType });
  }
});

const vibeCheckSlice = createSlice({
  name: 'vibeCheck',
  initialState,
  reducers: {
    setVibeCheckResult(
      state,
      action: PayloadAction<{
        shortSummary: string;
        detailedReport: string;
        sourceURL: string;
        confidence: number;
      }>,
    ) {
      state.shortSummary = action.payload.shortSummary;
      state.detailedReport = action.payload.detailedReport;
      state.sourceURL = action.payload.sourceURL;
      state.confidence = action.payload.confidence;
      state.status = 'succeeded';
      state.error = null;
      state.retryCount = 0;
      state.lastErrorType = null;
    },
    setVibeCheckStatus(state, action: PayloadAction<VibeCheckState['status']>) {
      state.status = action.payload;
    },
    setVibeCheckError(
      state,
      action: PayloadAction<{ message: string; type: VibeCheckState['lastErrorType'] }>,
    ) {
      state.error = action.payload.message;
      state.status = 'failed';
      state.lastErrorType = action.payload.type;
    },
    incrementRetryCount(state) {
      state.retryCount += 1;
    },
    resetRetryCount(state) {
      state.retryCount = 0;
    },
    clearVibeCheck(state) {
      state.shortSummary = null;
      state.detailedReport = null;
      state.sourceURL = null;
      state.confidence = null;
      state.status = 'idle';
      state.error = null;
      state.retryCount = 0;
      state.lastErrorType = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle both legacy and optimized thunks
      .addCase(performVibeCheck.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(performVibeCheck.fulfilled, (state, action) => {
        state.shortSummary = action.payload.short_summary;
        state.detailedReport = action.payload.detailed_report;
        state.sourceURL = action.payload.sourceUrl;
        state.confidence = action.payload.confidence;
        state.status = 'succeeded';
        state.error = null;
        state.retryCount = 0;
        state.lastErrorType = null;
      })
      .addCase(performVibeCheck.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Vibe Check failed';
        state.lastErrorType = action.payload?.type || 'unknown';
      })
      // Handle optimized thunk
      .addCase(performVibeCheckOptimized.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(performVibeCheckOptimized.fulfilled, (state, action) => {
        state.shortSummary = action.payload.short_summary;
        state.detailedReport = action.payload.detailed_report;
        state.sourceURL = action.payload.sourceUrl;
        state.confidence = action.payload.confidence;
        state.status = 'succeeded';
        state.error = null;
        state.retryCount = 0;
        state.lastErrorType = null;
      })
      .addCase(performVibeCheckOptimized.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Vibe Check failed';
        state.lastErrorType = action.payload?.type || 'unknown';
      });
  },
});

export const {
  setVibeCheckResult,
  setVibeCheckStatus,
  setVibeCheckError,
  incrementRetryCount,
  resetRetryCount,
  clearVibeCheck,
} = vibeCheckSlice.actions;

/**
 * Get user-friendly error message and retry suggestion based on error type
 */
export function getErrorInfo(errorType: VibeCheckState['lastErrorType'], retryCount: number) {
  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;

  switch (errorType) {
    case 'network':
      return {
        message: 'Network connection issue. Please check your internet connection.',
        suggestion: canRetry
          ? 'Tap to try again'
          : 'Please check your connection and try again later',
        canRetry,
        icon: '📡',
      };
    case 'validation':
      return {
        message: "The image doesn't meet our requirements.",
        suggestion: canRetry
          ? 'Try a different photo'
          : 'Please use a clearer photo with your dog clearly visible',
        canRetry: false, // Don't retry validation errors
        icon: '📸',
      };
    case 'api':
      return {
        message: 'Service temporarily unavailable.',
        suggestion: canRetry ? 'Tap to try again' : 'Please try again in a few minutes',
        canRetry,
        icon: '🔧',
      };
    default:
      return {
        message: 'Something went wrong. Please try again.',
        suggestion: canRetry ? 'Tap to try again' : 'Please try again later',
        canRetry,
        icon: '❓',
      };
  }
}

export default vibeCheckSlice.reducer;

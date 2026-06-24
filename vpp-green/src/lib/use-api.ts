// ═══════════════════════════════════════════════════════════════════
// VPP Green Maharashtra — useApi Hook
// Wraps fetch calls with loading, error, and data state
// ═══════════════════════════════════════════════════════════════════

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiRequestError } from './api';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generic hook for calling API functions with loading/error state management.
 * 
 * Usage:
 * ```ts
 * const { data, isLoading, error, execute } = useApi(speciesApi.list);
 * 
 * useEffect(() => { execute(); }, []);
 * ```
 */
export function useApi<T, Args extends unknown[] = []>(
  apiFn: (...args: Args) => Promise<{ data: T }>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  // Keep a mutable ref to the latest apiFn to avoid changing execution dependencies
  const apiFnRef = useRef(apiFn);
  
  useEffect(() => {
    apiFnRef.current = apiFn;
  }, [apiFn]);

  const execute = useCallback(async (...args: Args) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiFnRef.current(...args);
      setState({ data: response.data, isLoading: false, error: null });
      return response.data;
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'An unknown error occurred';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      console.warn("API Error handled by useApi:", message);
      return undefined;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}


import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  currentStep: string;
  error: string | null;
}

export function useLoadingState(initialState: Partial<LoadingState> = {}) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    currentStep: '',
    error: null,
    ...initialState
  });

  const startLoading = useCallback((step: string = 'Chargement...') => {
    setState(prev => ({ ...prev, isLoading: true, progress: 0, currentStep: step, error: null }));
  }, []);

  const updateProgress = useCallback((progress: number, step?: string) => {
    setState(prev => ({
      ...prev,
      progress,
      currentStep: step || prev.currentStep
    }));
  }, []);

  const completeLoading = useCallback(() => {
    setState(prev => ({ ...prev, progress: 100, isLoading: false }));
  }, []);

  const failLoading = useCallback((error: string) => {
    setState(prev => ({ ...prev, isLoading: false, error }));
  }, []);

  return { state, startLoading, updateProgress, completeLoading, failLoading };
}
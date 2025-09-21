import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// API Base URL
const API_BASE = '/api';

// Generic API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// Generic error type
interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Generic fetch function with error handling
async function apiFetch<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        details: errorData.details
      } as ApiError;
    }

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      throw {
        message: result.error || 'API request failed',
        details: result.details
      } as ApiError;
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        message: 'Network error - please check your connection',
        status: 0
      } as ApiError;
    }
    throw error;
  }
}

// Configuration Items API hooks
export function useCIs() {
  return useQuery({
    queryKey: ['cis'],
    queryFn: () => apiFetch('/cis'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

export function useCI(id: string) {
  return useQuery({
    queryKey: ['cis', id],
    queryFn: () => apiFetch(`/cis/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCI() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiFetch('/cis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cis'] });
    },
  });
}

export function useUpdateCI() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiFetch(`/cis/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cis'] });
      queryClient.invalidateQueries({ queryKey: ['cis', id] });
    },
  });
}

export function useDeleteCI() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/cis/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cis'] });
    },
  });
}

// Tickets API hooks
export function useTickets(filters?: Record<string, string>) {
  const queryParams = filters ? new URLSearchParams(filters).toString() : '';
  const endpoint = queryParams ? `/tickets?${queryParams}` : '/tickets';
  
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => apiFetch(endpoint),
    staleTime: 2 * 60 * 1000, // 2 minutes for tickets (more dynamic)
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => apiFetch(`/tickets/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiFetch('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiFetch(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// SLA Metrics hooks
export function useSLAMetrics() {
  return useQuery({
    queryKey: ['sla-metrics'],
    queryFn: () => apiFetch('/sla-metrics'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateSLAMetric() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiFetch('/sla-metrics', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Dashboard data hook
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch('/dashboard'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// CI Relationships hooks
export function useCIRelationships(ciId: string) {
  return useQuery({
    queryKey: ['ci-relationships', ciId],
    queryFn: () => apiFetch(`/cis/${ciId}/relationships`),
    enabled: !!ciId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCITickets(ciId: string) {
  return useQuery({
    queryKey: ['ci-tickets', ciId],
    queryFn: () => apiFetch(`/cis/${ciId}/tickets`),
    enabled: !!ciId,
    staleTime: 2 * 60 * 1000,
  });
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch('/health'),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute
    retry: false, // Don't retry health checks
  });
}

// Generic loading and error state hook
export function useApiState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleAsync = async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('API Error:', apiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    handleAsync,
    clearError,
  };
}

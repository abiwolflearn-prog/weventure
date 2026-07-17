import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes standard stale cache duration
      gcTime: 1000 * 60 * 15, // Keep unused data in memory for 15 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

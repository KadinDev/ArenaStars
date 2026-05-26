import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { CACHE_TIME } from "@/constants/theme";
import { safeAsyncStorage } from "@/storage/safeAsyncStorage";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_TIME.twelveHours,
      gcTime: CACHE_TIME.oneDay,
      retry: 1,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: safeAsyncStorage,
  key: "REACT_QUERY_OFFLINE_CACHE_NOSSA_PELADA",
  throttleTime: 3000
});

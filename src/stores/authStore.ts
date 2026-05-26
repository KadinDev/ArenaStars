import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "@/storage/safeAsyncStorage";
import type { AdminSession } from "@/types/database";

type AuthState = {
  admin: AdminSession | null;
  setAdmin: (admin: AdminSession | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      setAdmin: (admin) => set({ admin })
    }),
    {
      name: "nossa-pelada-admin",
      storage: createJSONStorage(() => safeAsyncStorage)
    }
  )
);

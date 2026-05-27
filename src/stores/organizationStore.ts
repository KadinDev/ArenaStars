import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "@/storage/safeAsyncStorage";
import type { Organization } from "@/types/database";

type OrganizationState = {
  selectedOrganization: Organization | null;
  setSelectedOrganization: (organization: Organization | null) => void;
};

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      selectedOrganization: null,
      setSelectedOrganization: (selectedOrganization) => set({ selectedOrganization })
    }),
    {
      name: "nossa-pelada-organization",
      storage: createJSONStorage(() => safeAsyncStorage)
    }
  )
);

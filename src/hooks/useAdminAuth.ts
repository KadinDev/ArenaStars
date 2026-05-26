import { useMutation } from "@tanstack/react-query";
import { getCurrentAdminSession, signInAdmin, signOutAdmin } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

export function useAdminAuth() {
  const admin = useAuthStore((state) => state.admin);
  const setAdmin = useAuthStore((state) => state.setAdmin);

  const refresh = useMutation({
    mutationFn: getCurrentAdminSession,
    onSuccess: setAdmin
  });

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signInAdmin(email, password),
    onSuccess: setAdmin
  });

  const logout = useMutation({
    mutationFn: signOutAdmin,
    onSuccess: () => setAdmin(null)
  });

  return {
    admin,
    isAdmin: Boolean(admin?.isAdmin),
    refresh,
    login,
    logout
  };
}

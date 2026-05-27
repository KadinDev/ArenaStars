import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function AuthBootstrap() {
  const { refresh } = useAdminAuth();

  useEffect(() => {
    refresh.mutate();
  }, []);

  return null;
}

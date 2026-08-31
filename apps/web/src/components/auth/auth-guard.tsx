"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandSplashLoader } from "@/components/brand/brand-splash-loader";
import { setPortalRoleCookie } from "@/lib/auth/portal-role";
import { dashboardPathForRole } from "@/lib/auth/routes";
import { useAuthStore } from "@/lib/auth/store";
import type { UserRole } from "@/lib/auth/types";

interface AuthGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    setPortalRoleCookie(user.role);

    if (!allowedRoles.includes(user.role)) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [allowedRoles, isHydrated, router, user]);

  if (!isHydrated) {
    return (
      <BrandSplashLoader fullScreen={false} className="min-h-[50vh]" />
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import { InstallAppButton } from "@/components/layout/install-app-button";
import {
  isNavItemActive,
  navItemsForRole,
  portalHomeForRole,
} from "@/components/layout/portal-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SignOutConfirmDialog } from "@/components/layout/sign-out-confirm-dialog";
import { logoutRequest } from "@/lib/auth/api";
import { roleLabel } from "@/lib/auth/routes";
import { useAuthStore } from "@/lib/auth/store";
import { clearOfflineCache } from "@/lib/offline/db";
import { registerBrowserPush } from "@/lib/notifications/push";

interface PortalShellProps {
  children: React.ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (accessToken) {
      void registerBrowserPush().catch(() => undefined);
    }
  }, [accessToken]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function confirmSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (accessToken) {
        await logoutRequest(accessToken, refreshToken);
      }
    } finally {
      await clearOfflineCache().catch(() => undefined);
      clearSession();
      router.push("/login");
    }
  }

  const navItems = user ? navItemsForRole(user.role) : [];
  const homeHref = user ? portalHomeForRole(user.role) : "/";

  const sidebar = (
    <aside
      className={`flex h-full flex-col border-r border-white/10 bg-[linear-gradient(180deg,#163528_0%,#1f4d3a_48%,#245743_100%)] text-white transition-[width] duration-300 ${
        collapsed ? "w-[78px]" : "w-[260px]"
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        <BrandLogo
          href={homeHref}
          size="md"
          showText={!collapsed}
          variant="light"
          className={collapsed ? "justify-center" : ""}
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-white text-forest shadow-sm"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  active ? "text-forest" : "text-white/70 group-hover:text-white"
                }`}
              />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <InstallAppButton collapsed={collapsed} variant="sidebar" />
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="mb-2 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white lg:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed ? <span>Collapse</span> : null}
        </button>
        {user && !collapsed ? (
          <div className="mb-2 rounded-xl bg-white/10 px-3 py-2.5">
            <p className="truncate text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-white/55">{roleLabel(user.role)}</p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed ? <span>Sign out</span> : null}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[linear-gradient(160deg,#f4f8f5_0%,#eef3f0_45%,#e8efe9_100%)]">
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">{sidebar}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-10 w-[270px] shadow-2xl">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-white/75 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:bg-sand lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {user ? roleLabel(user.role) : "Portal"}
                </p>
                <p className="hidden text-xs text-ink/50 sm:block">
                  Distance learning workspace
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <InstallAppButton variant="header" />
              <NotificationBell />
              {user ? (
                <div className="hidden items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1.5 sm:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-[11px] font-semibold text-white">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                  <span className="pr-1 text-sm text-ink/80">
                    {user.firstName}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 md:px-6 md:py-7">
          <div className="mx-auto w-full max-w-6xl">
            <ConnectivityBanner />
            <div className="animate-rise">{children}</div>
          </div>
        </main>
      </div>
      <SignOutConfirmDialog
        open={signOutOpen}
        busy={signingOut}
        onStay={() => setSignOutOpen(false)}
        onConfirm={() => void confirmSignOut()}
      />
    </div>
  );
}

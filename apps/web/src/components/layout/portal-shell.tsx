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

function usePreferCollapsedSidebar() {
  const [preferCollapsed, setPreferCollapsed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const sync = () => setPreferCollapsed(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return preferCollapsed;
}

export function PortalShell({ children }: PortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const preferCollapsed = usePreferCollapsedSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setCollapsed(preferCollapsed);
  }, [preferCollapsed]);

  useEffect(() => {
    if (accessToken) {
      void registerBrowserPush().catch(() => undefined);
    }
  }, [accessToken]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

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

  function renderSidebar(options: {
    collapsed: boolean;
    showCloseButton?: boolean;
  }) {
    const { collapsed: isCollapsed, showCloseButton = false } = options;
    return (
      <aside
        className={`flex h-full flex-col border-r border-white/10 bg-[linear-gradient(180deg,#163528_0%,#1f4d3a_48%,#245743_100%)] text-white transition-[width] duration-300 ${
          isCollapsed
            ? "w-[72px]"
            : "w-[min(270px,85vw)] md:w-[240px] lg:w-[260px]"
        }`}
      >
        <div
          className={`flex items-center gap-3 px-3 py-4 sm:px-4 sm:py-5 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <BrandLogo
            href={homeHref}
            size="md"
            showText={!isCollapsed}
            variant="light"
            className={isCollapsed ? "justify-center" : ""}
          />
          {showCloseButton ? (
            <button
              type="button"
              aria-label="Close menu"
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4 sm:px-3">
          {navItems.map((item) => {
            const active = isNavItemActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-forest shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    active
                      ? "text-forest"
                      : "text-white/70 group-hover:text-white"
                  }`}
                />
                {!isCollapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-2 sm:p-3">
          <InstallAppButton collapsed={isCollapsed} variant="sidebar" />
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mb-2 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white md:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!isCollapsed ? <span>Collapse</span> : null}
          </button>
          {user && !isCollapsed ? (
            <div className="mb-2 rounded-xl bg-white/10 px-3 py-2.5">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-white/55">
                {roleLabel(user.role)}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setSignOutOpen(true)}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed ? <span>Sign out</span> : null}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <div className="flex min-h-screen min-h-dvh bg-[linear-gradient(160deg,#f4f8f5_0%,#eef3f0_45%,#e8efe9_100%)]">
      <div className="sticky top-0 hidden h-dvh shrink-0 md:block">
        {renderSidebar({ collapsed })}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-10 max-w-[85vw] shadow-2xl">
            {renderSidebar({ collapsed: false, showCloseButton: true })}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-white/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:bg-sand md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {user ? roleLabel(user.role) : "Sign in"}
                </p>
                <p className="hidden truncate text-xs text-ink/50 sm:block">
                  Mahbere Ahaw Seminary
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <InstallAppButton variant="header" />
              <NotificationBell />
              {user ? (
                <div className="hidden items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1.5 sm:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-[11px] font-semibold text-white">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                  <span className="max-w-[7rem] truncate pr-1 text-sm text-ink/80 lg:max-w-[10rem]">
                    {user.firstName}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-5 md:px-6 md:py-7">
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

/* eslint-disable no-restricted-globals */

const SHELL_CACHE = "lms-shell-v2";
const STATIC_CACHE = "lms-static-v2";
const SHELL_URLS = [
  "/",
  "/login",
  "/student",
  "/student/courses",
  "/student/assignments",
  "/student/grades",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/pdf.worker.min.mjs",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/_next/image") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".mjs") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webmanifest")
  );
}

function isStudentShellPath(pathname) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/student" ||
    pathname.startsWith("/student/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // API and authenticated downloads always go to the network.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          void fetch(request)
            .then((response) => {
              if (response.ok) {
                void cache.put(request, response.clone());
              }
            })
            .catch(() => undefined);
          return cached;
        }

        const response = await fetch(request);
        if (response.ok) {
          void cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (
          response.ok &&
          (request.mode === "navigate" || isStudentShellPath(url.pathname))
        ) {
          const copy = response.clone();
          void caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
        if (request.mode === "navigate") {
          const studentHome = await caches.match("/student");
          if (studentHome) {
            return studentHome;
          }
          const login = await caches.match("/login");
          if (login) {
            return login;
          }
        }
        return Response.error();
      }),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : { title: "LMS", body: "New update" };
  event.waitUntil(
    self.registration.showNotification(data.title ?? "LMS", {
      body: data.body ?? "",
      data: { url: data.url ?? "/" },
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});

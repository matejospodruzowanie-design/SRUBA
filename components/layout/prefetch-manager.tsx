"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefetches all main tab routes so they're in the router cache.
 * Combined with loading.tsx skeletons, navigation feels instant.
 */
const ALL_ROUTES = [
  "/dashboard",
  "/workout",
  "/history",
  "/exercises",
  "/plans",
  "/progress",
  "/challenges",
  "/coach",
  "/profile",
  "/app",
];

export function PrefetchManager() {
  const router = useRouter();

  useEffect(() => {
    // Stagger preloading to avoid overwhelming the server
    ALL_ROUTES.forEach((route, i) => {
      setTimeout(() => {
        router.prefetch(route);
      }, i * 80);
    });
  }, [router]);

  return null; // invisible
}

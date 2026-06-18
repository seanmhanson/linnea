"use client";

import { useMemo, useSyncExternalStore } from "react";

const BREAKPOINTS = [
  { name: "small-phone", minWidth: 320 },
  { name: "phone", minWidth: 412 },
  { name: "large-phone", minWidth: 640 },
  { name: "tablet", minWidth: 768 },
  { name: "small-laptop", minWidth: 1024 },
  { name: "desktop", minWidth: 1280 },
  { name: "wide-desktop", minWidth: 1440 },
] as const;

type BreakpointName = (typeof BREAKPOINTS)[number]["name"];

type BreakpointState = {
  breakpoint: BreakpointName;
  isSmallViewport: boolean;
  isPhoneUp: boolean;
  isLargePhoneUp: boolean;
  isTabletUp: boolean;
  isDesktopUp: boolean;
};

const BREAKPOINT_INDEX = new Map<BreakpointName, number>(
  BREAKPOINTS.map(({ name }, index) => [name, index])
);

const SERVER_BREAKPOINT: BreakpointName = "small-phone";

const subscribers = new Set<() => void>();
let cleanupMediaListeners: (() => void) | null = null;

function getBreakpointFromWidth(width: number): BreakpointName {
  let active: BreakpointName = BREAKPOINTS[0].name;

  for (const entry of BREAKPOINTS) {
    if (width >= entry.minWidth) {
      active = entry.name;
    }
  }

  return active;
}

function getSnapshot(): BreakpointName {
  if (typeof window === "undefined") {
    return SERVER_BREAKPOINT;
  }

  return getBreakpointFromWidth(window.innerWidth);
}

function getServerSnapshot(): BreakpointName {
  return SERVER_BREAKPOINT;
}

function createMediaListeners() {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQueryLists = BREAKPOINTS.map(({ minWidth }) =>
    window.matchMedia(`(min-width: ${minWidth}px)`)
  );

  const notifySubscribers = () => {
    for (const subscriber of subscribers) {
      subscriber();
    }
  };

  for (const mediaQueryList of mediaQueryLists) {
    mediaQueryList.addEventListener("change", notifySubscribers);
  }

  window.addEventListener("orientationchange", notifySubscribers);

  return () => {
    for (const mediaQueryList of mediaQueryLists) {
      mediaQueryList.removeEventListener("change", notifySubscribers);
    }

    window.removeEventListener("orientationchange", notifySubscribers);
  };
}

function subscribe(onStoreChange: () => void) {
  subscribers.add(onStoreChange);

  if (!cleanupMediaListeners) {
    cleanupMediaListeners = createMediaListeners();
  }

  return () => {
    subscribers.delete(onStoreChange);

    if (subscribers.size === 0 && cleanupMediaListeners) {
      cleanupMediaListeners();
      cleanupMediaListeners = null;
    }
  };
}

export function useBreakpoint(): BreakpointState {
  const breakpoint = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => {
    const currentIndex = BREAKPOINT_INDEX.get(breakpoint) ?? 0;

    const isAtLeast = (name: BreakpointName) => {
      const targetIndex = BREAKPOINT_INDEX.get(name) ?? 0;
      return currentIndex >= targetIndex;
    };

    return {
      breakpoint,
      isSmallViewport: !isAtLeast("large-phone"),
      isPhoneUp: isAtLeast("phone"),
      isLargePhoneUp: isAtLeast("large-phone"),
      isTabletUp: isAtLeast("tablet"),
      isDesktopUp: isAtLeast("desktop"),
    };
  }, [breakpoint]);
}

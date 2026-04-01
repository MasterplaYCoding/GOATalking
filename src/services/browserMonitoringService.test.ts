import { afterEach, describe, expect, it } from "vitest";
import {
  getActivitySnapshot,
  getPreference,
  setPreference,
  trackUserActivity,
} from "./browserMonitoringService";

describe("browserMonitoringService", () => {
  afterEach(() => {
    installCookieDocument();
  });

  it("stores preferences and activity in cookies", () => {
    installCookieDocument();

    setPreference("dashboardViewMode", "grid");
    trackUserActivity("poll", "create-poll:1");

    expect(getPreference("dashboardViewMode")).toBe("grid");
    expect(getActivitySnapshot().events[0]).toMatchObject({
      type: "poll",
      detail: "create-poll:1",
    });
  });

  it("falls back safely when cookies are missing or invalid", () => {
    installCookieDocument();
    document.cookie = "goatalking_preferences=%7Bbad-json";

    expect(getPreference("dashboardViewMode")).toBeUndefined();
    expect(getActivitySnapshot()).toEqual({ events: [] });
  });

  it("falls back safely when document is unavailable", () => {
    Object.defineProperty(globalThis, "document", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(getPreference("lastVisitedRoute")).toBeUndefined();
    expect(getActivitySnapshot()).toEqual({ events: [] });
    expect(() => setPreference("lastVisitedRoute", "/feed")).not.toThrow();
    expect(() => trackUserActivity("route", "/feed")).not.toThrow();
  });

  it("keeps only the most recent 20 activity events", () => {
    installCookieDocument();

    for (let index = 0; index < 25; index += 1) {
      trackUserActivity("poll", `event-${index}`);
    }

    const snapshot = getActivitySnapshot();

    expect(snapshot.events).toHaveLength(20);
    expect(snapshot.events[0].detail).toBe("event-24");
    expect(snapshot.events[19].detail).toBe("event-5");
  });
});

function installCookieDocument() {
  const cookieStore = new Map<string, string>();

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      get cookie() {
        return Array.from(cookieStore.entries())
          .map(([key, value]) => `${key}=${value}`)
          .join("; ");
      },
      set cookie(cookieValue: string) {
        const [pair] = cookieValue.split(";");
        const [name, value] = pair.split("=");
        cookieStore.set(name, value);
      },
    },
  });
}

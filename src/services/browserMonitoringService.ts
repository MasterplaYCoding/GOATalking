type ActivitySnapshot = {
  events: Array<{
    type: string;
    detail: string;
    at: string;
  }>;
};

type PreferenceSnapshot = {
  dashboardViewMode?: "table" | "grid";
  lastVisitedRoute?: string;
};

const ACTIVITY_COOKIE = "goatalking_activity";
const PREFERENCES_COOKIE = "goatalking_preferences";
const MAX_ACTIVITY_EVENTS = 20;

export function setPreference<Key extends keyof PreferenceSnapshot>(
  key: Key,
  value: PreferenceSnapshot[Key]
): void {
  const currentPreferences = readPreferences();
  writeCookie(
    PREFERENCES_COOKIE,
    JSON.stringify({
      ...currentPreferences,
      [key]: value,
    })
  );
}

export function getPreference<Key extends keyof PreferenceSnapshot>(key: Key): PreferenceSnapshot[Key] | undefined {
  return readPreferences()[key];
}

export function trackUserActivity(type: string, detail: string): void {
  const currentSnapshot = readActivitySnapshot();
  const nextSnapshot: ActivitySnapshot = {
    events: [
      {
        type,
        detail,
        at: new Date().toISOString(),
      },
      ...currentSnapshot.events,
    ].slice(0, MAX_ACTIVITY_EVENTS),
  };

  writeCookie(ACTIVITY_COOKIE, JSON.stringify(nextSnapshot));
}

export function getActivitySnapshot(): ActivitySnapshot {
  return readActivitySnapshot();
}

function readPreferences(): PreferenceSnapshot {
  return parseCookieJson<PreferenceSnapshot>(PREFERENCES_COOKIE, {});
}

function readActivitySnapshot(): ActivitySnapshot {
  return parseCookieJson<ActivitySnapshot>(ACTIVITY_COOKIE, { events: [] });
}

function parseCookieJson<T>(name: string, fallback: T): T {
  if (typeof document === "undefined") {
    return fallback;
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")[1];

  if (!cookieValue) {
    return fallback;
  }

  try {
    return JSON.parse(decodeURIComponent(cookieValue)) as T;
  } catch {
    return fallback;
  }
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

// All booking times are anchored to the studio's physical timezone so that a
// time the customer picks (e.g. "6:00 PM") always means 6:00 PM in the studio,
// regardless of the customer's browser timezone or the server's UTC clock.
export const STUDIO_TIME_ZONE = "America/New_York";

const TIME_LABEL_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

/** Parses a label like "6:00 PM" into 24-hour { hour, minute }. */
export function parseTimeLabel(time: string): { hour: number; minute: number } | null {
  const m = time.match(TIME_LABEL_RE);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

/**
 * Converts a wall-clock time (year/month/day/hour/minute) interpreted in a
 * given IANA timezone into the correct UTC instant. Handles DST automatically
 * by measuring the zone's offset at that instant. No external library needed.
 */
export function zonedWallTimeToUtc(
  year: number,
  month0: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = STUDIO_TIME_ZONE,
): Date {
  const utcGuess = Date.UTC(year, month0, day, hour, minute, 0, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(utcGuess))) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let h = parseInt(map.hour, 10);
  if (h === 24) h = 0; // some engines emit "24" for midnight
  const asZoneUtc = Date.UTC(
    parseInt(map.year, 10),
    parseInt(map.month, 10) - 1,
    parseInt(map.day, 10),
    h,
    parseInt(map.minute, 10),
    parseInt(map.second, 10),
  );
  const offset = asZoneUtc - utcGuess;
  return new Date(utcGuess - offset);
}

/**
 * Combines a calendar date (only its year/month/day are used) with a time label
 * like "6:00 PM", interpreting both in the studio timezone, and returns the
 * correct UTC instant. Returns null if the time label can't be parsed.
 */
export function studioWallTimeToUtc(date: Date, time: string): Date | null {
  const parsed = parseTimeLabel(time);
  if (!parsed) return null;
  return zonedWallTimeToUtc(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    parsed.hour,
    parsed.minute,
    STUDIO_TIME_ZONE,
  );
}

/** Formats an instant as a studio-local date, e.g. "Tuesday, June 10, 2026". */
export function formatStudioDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/** Formats an instant as a studio-local time, e.g. "6:00 PM". */
export function formatStudioTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Returns the studio-local day-of-week (0=Sun..6=Sat) and minutes-since-midnight
 * for a given instant. Used to validate a booking against availability rules.
 */
export function studioLocalInfo(d: Date): { dayOfWeek: number; minutes: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(d)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let h = parseInt(map.hour, 10);
  if (h === 24) h = 0;
  return {
    dayOfWeek: WEEKDAY_INDEX[map.weekday] ?? 0,
    minutes: h * 60 + parseInt(map.minute, 10),
  };
}

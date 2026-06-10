// Tiny client-side booking store using sessionStorage
export type BookingState = {
  serviceId?: string;
  serviceDbId?: string; // DB UUID
  serviceName?: string;
  servicePrice?: number;
  serviceDurationMinutes?: number;
  date?: string; // ISO date
  time?: string; // display label
  startAt?: string; // ISO start
  endAt?: string; // ISO end
  fullName?: string;
  email?: string;
  phone?: string;
  consented?: boolean;
  bookingId?: string; // after insert
  addOnIds?: string[]; // selected add-on slugs
  vip?: boolean; // VIP Monday upgrade
};

export const VIP_FEE = 50;

const KEY = "luxx-booking";

export function getBooking(): BookingState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function setBooking(patch: Partial<BookingState>) {
  if (typeof window === "undefined") return;
  const next = { ...getBooking(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(next));
}

export function clearBooking() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

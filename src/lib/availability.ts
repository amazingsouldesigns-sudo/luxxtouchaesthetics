import { supabase } from "@/integrations/supabase/client";

export type Slot = {
  start: string; // ISO
  end: string;
};

/**
 * Get available time slots for a service on a given date.
 * Generates slots from availability_rules, then subtracts blackouts and
 * already-booked overlapping slots (respecting capacity).
 */
export async function getAvailableSlots(serviceId: string, date: Date): Promise<Slot[]> {
  // Normalize date to local YYYY-MM-DD
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const dayOfWeek = new Date(y, m, d).getDay();

  // 1. Fetch service
  const { data: service, error: svcErr } = await supabase
    .from("services")
    .select("id, duration_minutes, capacity, active")
    .eq("id", serviceId)
    .maybeSingle();
  if (svcErr || !service || !service.active) return [];

  // 2. Fetch rules for this day, applicable to this service or all services
  const { data: rules } = await supabase
    .from("availability_rules")
    .select("start_time, end_time, slot_interval_minutes, service_id")
    .eq("day_of_week", dayOfWeek)
    .or(`service_id.is.null,service_id.eq.${serviceId}`);

  if (!rules || rules.length === 0) return [];

  // 3. Day window
  const dayStart = new Date(y, m, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m, d + 1, 0, 0, 0, 0);
  const now = new Date();

  // 4. Fetch blackouts overlapping this day (any service or this service)
  const { data: blackouts } = await supabase
    .from("availability_blackouts")
    .select("start_at, end_at, service_id")
    .lt("start_at", dayEnd.toISOString())
    .gt("end_at", dayStart.toISOString());

  const applicableBlackouts = (blackouts ?? []).filter(
    (b) => b.service_id === null || b.service_id === serviceId
  );

  // 5. Fetch existing non-cancelled bookings for this service overlapping today
  //    (via SECURITY DEFINER RPC that exposes only time-slot columns, not PII)
  const { data: bookings } = await supabase.rpc("get_booked_slots", {
    _service_id: serviceId,
    _from: dayStart.toISOString(),
    _to: dayEnd.toISOString(),
  });

  // 6. Generate candidate slots from rules
  const duration = service.duration_minutes;
  const capacity = service.capacity;
  const candidates: Slot[] = [];

  for (const rule of rules) {
    const [sh, sm] = rule.start_time.split(":").map(Number);
    const [eh, em] = rule.end_time.split(":").map(Number);
    const ruleStart = new Date(y, m, d, sh, sm, 0, 0);
    const ruleEnd = new Date(y, m, d, eh, em, 0, 0);
    const interval = rule.slot_interval_minutes;

    let cursor = new Date(ruleStart);
    while (true) {
      const slotEnd = new Date(cursor.getTime() + duration * 60_000);
      if (slotEnd > ruleEnd) break;

      // skip past slots
      if (cursor <= now) {
        cursor = new Date(cursor.getTime() + interval * 60_000);
        continue;
      }

      // skip blackout-covered slots
      const isBlackedOut = applicableBlackouts.some((b) => {
        const bs = new Date(b.start_at);
        const be = new Date(b.end_at);
        return cursor < be && slotEnd > bs;
      });
      if (isBlackedOut) {
        cursor = new Date(cursor.getTime() + interval * 60_000);
        continue;
      }

      // count overlapping bookings
      const overlapCount = (bookings ?? []).filter((bk) => {
        const bs = new Date(bk.start_at);
        const be = new Date(bk.end_at);
        return cursor < be && slotEnd > bs;
      }).length;

      if (overlapCount < capacity) {
        candidates.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
      }

      cursor = new Date(cursor.getTime() + interval * 60_000);
    }
  }

  // Dedupe (in case multiple rules overlap)
  const seen = new Set<string>();
  return candidates.filter((s) => {
    if (seen.has(s.start)) return false;
    seen.add(s.start);
    return true;
  }).sort((a, b) => a.start.localeCompare(b.start));
}

import type { Availability, Booking } from './types';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Formats a stored 24-hour 'HH:mm' time (bookings/availability are always stored this way, for
 * clean string sorting/comparison) as a 12-hour clock for display, e.g. '09:00' -> '9:00 AM',
 * '14:30' -> '2:30 PM'. */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * date must be 'YYYY-MM-DD'. Returns 'HH:mm' slots not already booked,
 * and (for today) not already in the past.
 */
export function generateAvailableSlots(
  availability: Availability,
  date: string,
  existingBookings: Booking[],
  now: Date = new Date()
): string[] {
  const weekday = new Date(`${date}T00:00:00`).getDay();

  if (availability.blockedDates.includes(date)) {
    return [];
  }

  const hours = availability.workingHours[weekday];
  if (!hours) {
    return [];
  }

  const bookedSlots = new Set(
    existingBookings
      .filter((b) => b.date === date && b.status !== 'rejected')
      .map((b) => b.timeSlot)
  );

  const start = toMinutes(hours.start);
  const end = toMinutes(hours.end);
  const duration = availability.slotDurationMinutes;

  const isToday = date === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];
  for (let t = start; t + duration <= end; t += duration) {
    const slot = toHHMM(t);
    if (bookedSlots.has(slot)) continue;
    if (isToday && t <= nowMinutes) continue;
    slots.push(slot);
  }
  return slots;
}

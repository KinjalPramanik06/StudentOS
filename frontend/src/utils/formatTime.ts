import dayjs from 'dayjs';

/**
 * Formats a dayjs date object or current time to a 12-hour clock string (e.g., "02:30:15 PM").
 */
export function formatClock12h(dateInput?: dayjs.Dayjs | Date | string): string {
  const d = dateInput ? dayjs(dateInput) : dayjs();
  return d.format('hh:mm:ss A');
}

/**
 * Formats a short time string like "10:00" or "1:50" or "14:30" to 12-hour format with AM/PM.
 */
export function formatSingleTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (/am|pm/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;

  let hour = parseInt(parts[0], 10);
  const min = parts[1].padStart(2, '0');

  if (isNaN(hour)) return trimmed;

  let period = 'AM';
  if (hour >= 12) {
    period = 'PM';
    if (hour > 12) hour -= 12;
  } else if (hour >= 1 && hour <= 7) {
    // Standard college schedule hours 1:00 to 7:00 are PM
    period = 'PM';
  } else if (hour === 0) {
    hour = 12;
    period = 'AM';
  } else {
    period = 'AM';
  }

  return `${hour}:${min} ${period}`;
}

/**
 * Converts time slot strings like "10:00-10:50" or "1:00-1:50" to "10:00 AM - 10:50 AM" or "1:00 PM - 1:50 PM".
 */
export function formatTimeSlot12h(timeSlot: string): string {
  if (!timeSlot) return '';
  const parts = timeSlot.split('-').map((p) => p.trim());
  if (parts.length === 2) {
    return `${formatSingleTime12h(parts[0])} - ${formatSingleTime12h(parts[1])}`;
  }
  return timeSlot;
}

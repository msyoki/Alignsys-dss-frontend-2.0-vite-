import { formatDateOnly } from './datetime';

// Locale date in the user's time zone.
export function formatDate(date) {
  return formatDateOnly(date);
}

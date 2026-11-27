import { formatFull } from '../utils/datetime';

// Date and time in the user's time zone, e.g. "18/Nov/2026 :22:20:24 Nairobi (UTC+03:00)".
const HumanizedDate = ({ dateStr }) => formatFull(dateStr);

export default HumanizedDate;

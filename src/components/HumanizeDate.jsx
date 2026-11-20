import { formatPattern } from '../utils/datetime';

// Date and time in the user's time zone, e.g. "20/Nov/2026 :11:15" (same format as before).
const HumanizedDate = ({ dateStr }) => formatPattern(dateStr, 'DD/MMM/YYYY :HH:mm');

export default HumanizedDate;

// Dashboard utility functions
export function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRange() {
  const now = new Date();
  const endDate = new Date(now);
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30);
  endDate.setDate(endDate.getDate() + 1);
  return {
    start_date: formatDateLocal(startDate),
    end_date: formatDateLocal(endDate)
  };
}

export function stringAvatar(name) {
  const nameParts = name.split(' ');
  const firstInitial = nameParts[0] ? nameParts[0][0] : '';
  const secondInitial = nameParts[1] ? nameParts[1][0] : '';
  return { children: `${firstInitial}${secondInitial}` };
}

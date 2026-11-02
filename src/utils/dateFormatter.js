// Helper to get a date object adjusted to Philippine Time (UTC+8)
function getPhilippineDate(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  // Shift to Philippine Time (UTC+8)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 8));
}

export function formatTransactionDate(dateString) {
  if (!dateString) return '';
  
  const txDate = getPhilippineDate(dateString);
  const now = getPhilippineDate();

  // Format time (e.g., "2:30 PM")
  const timeString = txDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  // Check if it's today in PH time
  const isToday = txDate.toDateString() === now.toDateString();
  if (isToday) {
    return `Today, ${timeString}`;
  }

  // Check if it's yesterday in PH time
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = txDate.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday, ${timeString}`;
  }

  // Otherwise, return short date + time (e.g., "Oct 15, 2026, 2:30 PM")
  const dateFormatted = txDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateFormatted}, ${timeString}`;
}
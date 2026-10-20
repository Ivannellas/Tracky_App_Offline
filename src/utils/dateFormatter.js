export function formatTransactionDate(dateString) {
  if (!dateString) return '';
  
  const txDate = new Date(dateString);
  const now = new Date();

  // Format time (e.g., "2:30 PM")
  const timeString = txDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  // Check if it's today
  const isToday = txDate.toDateString() === now.toDateString();
  if (isToday) {
    return `Today, ${timeString}`;
  }

  // Check if it's yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = txDate.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday, ${timeString}`;
  }

  // Otherwise, return short date + time (e.g., "Oct 15, 2026, 2:30 PM")
  const dateFormatted = txDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateFormatted}, ${timeString}`;
}
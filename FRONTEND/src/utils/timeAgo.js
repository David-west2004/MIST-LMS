export const isRecentlyActive = (lastActiveDate) => {
  if (!lastActiveDate) return false;
  const lastActiveTime = new Date(lastActiveDate).getTime();
  if (isNaN(lastActiveTime)) return false;
  const diffMs = Date.now() - lastActiveTime;
  return diffMs >= 0 && diffMs < 5 * 60 * 1000; // less than 5 minutes
};

export const formatRelativeActivity = (lastActiveDate) => {
  if (!lastActiveDate) return 'Offline';
  const lastActiveTime = new Date(lastActiveDate).getTime();
  if (isNaN(lastActiveTime)) return 'Offline';

  const diffSeconds = Math.floor((Date.now() - lastActiveTime) / 1000);
  if (diffSeconds < 0 || diffSeconds < 60) return 'Active just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes === 1) return 'Active 1 min ago';
  if (diffMinutes < 60) return `Active ${diffMinutes} mins ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return 'Active 1 hour ago';
  if (diffHours < 24) return `Active ${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Active yesterday';
  if (diffDays < 7) return `Active ${diffDays} days ago`;

  return 'Offline';
};

export function formatMessageTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const loadUnreadMessages = () => {
  const saved = localStorage.getItem('unreadMessages');
  return saved ? JSON.parse(saved) : {};
};

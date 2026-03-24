import { useState } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'danger';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  turn: number;
  timestamp: number;
  read: boolean;
  location?: { x: number; y: number };
}

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const typeColors: Record<NotificationType, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
};

export function NotificationPanel({
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onNotificationClick,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const filteredNotifications = notifications.filter(
    n => filter === 'all' || n.type === filter
  );

  return (
    <div className="absolute top-14 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1">
          {(['all', 'info', 'success', 'warning', 'danger'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 text-xs rounded ${
                filter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredNotifications.map(notification => (
              <li
                key={notification.id}
                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                  !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => {
                  onMarkRead(notification.id);
                  onNotificationClick?.(notification);
                }}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1 ${typeColors[notification.type]}`}>
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-400">
                        T{notification.turn}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <button
          onClick={onMarkAllRead}
          className="flex-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          Mark All Read
        </button>
        <button
          onClick={onClearAll}
          className="flex-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'info':
      return '🔵';
    case 'success':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'danger':
      return '🔴';
  }
}

export function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  turn: number,
  location?: { x: number; y: number }
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    turn,
    timestamp: Date.now(),
    read: false,
    location,
  };
}

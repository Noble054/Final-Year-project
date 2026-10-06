import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAlerts, setHasAlerts] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/notifications`, config);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setHasAlerts(data.hasAlerts);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-amber-400" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-400" size={20} />;
      default:
        return <Info className="text-blue-400" size={20} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-400/50 bg-red-400/10';
      case 'medium':
        return 'border-amber-400/50 bg-amber-400/10';
      default:
        return 'border-blue-400/50 bg-blue-400/10';
    }
  };

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const handleAction = (notification) => {
    if (notification.action?.link) {
      window.location.href = notification.action.link;
    }
    dismissNotification(notification.id);
  };

  if (loading) {
    return (
      <div className="relative">
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <Bell className="text-gray-400" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
      >
        <Bell className={`${hasAlerts ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto glass-card z-50 border border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="mx-auto mb-2 text-gray-600" size={32} />
                  <p>No new notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 mb-2 rounded-lg border ${getPriorityColor(notification.priority)} transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        {notification.action && (
                          <button
                            onClick={() => handleAction(notification)}
                            className="text-xs text-neonCyan hover:text-white transition-colors"
                          >
                            {notification.action.text} →
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10">
                <button
                  onClick={() => {
                    notifications.forEach(n => dismissNotification(n.id));
                    setIsOpen(false);
                  }}
                  className="w-full text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPanel;
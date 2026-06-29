import { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

function NotificationsPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setLoading(false);
          return;
        }
        const user = JSON.parse(storedUser);
        const res = await fetch(`${API_BASE}/users/notifications/${user.user_id}`);
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'battle_won': return '🏆';
      case 'battle_lost': return '😞';
      case 'quiz_completed': return '✅';
      case 'quiz_created': return '📝';
      case 'tournament_joined': return '🎯';
      case 'badge_earned': return '🏅';
      default: return '🔔';
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case 'battle_won': return 'Battle Won';
      case 'battle_lost': return 'Battle Lost';
      case 'quiz_completed': return 'Quiz Completed';
      case 'quiz_created': return 'Quiz Created';
      case 'tournament_joined': return 'Tournament';
      case 'badge_earned': return 'Badge';
      default: return 'Notification';
    }
  };

  return (
    <div className="fixed right-2 sm:right-4 top-16 sm:top-20 w-[calc(100vw-16px)] sm:w-96 bg-white dark:bg-brand-dark rounded-xl shadow-2xl z-50 border border-gray-200 dark:border-white/10 max-h-[70vh] sm:max-h-[500px] flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-white/10">
        <h3 className="font-semibold text-sm">Notifications</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            No notifications yet. Start a quiz to get going!
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {notifications.map((item, idx) => (
              <li key={item.activity_id || idx} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5 shrink-0">{getIcon(item.activity_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        item.activity_type === 'battle_won' ? 'bg-green-500/20 text-green-400' :
                        item.activity_type === 'battle_lost' ? 'bg-red-500/20 text-red-400' :
                        'bg-indigo-500/20 text-primary-light'
                      }`}>
                        {getLabel(item.activity_type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.title}</p>
                    {item.score && (() => {
                      const parts = item.score.split('/');
                      const correct = parseInt(parts[0], 10);
                      const total = parseInt(parts[1], 10);
                      const pct = total > 0 ? Math.round((correct / total) * 100) : null;
                      return (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">Score: {item.score}</span>
                          {pct !== null && (
                            <span className={`text-xs font-semibold ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              ({pct}%)
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <p className="text-xs text-gray-400 mt-1">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default NotificationsPanel;
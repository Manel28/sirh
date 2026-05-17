import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

export default function NotificationsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications(user.id);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="Notifications">
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border shadow p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              Notifications
            </h3>
            <p className="text-slate-500 mt-2">
              You have {unreadCount} unread notification(s).
            </p>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 rounded-xl bg-[#12396b] text-white disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-100 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border shadow p-6 text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  notification.isRead
                    ? "bg-white border-slate-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <h4 className="font-bold text-slate-800">
                        {notification.title}
                      </h4>
                    </div>

                    <p className="mt-2 text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                      {notification.createdAt}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="px-3 py-2 rounded-xl bg-white border text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border shadow p-6 text-center text-slate-500">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function getNotificationIcon(type) {
  switch (type) {
    case "leave":
      return "🌴";
    case "document":
      return "📄";
    case "calendar":
      return "📅";
    default:
      return "🔔";
  }
}
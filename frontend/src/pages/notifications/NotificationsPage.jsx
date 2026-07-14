// Import des hooks React pour gérer les effets, les états et les calculs optimisés
import { useCallback, useEffect, useMemo, useState } from "react";

// Import du layout principal utilisé pour les pages connectées
import AppLayout from "../../layouts/AppLayout";

// Import des services API liés aux notifications
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";

/**
 * Page des notifications.
 *
 * Cette page permet à l'utilisateur connecté de :
 * - consulter ses notifications ;
 * - voir le nombre de notifications non lues ;
 * - marquer une notification comme lue ;
 * - marquer toutes les notifications comme lues.
 */
export default function NotificationsPage() {
  // Récupération de l'utilisateur connecté depuis le localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Liste des notifications récupérées depuis l'API
  const [notifications, setNotifications] = useState([]);

  // État indiquant si les notifications sont en cours de chargement
  const [loading, setLoading] = useState(true);

  // Message d'erreur affiché à l'utilisateur
  const [error, setError] = useState("");

  /**
   * Calcule le nombre de notifications non lues.
   *
   * useMemo évite de recalculer cette valeur
   * si la liste des notifications ne change pas.
   */
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  /**
   * Récupère les notifications de l'utilisateur connecté.
   */
  const fetchNotifications = useCallback(async () => {
    try {
      // Active l'état de chargement
      setLoading(true);

      // Réinitialise les anciennes erreurs
      setError("");

      // Si aucun utilisateur n'est connecté, on vide la liste
      if (!user?.id) {
        setNotifications([]);
        return;
      }

      // Appel API pour récupérer les notifications de l'utilisateur
      const data = await getNotifications();

      // Vérifie que la réponse est bien un tableau
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      // Affiche l'erreur dans la console pour le débogage
      console.error(err);

      // Affiche un message d'erreur à l'utilisateur
      setError("Failed to load notifications.");
    } finally {
      // Désactive le chargement dans tous les cas
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Charge les notifications lors de l'ouverture de la page.
   */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Marque une notification comme lue.
   *
   * @param {number} id Identifiant de la notification
   */
  const handleMarkAsRead = async (id) => {
    try {
      // Appel API pour marquer la notification comme lue
      await markNotificationAsRead(id);

      // Mise à jour locale pour éviter de recharger toute la page
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      console.error(err);
      setError("Failed to mark notification as read.");
    }
  };

  /**
   * Marque toutes les notifications de l'utilisateur comme lues.
   */
  const handleMarkAllAsRead = async () => {
    try {
      // Vérifie qu'un utilisateur est connecté
      if (!user?.id) return;

      // Appel API pour marquer toutes les notifications comme lues
      await markAllNotificationsAsRead();

      // Mise à jour locale de toutes les notifications
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to mark all notifications as read.");
    }
  };

  return (
    <AppLayout title="Notifications">
      <div className="space-y-6">
        {/* En-tête de la page avec compteur de notifications non lues */}
        <div className="bg-white rounded-3xl border shadow p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              Notifications
            </h3>

            <p className="text-slate-500 mt-2">
              You have {unreadCount} unread notification(s).
            </p>
          </div>

          {/* Bouton pour marquer toutes les notifications comme lues */}
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 rounded-xl bg-[#12396b] text-white disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Liste des notifications */}
        <div className="space-y-3">
          {loading ? (
            // Affichage pendant le chargement
            <div className="bg-white rounded-2xl border shadow p-6 text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            // Affichage des notifications
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
                      {/* Icône selon le type de notification */}
                      <span className="text-xl">
                        {getNotificationIcon(notification.type)}
                      </span>

                      {/* Titre de la notification */}
                      <h4 className="font-bold text-slate-800">
                        {notification.title}
                      </h4>
                    </div>

                    {/* Message de la notification */}
                    <p className="mt-2 text-slate-600">
                      {notification.message}
                    </p>

                    {/* Date de création */}
                    <p className="mt-3 text-xs text-slate-400">
                      {notification.createdAt}
                    </p>
                  </div>

                  {/* Bouton visible uniquement si la notification n'est pas encore lue */}
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
            // Message si aucune notification n'existe
            <div className="bg-white rounded-2xl border shadow p-6 text-center text-slate-500">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Retourne une icône selon le type de notification.
 *
 * Types gérés :
 * - leave : congé
 * - document : document
 * - calendar : calendrier
 * - default : notification générale
 */
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

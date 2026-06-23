// Import des hooks React pour gérer les effets, les états et les calculs optimisés
import { useEffect, useMemo, useState } from "react";

// Import du layout principal des pages connectées
import AppLayout from "../../layouts/AppLayout";

// Import des services API liés aux demandes de congé
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
} from "../../services/leaveService";

/**
 * Calcule le nombre de jours ouvrés entre deux dates.
 *
 * Les samedis et dimanches ne sont pas comptés.
 */
function countWorkingDays(startDateString, endDateString) {
  const start = new Date(startDateString);
  const end = new Date(endDateString);

  // Vérifie que les dates sont valides
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  // Si la date de fin est avant la date de début, on retourne 0
  if (end < start) return 0;

  let count = 0;
  const current = new Date(start);

  // Parcours de chaque jour de la période
  while (current <= end) {
    const day = current.getDay();

    // On compte uniquement les jours du lundi au vendredi
    if (day !== 0 && day !== 6) count += 1;

    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Formate une période de congé pour l'affichage.
 */
function formatPeriod(start, end) {
  return `From ${start} to ${end}`;
}

/**
 * Retourne les classes CSS correspondant au statut d'une demande.
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Rejected":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "Cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-orange-100 text-orange-700 border-orange-200";
  }
}

/**
 * Retourne le texte affiché selon le statut.
 */
function getStatusLabel(status) {
  switch (status) {
    case "Approved":
      return "Approved";
    case "Rejected":
      return "Rejected";
    case "Cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

/**
 * Page de gestion des congés.
 *
 * Pour un collaborateur :
 * - création d'une demande ;
 * - suivi de ses demandes ;
 * - annulation d'une demande en attente ;
 * - affichage du solde restant.
 *
 * Pour un administrateur/RH :
 * - consultation de toutes les demandes ;
 * - approbation ou refus des demandes des collaborateurs ;
 * - consultation du solde des collaborateurs.
 */
export default function LeavesPage() {
  // Récupération de l'utilisateur connecté
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Vérifie si l'utilisateur est administrateur/RH
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  // Contrôle l'ouverture de la modale de création
  const [showModal, setShowModal] = useState(false);

  // Message d'erreur affiché à l'utilisateur
  const [error, setError] = useState("");

  // Liste des demandes de congé
  const [leaves, setLeaves] = useState([]);

  // Solde de congés restant
  const [leaveBalance, setLeaveBalance] = useState(25);

  // État de chargement de la liste
  const [loading, setLoading] = useState(true);

  // État indiquant qu'une action est en cours
  const [submitting, setSubmitting] = useState(false);

  // Données du formulaire de demande de congé
  const [form, setForm] = useState({
    type: "",
    start: "",
    end: "",
  });

  // Date du jour au format YYYY-MM-DD pour empêcher les dates passées
  const today = new Date().toISOString().split("T")[0];

  /**
   * Charge les demandes de congé au premier affichage de la page.
   */
  useEffect(() => {
    fetchLeaves();
  }, []);

  /**
   * Calcule les statistiques des demandes selon leur statut.
   */
  const stats = useMemo(() => {
    return {
      pending: leaves.filter((l) => l.status === "Pending").length,
      approved: leaves.filter((l) => l.status === "Approved").length,
      rejected: leaves.filter((l) => l.status === "Rejected").length,
      cancelled: leaves.filter((l) => l.status === "Cancelled").length,
    };
  }, [leaves]);

  /**
   * Récupère les demandes de congé depuis l'API.
   */
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getLeaves();

      // La réponse peut être directement un tableau ou contenir une propriété leaves
      setLeaves(Array.isArray(data) ? data : data.leaves || []);

      // Mise à jour du solde de congés si l'API le retourne
      setLeaveBalance(data.leaveBalance ?? 25);
    } catch (err) {
      console.error(err);
      setError("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Réinitialise le formulaire de demande.
   */
  const resetForm = () => {
    setForm({
      type: "",
      start: "",
      end: "",
    });

    setError("");
  };

  /**
   * Ferme la modale de création et vide le formulaire.
   */
  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  /**
   * Vérifie les champs du formulaire avant l'envoi.
   */
  const validateForm = () => {
    if (!form.type || !form.start || !form.end) {
      return "Please fill in all required fields.";
    }

    if (form.start < today) {
      return "Start date cannot be in the past.";
    }

    if (form.end < today) {
      return "End date cannot be in the past.";
    }

    if (form.end < form.start) {
      return "End date cannot be earlier than start date.";
    }

    return "";
  };

  /**
   * Crée une nouvelle demande de congé.
   */
  const handleSubmit = async () => {
    // Vérification des champs avant appel API
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // Envoi de la demande à l'API
      const response = await createLeave({
        type: form.type,
        start: form.start,
        end: form.end,
      });

      // Mise à jour du solde si l'API le renvoie
      if (response?.leaveBalance !== undefined) {
        setLeaveBalance(response.leaveBalance);
      }

      // Recharge les demandes et ferme la modale
      await fetchLeaves();
      closeModal();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Annule une demande en attente appartenant à l'utilisateur connecté.
   */
  const handleCancelRequest = async (leaveId) => {
    try {
      setSubmitting(true);
      setError("");

      await updateLeaveStatus(leaveId, "Cancelled");

      await fetchLeaves();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to cancel leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Permet à l'administrateur/RH d'approuver ou de refuser une demande.
   */
  const handleAdminStatusUpdate = async (leaveId, status) => {
    try {
      setError("");

      const response = await updateLeaveStatus(leaveId, status);

      // Mise à jour du solde si l'approbation modifie les jours restants
      if (response?.leaveBalance !== undefined) {
        setLeaveBalance(response.leaveBalance);
      }

      await fetchLeaves();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update leave status."
      );
    }
  };

  return (
    <AppLayout title={isAdmin ? "Leave Requests" : "My Leaves"}>
      <div className="space-y-6">
        {/* En-tête principal de la page */}
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur">
                  {isAdmin ? "HR Leave Management" : "Personal Leave Space"}
                </div>

                <h1 className="mt-4 text-3xl font-extrabold text-white md:text-5xl">
                  {isAdmin ? "Leave Requests" : "My Leave Requests"}
                </h1>

                <p className="mt-3 max-w-2xl text-white/85">
                  {isAdmin
                    ? "View employee leave requests and create your own leave request."
                    : "Create and follow your own leave requests."}
                </p>
              </div>

              {/* Bouton d'ouverture de la modale */}
              <button
                onClick={() => {
                  setError("");
                  setShowModal(true);
                }}
                className="rounded-2xl bg-white px-5 py-3 font-bold text-[#12396b] shadow-lg transition hover:bg-blue-50"
              >
                New Leave Request
              </button>
            </div>
          </div>
        </section>

        {/* Message d'erreur hors modale */}
        {error && !showModal && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Cartes statistiques */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <StatusCard
            label="Remaining Leave"
            value={`${leaveBalance} day(s)`}
            className="bg-gradient-to-br from-blue-50 to-sky-100 text-blue-700 border-blue-200"
          />

          <StatusCard
            label="Pending"
            value={stats.pending}
            className="bg-gradient-to-br from-amber-50 to-orange-100 text-orange-700 border-orange-200"
          />

          <StatusCard
            label="Approved"
            value={stats.approved}
            className="bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-700 border-emerald-200"
          />

          <StatusCard
            label="Rejected"
            value={stats.rejected}
            className="bg-gradient-to-br from-rose-50 to-red-100 text-rose-700 border-rose-200"
          />

          <StatusCard
            label="Cancelled"
            value={stats.cancelled}
            className="bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 border-slate-200"
          />
        </section>

        {/* Tableau des demandes de congé */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50/40 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">
              {isAdmin ? "All Leave Requests" : "Request History"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "Review employee requests and check their remaining balance."
                : "Track your leave requests and remaining balance."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-gradient-to-r from-[#12396b] to-blue-600 text-white">
                <tr>
                  {/* Colonne employé visible uniquement pour les administrateurs */}
                  {isAdmin && (
                    <th className="p-4 text-sm font-semibold">Employee</th>
                  )}

                  <th className="p-4 text-sm font-semibold">Leave Type</th>
                  <th className="p-4 text-sm font-semibold">Period</th>
                  <th className="p-4 text-sm font-semibold">Duration</th>
                  <th className="p-4 text-sm font-semibold">
                    Leave Balance
                  </th>
                  <th className="p-4 text-sm font-semibold">Status</th>
                  <th className="p-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  // Ligne affichée pendant le chargement
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 6}
                      className="p-8 text-center font-semibold text-slate-500"
                    >
                      Loading leave requests...
                    </td>
                  </tr>
                ) : leaves.length > 0 ? (
                  // Affichage des demandes de congé
                  leaves.map((leave) => {
                    const isOwnLeave = leave.user?.id === user?.id;
                    const isPending = leave.status === "Pending";

                    // Solde affiché selon le propriétaire de la demande
                    const rowBalance = isOwnLeave
                      ? leaveBalance
                      : leave.user?.leaveBalance ?? 25;

                    return (
                      <tr
                        key={leave.id}
                        className="border-t border-slate-200 transition hover:bg-blue-50/40"
                      >
                        {/* Informations employé visibles côté admin */}
                        {isAdmin && (
                          <td className="p-4 font-semibold text-slate-800">
                            <div>
                              {leave.user?.firstName || leave.user?.lastName
                                ? `${leave.user?.firstName || ""} ${
                                    leave.user?.lastName || ""
                                  }`
                                : leave.user?.email || "Unknown"}

                              {isOwnLeave && (
                                <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                                  Me
                                </span>
                              )}
                            </div>

                            <div className="mt-1 text-xs font-bold text-blue-700">
                              Remaining leave:{" "}
                              {leave.user?.leaveBalance ?? 25} day(s)
                            </div>
                          </td>
                        )}

                        {/* Type de congé */}
                        <td className="p-4">{leave.type}</td>

                        {/* Période */}
                        <td className="p-4">
                          {formatPeriod(leave.start, leave.end)}
                        </td>

                        {/* Durée calculée en jours ouvrés */}
                        <td className="p-4">
                          {countWorkingDays(leave.start, leave.end)} day(s)
                        </td>

                        {/* Solde restant */}
                        <td className="p-4 font-bold text-blue-700">
                          {rowBalance} day(s)
                        </td>

                        {/* Statut */}
                        <td className="p-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                              leave.status
                            )}`}
                          >
                            {getStatusLabel(leave.status)}
                          </span>
                        </td>

                        {/* Actions disponibles selon le rôle et le statut */}
                        <td className="p-4">
                          {isAdmin && isPending && !isOwnLeave ? (
                            // L'admin peut approuver ou refuser les demandes des autres
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleAdminStatusUpdate(
                                    leave.id,
                                    "Approved"
                                  )
                                }
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  handleAdminStatusUpdate(
                                    leave.id,
                                    "Rejected"
                                  )
                                }
                                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                              >
                                Reject
                              </button>
                            </div>
                          ) : isOwnLeave && isPending ? (
                            // L'utilisateur peut annuler sa propre demande en attente
                            <button
                              onClick={() => handleCancelRequest(leave.id)}
                              disabled={submitting}
                              className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                            >
                              Cancel Request
                            </button>
                          ) : (
                            // Aucune action possible pour les autres cas
                            <span className="text-sm text-slate-400">
                              No action
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Message si aucune demande n'est disponible
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 6}
                      className="p-8 text-center text-slate-500"
                    >
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modale de création d'une demande */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  New Leave Request
                </h2>

                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              {/* Message d'erreur dans la modale */}
              {error && (
                <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Affichage du solde disponible */}
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                Remaining leave balance: {leaveBalance} day(s)
              </div>

              <div className="space-y-4">
                {/* Sélection du type de congé */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Leave Type *
                  </label>

                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select a leave type</option>
                    <option value="Paid Leave">Paid Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                    <option value="Special Event Leave">
                      Special Event Leave
                    </option>
                    <option value="JNT">JNT</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Half-day Morning">Half-day Morning</option>
                    <option value="Half-day Afternoon">
                      Half-day Afternoon
                    </option>
                    <option value="Other Absence">Other Absence</option>
                  </select>
                </div>

                {/* Sélection des dates */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Start Date *
                    </label>

                    <input
                      type="date"
                      min={today}
                      value={form.start}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          start: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      End Date *
                    </label>

                    <input
                      type="date"
                      min={form.start || today}
                      value={form.end}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          end: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                {/* Durée estimée de la demande */}
                {form.start && form.end && (
                  <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
                    Requested duration:{" "}
                    {countWorkingDays(form.start, form.end)} day(s)
                  </div>
                )}
              </div>

              {/* Boutons de la modale */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-[#12396b] to-blue-600 px-5 py-2 text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/**
 * Carte statistique affichant un statut de congé.
 */
function StatusCard({ label, value, className }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm ${className}`}>
      <p className="text-sm font-semibold opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
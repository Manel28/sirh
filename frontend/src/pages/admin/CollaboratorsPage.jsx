import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import {
  createCollaborator,
  deleteCollaborator,
  getCollaborators,
  updateCollaborator,
} from "../../services/userService";

/**
 * Page de gestion des collaborateurs.
 *
 * Cette page permet à l'administrateur/RH de :
 * - afficher tous les collaborateurs 
 * - créer un nouveau collaborateur 
 * - modifier les informations d'un collaborateur 
 * - supprimer un collaborateur 
 * - rechercher un collaborateur 
 * - gérer le rôle collaborateur ou administrateur/RH
 */
export default function CollaboratorsPage() {
  // Liste des collaborateurs récupérés depuis l'API
  const [collaborators, setCollaborators] = useState([]);

  // Indique si les données sont en cours de chargement
  const [loading, setLoading] = useState(true);

  // Indique si un formulaire est en cours d'envoi
  const [submitting, setSubmitting] = useState(false);

  // Stocke l'identifiant du collaborateur en cours de suppression
  const [deletingId, setDeletingId] = useState(null);

  // Message de succès affiché à l'utilisateur
  const [message, setMessage] = useState("");

  // Message d'erreur affiché à l'utilisateur
  const [error, setError] = useState("");

  // Valeur saisie dans la barre de recherche
  const [search, setSearch] = useState("");

  // Collaborateur actuellement sélectionné pour modification
  const [editingUser, setEditingUser] = useState(null);

  // État du formulaire de création d'un collaborateur
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    department: "",
    photo: "",
    isAdmin: false,
  });

  /**
   * Récupère la liste complète des collaborateurs depuis l'API.
   */
  const fetchCollaborators = async () => {
    try {
      // Active l'affichage du chargement
      setLoading(true);

      // Réinitialise les anciennes erreurs
      setError("");

      // Appel au service API
      const data = await getCollaborators();

      // Vérifie que la réponse est un tableau avant de mettre à jour l'état
      setCollaborators(Array.isArray(data) ? data : []);
    } catch (err) {
      // Affiche l'erreur dans la console pour le débogage
      console.error(err);

      // Affiche un message d'erreur à l'utilisateur
      setError("Failed to load collaborators.");
    } finally {
      // Désactive le chargement dans tous les cas
      setLoading(false);
    }
  };

  /**
   * Charge les collaborateurs automatiquement au montage du composant.
   */
  useEffect(() => {
    fetchCollaborators();
  }, []);

  /**
   * Filtre les collaborateurs selon la recherche saisie.
   */
  const filteredCollaborators = useMemo(() => {
    // Nettoie la recherche et la met en minuscules
    const query = search.trim().toLowerCase();

    // Si aucune recherche n'est saisie, on retourne toute la liste
    if (!query) return collaborators;

    // Filtre sur le nom complet, l'email, le poste ou le département
    return collaborators.filter((item) => {
      const fullName = [item.firstName, item.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        fullName.includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.jobTitle?.toLowerCase().includes(query) ||
        item.department?.toLowerCase().includes(query)
      );
    });
  }, [collaborators, search]);

  /**
   * Calcule les statistiques affichées en haut de page.
   */
  const stats = useMemo(() => {
    // Compte les utilisateurs ayant le rôle administrateur
    const admins = collaborators.filter((item) =>
      item.roles?.includes("ROLE_ADMIN")
    ).length;

    return {
      total: collaborators.length,
      collaborators: collaborators.length - admins,
      admins,
    };
  }, [collaborators]);

  /**
   * Réinitialise le formulaire de création.
   */
  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      jobTitle: "",
      department: "",
      photo: "",
      isAdmin: false,
    });
  };

  /**
   * Gère la création d'un collaborateur.
   */
  const handleSubmit = async (e) => {
    // Empêche le rechargement automatique de la page
    e.preventDefault();
    try {
      // Active l'état d'envoi
      setSubmitting(true);
      // Réinitialise les messages
      setMessage("");
      setError("");
      // Envoie les données du formulaire à l'API
      const response = await createCollaborator(form);
      // Affiche le message de succès
      setMessage(
        response.message ||
          "Collaborator created successfully. An email has been sent."
      );
      // Vide le formulaire
      resetForm();
      // Recharge la liste des collaborateurs
      await fetchCollaborators();
    } catch (err) {
      console.error(err);

      // Affiche le message d'erreur renvoyé par l'API si disponible
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create collaborator."
      );
    } finally {
      // Désactive l'état d'envoi
      setSubmitting(false);
    }
  };

  /**
   * Gère la modification d'un collaborateur existant.
   */
  const handleEdit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      // Envoie les nouvelles informations du collaborateur à l'API
      const response = await updateCollaborator(editingUser.id, {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        jobTitle: editingUser.jobTitle,
        department: editingUser.department,
        photo: editingUser.photo,
        isAdmin:
          editingUser.isAdmin === true ||
          editingUser.roles?.includes("ROLE_ADMIN"),
      });

      // Affiche le message de succès
      setMessage(response.message || "Collaborator updated successfully.");

      // Ferme la fenêtre de modification
      setEditingUser(null);

      // Recharge la liste
      await fetchCollaborators();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update collaborator."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Supprime un collaborateur après confirmation.
   *
   * @param {number} userId Identifiant du collaborateur à supprimer
   */
  const handleDelete = async (userId) => {
    // Demande confirmation avant suppression
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this collaborator?"
    );

    // Annule la suppression si l'utilisateur refuse
    if (!confirmDelete) return;

    try {
      // Stocke l'identifiant supprimé pour afficher l'état "Deleting..."
      setDeletingId(userId);
      setMessage("");
      setError("");

      // Appel API de suppression
      const response = await deleteCollaborator(userId);

      // Retire directement le collaborateur supprimé de la liste locale
      setCollaborators((prev) => prev.filter((item) => item.id !== userId));

      // Affiche un message de succès
      setMessage(response.message || "Collaborator deleted successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete collaborator."
      );
    } finally {
      // Réinitialise l'état de suppression
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="Collaborators Management">
      <div className="space-y-6">
        {/* En-tête de la page */}
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 px-6 py-8 md:px-8">
            <h1 className="text-3xl font-extrabold text-white">
              Collaborators Management
            </h1>
            <p className="mt-2 max-w-2xl text-white/85">
              Create, update, delete and manage collaborator accounts from one
              place.
            </p>
          </div>
        </section>

        {/* Cartes statistiques */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Total Accounts" value={stats.total} />
          <StatCard label="Collaborators" value={stats.collaborators} />
          <StatCard label="Admin / HR" value={stats.admins} />
        </section>

        {/* Affichage des messages de succès ou d'erreur */}
        {(message || error) && (
          <div className="space-y-3">
            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Formulaire de création */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] xl:col-span-1">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                Create Collaborator
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                The temporary password will be sent automatically by email.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Champ prénom */}
              <FormInput
                placeholder="First Name *"
                value={form.firstName}
                onChange={(value) => setForm({ ...form, firstName: value })}
              />

              {/* Champ nom */}
              <FormInput
                placeholder="Last Name *"
                value={form.lastName}
                onChange={(value) => setForm({ ...form, lastName: value })}
              />

              {/* Champ email */}
              <FormInput
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
              />

              {/* Champ poste */}
              <FormInput
                placeholder="Job Title *"
                value={form.jobTitle}
                onChange={(value) => setForm({ ...form, jobTitle: value })}
              />

              {/* Champ département */}
              <FormInput
                placeholder="Department *"
                value={form.department}
                onChange={(value) => setForm({ ...form, department: value })}
              />

              {/* Champ photo */}
              <FormInput
                placeholder="Photo URL"
                value={form.photo}
                onChange={(value) => setForm({ ...form, photo: value })}
              />

              {/* Case permettant de créer un compte administrateur/RH */}
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isAdmin}
                  onChange={(e) =>
                    setForm({ ...form, isAdmin: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#12396b]"
                />
                Create as HR / Admin
              </label>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-[#12396b] to-blue-600 px-5 py-3 font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Collaborator"}
              </button>
            </form>
          </div>

          {/* Tableau des collaborateurs */}
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)] xl:col-span-2">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50/40 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Collaborators List
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Search, review and manage existing accounts.
                </p>
              </div>

              {/* Barre de recherche */}
              <input
                type="text"
                placeholder="Search collaborator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-72"
              />
            </div>

            {/* Affichage du chargement ou du tableau */}
            {loading ? (
              <div className="p-8 text-center font-semibold text-slate-500">
                Loading collaborators...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-gradient-to-r from-[#12396b] to-blue-600 text-white">
                    <tr>
                      <th className="p-4 text-sm font-semibold">Photo</th>
                      <th className="p-4 text-sm font-semibold">First Name</th>
                      <th className="p-4 text-sm font-semibold">Last Name</th>
                      <th className="p-4 text-sm font-semibold">Email</th>
                      <th className="p-4 text-sm font-semibold">Role</th>
                      <th className="p-4 text-sm font-semibold">Job Title</th>
                      <th className="p-4 text-sm font-semibold">Department</th>
                      <th className="p-4 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCollaborators.length > 0 ? (
                      filteredCollaborators.map((item) => {
                        // Vérifie si l'utilisateur affiché est administrateur
                        const isAdmin = item.roles?.includes("ROLE_ADMIN");

                        return (
                          <tr
                            key={item.id}
                            className="border-t border-slate-200 transition hover:bg-blue-50/40"
                          >
                            {/* Photo ou initiale du collaborateur */}
                            <td className="p-4">
                              {item.photo ? (
                                <img
                                  src={item.photo}
                                  alt="Profile"
                                  className="h-11 w-11 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#12396b] to-orange-500 font-bold text-white">
                                  {item.firstName?.[0] ||
                                    item.email?.[0] ||
                                    "U"}
                                </div>
                              )}
                            </td>

                            {/* Prénom */}
                            <td className="p-4 font-semibold text-slate-800">
                              {item.firstName || "-"}
                            </td>

                            {/* Nom */}
                            <td className="p-4">{item.lastName || "-"}</td>

                            {/* Email */}
                            <td className="p-4 text-slate-600">
                              {item.email}
                            </td>

                            {/* Rôle */}
                            <td className="p-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  isAdmin
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {isAdmin ? "Admin / HR" : "Collaborator"}
                              </span>
                            </td>

                            {/* Poste */}
                            <td className="p-4">{item.jobTitle || "-"}</td>

                            {/* Département */}
                            <td className="p-4">{item.department || "-"}</td>

                            {/* Actions */}
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {/* Bouton modification */}
                                <button
                                  onClick={() =>
                                    setEditingUser({
                                      ...item,
                                      isAdmin:
                                        item.roles?.includes("ROLE_ADMIN"),
                                    })
                                  }
                                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                  Edit
                                </button>

                                {/* Les administrateurs sont protégés contre la suppression */}
                                {!isAdmin ? (
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    disabled={deletingId === item.id}
                                    className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                                  >
                                    {deletingId === item.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-400">
                                    Protected
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      // Message affiché si aucun collaborateur ne correspond
                      <tr>
                        <td
                          colSpan="8"
                          className="p-8 text-center text-slate-500"
                        >
                          No collaborators found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fenêtre modale de modification */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Edit Collaborator
            </h2>

            <form onSubmit={handleEdit} className="space-y-4">
              {/* Modification du prénom */}
              <FormInput
                placeholder="First Name *"
                value={editingUser.firstName || ""}
                onChange={(value) =>
                  setEditingUser({ ...editingUser, firstName: value })
                }
              />

              {/* Modification du nom */}
              <FormInput
                placeholder="Last Name *"
                value={editingUser.lastName || ""}
                onChange={(value) =>
                  setEditingUser({ ...editingUser, lastName: value })
                }
              />

              {/* Modification de l'email */}
              <FormInput
                type="email"
                placeholder="Email *"
                value={editingUser.email || ""}
                onChange={(value) =>
                  setEditingUser({ ...editingUser, email: value })
                }
              />

              {/* Modification du poste */}
              <FormInput
                placeholder="Job Title *"
                value={editingUser.jobTitle || ""}
                onChange={(value) =>
                  setEditingUser({ ...editingUser, jobTitle: value })
                }
              />

              {/* Modification du département */}
              <FormInput
                placeholder="Department *"
                value={editingUser.department || ""}
                onChange={(value) =>
                  setEditingUser({ ...editingUser, department: value })
                }
              />

              {/* Modification de la photo */}
              <FormInput
                placeholder="Photo URL"
                value={editingUser.photo || ""}
                onChange={(value) =>
                  setEditingUser({ ...editingUser, photo: value })
                }
              />

              {/* Modification du rôle RH/Admin */}
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editingUser.isAdmin}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      isAdmin: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#12396b]"
                />
                HR / Admin
              </label>

              {/* Boutons de la modale */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-gradient-to-r from-[#12396b] to-blue-600 px-5 py-3 font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/**
 * Champ de formulaire réutilisable.
 *
 * @param {string} type Type du champ input
 * @param {string} placeholder Texte affiché dans le champ
 * @param {string} value Valeur du champ
 * @param {Function} onChange Fonction appelée lors de la saisie
 */
function FormInput({ type = "text", placeholder, value, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  );
}

/**
 * Carte statistique utilisée pour afficher une valeur simple.
 *
 * @param {string} label Titre de la statistique
 * @param {number} value Valeur affichée
 */
function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-blue-50 to-white px-5 py-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#12396b]">{value}</p>
    </div>
  );
}
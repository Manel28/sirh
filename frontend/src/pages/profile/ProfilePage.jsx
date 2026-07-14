// Import des hooks React utilisés pour gérer les états, les effets et les calculs optimisés
import { useEffect, useMemo, useState } from "react";

// Import du layout principal utilisé pour les pages authentifiées
import AppLayout from "../../layouts/AppLayout";

// Import des services permettant de récupérer et modifier le profil utilisateur
import { getProfile, updateProfile } from "../../services/userService";

/**
 * Page Profil utilisateur.
 *
 * Cette page permet :
 * - d'afficher les informations personnelles ;
 * - de consulter son poste et son département ;
 * - de visualiser sa photo de profil ;
 * - de modifier son prénom, nom et photo ;
 * - de mettre à jour les informations stockées dans le localStorage.
 */
export default function ProfilePage() {
  // Récupération de l'utilisateur connecté depuis le localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  // Informations complètes du profil récupérées depuis l'API
  const [profile, setProfile] = useState(null);

  // État de chargement du profil
  const [loading, setLoading] = useState(true);

  // Message d'erreur
  const [error, setError] = useState("");

  // Message de succès après modification
  const [successMessage, setSuccessMessage] = useState("");

  // Contrôle l'ouverture de la fenêtre de modification
  const [showEditModal, setShowEditModal] = useState(false);

  // État indiquant si une sauvegarde est en cours
  const [saving, setSaving] = useState(false);

  // Données du formulaire d'édition
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    photoFile: null,
  });

  /**
   * Chargement du profil utilisateur.
   *
   * Le profil est récupéré à partir de l'identifiant
   * enregistré dans le localStorage.
   */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();

        // Stockage du profil récupéré
        setProfile(data);
      } catch (err) {
        console.error(err);

        // Affichage d'un message d'erreur
        setError("Failed to load profile.");
      } finally {
        // Désactivation du chargement
        setLoading(false);
      }
    };

    if (storedUser?.id) fetchProfile();
  }, [storedUser?.id]);

  /**
   * Nom complet affiché sur la fiche utilisateur.
   */
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "User";

  /**
   * Libellé du rôle affiché à l'écran.
   */
  const roleLabel = profile?.roles?.includes("ROLE_ADMIN")
    ? "Admin / HR"
    : "Collaborator";

  /**
   * Initiales affichées lorsqu'aucune photo n'est disponible.
   */
  const initials =
    `${profile?.firstName?.[0] || ""}${profile?.lastName?.[0] || ""}`.trim() ||
    profile?.email?.[0]?.toUpperCase() ||
    "U";

  /**
   * Prévisualisation de la photo sélectionnée.
   *
   * Si une nouvelle image est choisie,
   * elle est affichée immédiatement avant sauvegarde.
   */
  const previewPhoto = useMemo(() => {
    if (form.photoFile) return URL.createObjectURL(form.photoFile);

    return profile?.photo || null;
  }, [form.photoFile, profile?.photo]);

  /**
   * Ouvre la fenêtre de modification
   * et préremplit le formulaire.
   */
  const openEditModal = () => {
    setForm({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      photoFile: null,
    });

    setError("");
    setSuccessMessage("");

    setShowEditModal(true);
  };

  /**
   * Ferme la fenêtre de modification.
   */
  const closeEditModal = () => {
    setShowEditModal(false);
    setError("");
  };

  /**
   * Enregistre les modifications du profil.
   *
   * Les données sont envoyées via FormData
   * afin de permettre l'envoi d'une image.
   */
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      // Création du FormData pour l'upload
      const formData = new FormData();

      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);

      // Ajout de la photo si l'utilisateur en a sélectionné une
      if (form.photoFile) {
        formData.append("photoFile", form.photoFile);
      }

      // Appel API pour mettre à jour le profil
      const response = await updateProfile(formData);

      const updatedUser = response.user;

      // Mise à jour du profil affiché
      setProfile(updatedUser);

      /**
       * Mise à jour des données utilisateur
       * dans le localStorage.
       */
      const currentUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...(currentUser || {}),
          ...updatedUser,
        })
      );

      setSuccessMessage("Profile updated successfully.");

      setShowEditModal(false);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Affichage du squelette de chargement
   * pendant la récupération du profil.
   */
  if (loading) {
    return (
      <AppLayout title="Profile">
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </AppLayout>
    );
  }

  /**
   * Affichage d'une erreur si le profil
   * n'a pas pu être récupéré.
   */
  if (error && !profile) {
    return (
      <AppLayout title="Profile">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="space-y-6">

        {/* Message de confirmation après modification */}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Carte principale du profil */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">

          {/* Bannière décorative */}
          <div className="h-24 bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500" />

          <div className="px-6 pb-7 md:px-8">
            <div className="-mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

              {/* Informations principales */}
              <div className="flex flex-col gap-5 md:flex-row md:items-start">

                {/* Photo ou initiales */}
                {profile?.photo ? (
                  <img
                    src={profile.photo}
                    alt="Profile"
                    className="h-24 w-24 rounded-3xl border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-slate-100 text-3xl font-bold text-slate-700 shadow-lg">
                    {initials}
                  </div>
                )}

                {/* Informations utilisateur */}
                <div className="pt-12 md:pt-11">
                  <h1 className="text-3xl font-extrabold text-slate-900">
                    {fullName}
                  </h1>

                  <p className="mt-2 text-slate-500">
                    {profile?.jobTitle || "No job title specified"}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {profile?.department || "No department specified"}
                  </p>

                  {/* Badges rôle et statut */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {roleLabel}
                    </span>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton de modification */}
              <button
                onClick={openEditModal}
                className="mt-0 rounded-2xl bg-[#12396b] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0f2f58] md:mt-11"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* Informations détaillées */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] md:p-8">

          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your identity and professional details.
              </p>
            </div>

            <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-[#12396b] to-orange-500" />
          </div>

          {/* Tableau des informations */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow label="First Name" value={profile?.firstName} />
            <InfoRow label="Last Name" value={profile?.lastName} />
            <InfoRow label="Email Address" value={profile?.email} />
            <InfoRow label="Job Title" value={profile?.jobTitle} />
            <InfoRow label="Department" value={profile?.department} />
            <InfoRow label="Role" value={roleLabel} />
          </div>
        </section>
      </div>

      {/* Fenêtre modale de modification */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-profile-title" className="text-2xl font-bold text-slate-900">
                  Edit Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update your name and profile picture.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-2xl leading-none text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4">
              {previewPhoto ? (
                <img
                  src={previewPhoto}
                  alt="Profile preview"
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-slate-700">
                  {initials}
                </div>
              )}

              <label className="cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-900">
                Choose a photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      photoFile: event.target.files?.[0] || null,
                    }))
                  }
                />
              </label>
            </div>

            <div className="mt-6 grid gap-5">
              <FormField
                label="First Name"
                value={form.firstName}
                onChange={(firstName) => setForm((prev) => ({ ...prev, firstName }))}
              />
              <FormField
                label="Last Name"
                value={form.lastName}
                onChange={(lastName) => setForm((prev) => ({ ...prev, lastName }))}
              />
            </div>

            {error && (
              <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-xl bg-[#12396b] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

          {/* Formulaire d'édition */}
          {/* Même principe que les autres modales du projet :
             saisie prénom, nom, photo puis sauvegarde */}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/**
 * Composant affichant une information utilisateur.
 */
function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>

      <p className="mt-2 break-words text-base font-bold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

/**
 * Champ de formulaire réutilisable.
 */
function FormField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

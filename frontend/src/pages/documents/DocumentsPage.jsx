// Import des hooks React pour gérer les états, les effets et les calculs optimisés
import { useEffect, useMemo, useState } from "react";

// Import du layout principal de l'application
import AppLayout from "../../layouts/AppLayout";

// Service permettant de récupérer les collaborateurs
import { getCollaborators } from "../../services/userService";

// Services liés à la gestion des documents
import {
  deleteDocument,
  getDocuments,
  updateDocument,
  uploadDocument,
} from "../../services/documentService";

// Catégories disponibles pour classer les documents RH
const CATEGORIES = [
  "Payroll",
  "Administrative",
  "HR Policy",
  "Leaves",
  "Training",
  "Personal",
];

/**
 * Page de gestion des documents.
 *
 * Cette page permet :
 * - aux collaborateurs de consulter leurs documents ;
 * - aux administrateurs/RH d'ajouter, modifier et supprimer des documents ;
 * - de filtrer les documents par catégorie ;
 * - de rechercher un document ;
 * - de séparer les documents RH et les documents collaborateurs.
 */
export default function DocumentsPage() {
  // Récupération de l'utilisateur connecté
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Vérifie si l'utilisateur possède le rôle administrateur/RH
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  // Liste des documents récupérés depuis l'API
  const [documents, setDocuments] = useState([]);

  // Liste des collaborateurs utilisée dans le formulaire d'upload
  const [collaborators, setCollaborators] = useState([]);

  // États d'affichage et de traitement
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Messages utilisateur
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // États liés à la recherche et au filtre
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Contrôle l'ouverture de la modale d'upload
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Données du formulaire d'ajout de document
  const [form, setForm] = useState({
    title: "",
    category: "Payroll",
    userId: "",
    file: null,
  });

  /**
   * Chargement initial des documents.
   *
   * Si l'utilisateur est administrateur,
   * on charge aussi la liste des collaborateurs.
   */
  useEffect(() => {
    fetchDocuments();

    if (isAdmin) {
      fetchCollaborators();
    }
  }, [isAdmin]);

  /**
   * Récupère tous les documents depuis l'API.
   */
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDocuments();

      // Vérifie que la réponse est bien un tableau
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupère les collaborateurs.
   *
   * Cette fonction est utilisée par les administrateurs
   * pour associer un document à un utilisateur.
   */
  const fetchCollaborators = async () => {
    try {
      const data = await getCollaborators();
      setCollaborators(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Filtre les documents selon :
   * - la catégorie sélectionnée ;
   * - le texte recherché ;
   * - le titre ;
   * - le type de fichier ;
   * - l'email ou le nom du collaborateur.
   */
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCategory =
        selectedCategory === "All" || doc.category === selectedCategory;

      const query = searchTerm.trim().toLowerCase();

      const fullName = `${doc.user?.firstName || ""} ${doc.user?.lastName || ""}`
        .trim()
        .toLowerCase();

      const matchesSearch =
        !query ||
        doc.title?.toLowerCase().includes(query) ||
        doc.category?.toLowerCase().includes(query) ||
        doc.fileType?.toLowerCase().includes(query) ||
        doc.user?.email?.toLowerCase().includes(query) ||
        fullName.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [documents, searchTerm, selectedCategory]);

  /**
   * Documents appartenant à l'utilisateur connecté.
   */
  const myDocuments = useMemo(() => {
    return filteredDocuments.filter((doc) => doc.user?.id === user?.id);
  }, [filteredDocuments, user?.id]);

  /**
   * Documents appartenant aux autres collaborateurs.
   */
  const collaboratorDocuments = useMemo(() => {
    return filteredDocuments.filter((doc) => doc.user?.id !== user?.id);
  }, [filteredDocuments, user?.id]);

  /**
   * Statistiques affichées en haut de la page.
   */
  const stats = useMemo(() => {
    return {
      total: documents.length,
      available: documents.length,
      payroll: documents.filter((doc) => doc.category === "Payroll").length,
      training: documents.filter((doc) => doc.category === "Training").length,
    };
  }, [documents]);

  /**
   * Ouvre la modale d'ajout d'un document
   * et initialise le formulaire.
   */
  const openUploadModal = () => {
    setForm({
      title: "",
      category: "Payroll",
      userId: user?.id ? String(user.id) : "",
      file: null,
    });

    setError("");
    setSuccess("");
    setShowUploadModal(true);
  };

  /**
   * Ferme la modale d'ajout.
   */
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setError("");
  };

  /**
   * Envoie un nouveau document à l'API.
   *
   * Le fichier est envoyé avec FormData,
   * car il s'agit d'un upload de fichier PDF.
   */
  const handleUpload = async () => {
    if (!form.title || !form.category || !form.userId || !form.file) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("userId", form.userId);
      formData.append("file", form.file);

      await uploadDocument(formData);

      await fetchDocuments();

      setSuccess("Document uploaded successfully.");
      setShowUploadModal(false);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to upload document."
      );
    } finally {
      setUploading(false);
    }
  };

  /**
   * Ouvre la modale de modification
   * avec les informations du document sélectionné.
   */
  const openEditModal = (document) => {
    setEditingDocument({
      id: document.id,
      title: document.title || "",
      category: document.category || "Payroll",
      userId: document.user?.id ? String(document.user.id) : "",
    });

    setError("");
    setSuccess("");
  };

  /**
   * Ferme la modale de modification.
   */
  const closeEditModal = () => {
    setEditingDocument(null);
    setError("");
  };

  /**
   * Modifie les informations d'un document existant.
   *
   * Ici, seul le titre, la catégorie et l'utilisateur associé
   * sont modifiés. Le fichier PDF n'est pas remplacé.
   */
  const handleEdit = async () => {
    if (
      !editingDocument?.title ||
      !editingDocument?.category ||
      !editingDocument?.userId
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      await updateDocument(editingDocument.id, {
        title: editingDocument.title,
        category: editingDocument.category,
        userId: editingDocument.userId,
      });

      await fetchDocuments();

      setSuccess("Document updated successfully.");
      setEditingDocument(null);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update document."
      );
    } finally {
      setUploading(false);
    }
  };

  /**
   * Supprime un document après confirmation.
   */
  const handleDelete = async (documentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(documentId);
      setError("");
      setSuccess("");

      const response = await deleteDocument(documentId);

      // Mise à jour locale de la liste après suppression
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

      setSuccess(response.message || "Document deleted successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="Documents">
      <div className="space-y-8">
        {/* Message de succès */}
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
            {success}
          </div>
        )}

        {/* Message d'erreur hors modale */}
        {error && !showUploadModal && !editingDocument && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {/* En-tête de la page */}
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 px-6 py-8 md:px-8 md:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
                  {isAdmin ? "HR Documents Center" : "My Documents Space"}
                </div>

                <h3 className="mt-4 text-3xl font-extrabold text-white md:text-5xl">
                  Documents library
                </h3>

                <p className="mt-3 text-base text-white/80 md:text-lg">
                  {isAdmin
                    ? "Manage HR documents and collaborator files separately."
                    : "Access your payslips, contracts and HR documents in one place."}
                </p>
              </div>

              {/* Bouton d'ajout visible uniquement pour les administrateurs */}
              {isAdmin && (
                <button
                  onClick={openUploadModal}
                  className="rounded-2xl bg-white px-5 py-3 font-semibold text-[#12396b] shadow-lg transition hover:scale-[1.01] hover:bg-blue-50"
                >
                  Upload Document
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Cartes statistiques */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Documents" value={stats.total} tone="blue" icon="📁" />
          <StatCard label="Available" value={stats.available} tone="emerald" icon="✅" />
          <StatCard label="Payroll Files" value={stats.payroll} tone="orange" icon="💼" />
          <StatCard label="Training Files" value={stats.training} tone="amber" icon="🎓" />
        </section>

        {/* Zone de recherche et de filtre */}
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h4 className="text-xl font-bold text-slate-900">
                Browse documents
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Search and filter your files quickly
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Champ de recherche */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="min-w-[260px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              {/* Filtre par catégorie */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="All">All</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Affichage du chargement ou des sections de documents */}
        {loading ? (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm animate-pulse"
              >
                <div className="h-14 w-14 rounded-2xl bg-slate-200" />
                <div className="mt-5 h-6 w-40 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-32 rounded bg-slate-100" />
                <div className="mt-2 h-4 w-28 rounded bg-slate-100" />
              </div>
            ))}
          </section>
        ) : isAdmin ? (
          <>
            {/* Documents appartenant à l'utilisateur RH connecté */}
            <DocumentSection
              title="My HR Documents"
              description="Documents that belong to the connected HR user."
              documents={myDocuments}
              isAdmin={isAdmin}
              onEdit={openEditModal}
              onDelete={handleDelete}
              deletingId={deletingId}
              emptyText="No HR documents found."
            />

            {/* Documents des collaborateurs */}
            <DocumentSection
              title="Collaborator Documents"
              description="Documents that belong to collaborators and are managed by HR."
              documents={collaboratorDocuments}
              isAdmin={isAdmin}
              onEdit={openEditModal}
              onDelete={handleDelete}
              deletingId={deletingId}
              emptyText="No collaborator documents found."
            />
          </>
        ) : (
          // Documents visibles par un collaborateur
          <DocumentSection
            title="My Documents"
            description="Your personal HR documents."
            documents={filteredDocuments}
            isAdmin={isAdmin}
            onEdit={openEditModal}
            onDelete={handleDelete}
            deletingId={deletingId}
            emptyText="No documents found."
          />
        )}
      </div>

      {/* Modale d'ajout de document */}
      {showUploadModal && (
        <DocumentModal
          title="Upload Document"
          description="Add a document for HR or for a collaborator"
          error={error}
          form={form}
          setForm={setForm}
          user={user}
          collaborators={collaborators}
          uploading={uploading}
          onCancel={closeUploadModal}
          onSubmit={handleUpload}
          submitLabel="Upload Document"
          showFileInput={true}
        />
      )}

      {/* Modale de modification de document */}
      {editingDocument && (
        <DocumentModal
          title="Edit Document"
          description="Update document information"
          error={error}
          form={editingDocument}
          setForm={setEditingDocument}
          user={user}
          collaborators={collaborators}
          uploading={uploading}
          onCancel={closeEditModal}
          onSubmit={handleEdit}
          submitLabel="Save Changes"
          showFileInput={false}
        />
      )}
    </AppLayout>
  );
}

/**
 * Modale réutilisable pour ajouter ou modifier un document.
 */
function DocumentModal({
  title,
  description,
  error,
  form,
  setForm,
  user,
  collaborators,
  uploading,
  onCancel,
  onSubmit,
  submitLabel,
  showFileInput,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* En-tête de la modale */}
        <div className="bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 px-6 py-5">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="text-white/80 text-sm mt-1">{description}</p>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          {/* Message d'erreur dans la modale */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {/* Champ titre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Example: January Payslip"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
            />
          </div>

          {/* Catégorie et utilisateur associé */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sélection de catégorie */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection de l'utilisateur propriétaire du document */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employee / HR *
              </label>
              <select
                value={form.userId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, userId: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              >
                {user && (
                  <option value={user.id}>
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                      user.email}
                    {" (HR)"}
                  </option>
                )}

                {collaborators
                  .filter((item) => item.id !== user?.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {[item.firstName, item.lastName].filter(Boolean).join(" ") ||
                        item.email}
                      {item.roles?.includes("ROLE_ADMIN") ? " (HR)" : ""}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Champ fichier visible uniquement lors de l'ajout */}
          {showFileInput && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                PDF File *
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    file: e.target.files?.[0] || null,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              />
              <p className="text-xs text-slate-500 mt-2">PDF only.</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={uploading}
              className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={onSubmit}
              disabled={uploading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 text-white font-semibold hover:opacity-95 transition disabled:opacity-50"
            >
              {uploading ? "Saving..." : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section affichant une liste de documents.
 */
function DocumentSection({
  title,
  description,
  documents,
  isAdmin,
  onEdit,
  onDelete,
  deletingId,
  emptyText,
}) {
  return (
    <section className="space-y-5">
      {/* Titre de la section */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {/* Liste des cartes documents */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              deletingId={deletingId}
            />
          ))
        ) : (
          // Message si aucun document n'est trouvé
          <div className="col-span-full rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-700">{emptyText}</p>
            <p className="mt-2 text-sm text-slate-500">
              Try another keyword or category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Carte statistique des documents.
 */
function StatCard({ label, value, tone = "blue", icon = "•" }) {
  const toneClasses = {
    blue: "from-blue-50 to-white border-blue-100 text-blue-700",
    emerald: "from-emerald-50 to-white border-emerald-100 text-emerald-700",
    orange: "from-orange-50 to-white border-orange-100 text-orange-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
  };

  return (
    <div
      className={`rounded-[28px] border bg-gradient-to-br px-5 py-5 shadow-[0_10px_25px_rgba(15,23,42,0.05)] ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="mt-2 text-4xl font-extrabold">{value}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * Carte représentant un document.
 *
 * Elle affiche :
 * - le titre ;
 * - la catégorie ;
 * - l'utilisateur associé ;
 * - la date ;
 * - le type et la taille ;
 * - les actions disponibles.
 */
function DocumentCard({ document, isAdmin, onEdit, onDelete, deletingId }) {
  // URL complète du fichier stocké côté backend
  const fileUrl = `http://127.0.0.1:8001${document.filePath}`;

  return (
    <div className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
      {/* Icône et statut */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12396b] to-orange-500 text-2xl text-white shadow-lg">
          📄
        </div>

        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
          Available
        </span>
      </div>

      {/* Titre du document */}
      <h4 className="mt-5 text-xl font-extrabold text-slate-900 transition group-hover:text-blue-700">
        {document.title}
      </h4>

      {/* Informations du document */}
      <div className="mt-4 space-y-2 text-sm text-slate-500">
        <p>
          <span className="font-semibold text-slate-700">Category:</span>{" "}
          {document.category}
        </p>

        <p>
          <span className="font-semibold text-slate-700">Employee:</span>{" "}
          {[document.user?.firstName, document.user?.lastName]
            .filter(Boolean)
            .join(" ") || document.user?.email}
        </p>

        <p>
          <span className="font-semibold text-slate-700">Date:</span>{" "}
          {document.createdAt}
        </p>

        <p>
          <span className="font-semibold text-slate-700">Type:</span>{" "}
          {document.fileType}
        </p>

        <p>
          <span className="font-semibold text-slate-700">Size:</span>{" "}
          {document.fileSize}
        </p>
      </div>

      {/* Actions du document */}
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-[#12396b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2f58]"
        >
          Open
        </a>

        <a
          href={fileUrl}
          download
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Download
        </a>

        {/* Actions réservées à l'administrateur/RH */}
        {isAdmin && (
          <>
            <button
              onClick={() => onEdit(document)}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(document.id)}
              disabled={deletingId === document.id}
              className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {deletingId === document.id ? "Deleting..." : "Delete"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
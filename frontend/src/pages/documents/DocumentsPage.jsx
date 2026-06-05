import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { getCollaborators } from "../../services/userService";
import {
  deleteDocument,
  getDocuments,
  updateDocument,
  uploadDocument,
} from "../../services/documentService";

const CATEGORIES = [
  "Payroll",
  "Administrative",
  "HR Policy",
  "Leaves",
  "Training",
  "Personal",
];

export default function DocumentsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [documents, setDocuments] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Payroll",
    userId: "",
    file: null,
  });

  useEffect(() => {
    fetchDocuments();

    if (isAdmin) {
      fetchCollaborators();
    }
  }, [isAdmin]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const data = await getCollaborators();
      setCollaborators(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

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

  const myDocuments = useMemo(() => {
    return filteredDocuments.filter((doc) => doc.user?.id === user?.id);
  }, [filteredDocuments, user?.id]);

  const collaboratorDocuments = useMemo(() => {
    return filteredDocuments.filter((doc) => doc.user?.id !== user?.id);
  }, [filteredDocuments, user?.id]);

  const stats = useMemo(() => {
    return {
      total: documents.length,
      available: documents.length,
      payroll: documents.filter((doc) => doc.category === "Payroll").length,
      training: documents.filter((doc) => doc.category === "Training").length,
    };
  }, [documents]);

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

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setError("");
  };

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

  const closeEditModal = () => {
    setEditingDocument(null);
    setError("");
  };

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
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
            {success}
          </div>
        )}

        {error && !showUploadModal && !editingDocument && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

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

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Documents" value={stats.total} tone="blue" icon="📁" />
          <StatCard label="Available" value={stats.available} tone="emerald" icon="✅" />
          <StatCard label="Payroll Files" value={stats.payroll} tone="orange" icon="💼" />
          <StatCard label="Training Files" value={stats.training} tone="amber" icon="🎓" />
        </section>

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
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="min-w-[260px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

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
        <div className="bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 px-6 py-5">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="text-white/80 text-sm mt-1">{description}</p>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div>
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

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

function DocumentCard({ document, isAdmin, onEdit, onDelete, deletingId }) {
  const fileUrl = `http://127.0.0.1:8001${document.filePath}`;

  return (
    <div className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12396b] to-orange-500 text-2xl text-white shadow-lg">
          📄
        </div>

        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
          Available
        </span>
      </div>

      <h4 className="mt-5 text-xl font-extrabold text-slate-900 transition group-hover:text-blue-700">
        {document.title}
      </h4>

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
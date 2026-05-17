import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import {
  createCollaborator,
  deleteCollaborator,
  getCollaborators,
} from "../../services/userService";

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    department: "",
    photo: "",
    isAdmin: false,
  });

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCollaborators();
      setCollaborators(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load collaborators.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const filteredCollaborators = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return collaborators;

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

  const stats = useMemo(() => {
    const admins = collaborators.filter((item) =>
      item.roles?.includes("ROLE_ADMIN")
    ).length;

    return {
      total: collaborators.length,
      collaborators: collaborators.length - admins,
      admins,
    };
  }, [collaborators]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const response = await createCollaborator(form);

      setMessage(
        response.message ||
          "Collaborator created successfully. An email has been sent."
      );

      resetForm();
      await fetchCollaborators();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create collaborator."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this collaborator?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(userId);
      setMessage("");
      setError("");

      const response = await deleteCollaborator(userId);

      setCollaborators((prev) => prev.filter((item) => item.id !== userId));
      setMessage(response.message || "Collaborator deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete collaborator."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="Collaborators Management">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 px-6 py-8 md:px-8">
            <h1 className="text-3xl font-extrabold text-white">
              Collaborators Management
            </h1>
            <p className="mt-2 max-w-2xl text-white/85">
              Create collaborator accounts, send credentials automatically, and
              manage HR access from one place.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Total Accounts" value={stats.total} />
          <StatCard label="Collaborators" value={stats.collaborators} />
          <StatCard label="Admin / HR" value={stats.admins} />
        </section>

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
              <FormInput
                placeholder="First Name *"
                value={form.firstName}
                onChange={(value) => setForm({ ...form, firstName: value })}
              />

              <FormInput
                placeholder="Last Name *"
                value={form.lastName}
                onChange={(value) => setForm({ ...form, lastName: value })}
              />

              <FormInput
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
              />

              <FormInput
                placeholder="Job Title *"
                value={form.jobTitle}
                onChange={(value) => setForm({ ...form, jobTitle: value })}
              />

              <FormInput
                placeholder="Department *"
                value={form.department}
                onChange={(value) => setForm({ ...form, department: value })}
              />

              <FormInput
                placeholder="Photo URL"
                value={form.photo}
                onChange={(value) => setForm({ ...form, photo: value })}
              />

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

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-[#12396b] to-blue-600 px-5 py-3 font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Collaborator"}
              </button>
            </form>
          </div>

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

              <input
                type="text"
                placeholder="Search collaborator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-72"
              />
            </div>

            {loading ? (
              <div className="p-8 text-center font-semibold text-slate-500">
                Loading collaborators...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-gradient-to-r from-[#12396b] to-blue-600 text-white">
                    <tr>
                      <th className="p-4 text-sm font-semibold">Photo</th>
                      <th className="p-4 text-sm font-semibold">First Name</th>
                      <th className="p-4 text-sm font-semibold">Last Name</th>
                      <th className="p-4 text-sm font-semibold">Email</th>
                      <th className="p-4 text-sm font-semibold">Role</th>
                      <th className="p-4 text-sm font-semibold">Job Title</th>
                      <th className="p-4 text-sm font-semibold">Department</th>
                      <th className="p-4 text-sm font-semibold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCollaborators.length > 0 ? (
                      filteredCollaborators.map((item) => {
                        const isAdmin = item.roles?.includes("ROLE_ADMIN");

                        return (
                          <tr
                            key={item.id}
                            className="border-t border-slate-200 transition hover:bg-blue-50/40"
                          >
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

                            <td className="p-4 font-semibold text-slate-800">
                              {item.firstName || "-"}
                            </td>
                            <td className="p-4">{item.lastName || "-"}</td>
                            <td className="p-4 text-slate-600">
                              {item.email}
                            </td>
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
                            <td className="p-4">{item.jobTitle || "-"}</td>
                            <td className="p-4">{item.department || "-"}</td>

                            <td className="p-4">
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
                            </td>
                          </tr>
                        );
                      })
                    ) : (
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
    </AppLayout>
  );
}

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

function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-blue-50 to-white px-5 py-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#12396b]">{value}</p>
    </div>
  );
}
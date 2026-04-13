import { useEffect, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { createCollaborator, getCollaborators } from "../../services/userService";

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      setCollaborators(data);
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
        `Collaborator created successfully. Temporary password: ${response.temporaryPassword}`
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

  return (
    <AppLayout title="Collaborators Management">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow border p-6 xl:col-span-1">
          <h3 className="text-xl font-bold text-slate-800 mb-5">
            Create Collaborator
          </h3>

          {message && (
            <div className="mb-4 rounded-lg bg-green-100 text-green-700 px-4 py-3 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={(e) =>
                  setForm({ ...form, jobTitle: e.target.value })
                }
                className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Photo URL
              </label>
              <input
                type="text"
                value={form.photo}
                onChange={(e) =>
                  setForm({ ...form, photo: e.target.value })
                }
                placeholder="https://..."
                className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isAdmin}
                onChange={(e) =>
                  setForm({ ...form, isAdmin: e.target.checked })
                }
              />
              Create as RH / Admin
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#12396b] text-white px-5 py-3 rounded-lg hover:bg-[#0f2f58] transition disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Collaborator"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow border overflow-hidden xl:col-span-2">
          <div className="bg-[#12396b] text-white px-6 py-4">
            <h3 className="text-lg font-semibold">Collaborators List</h3>
          </div>

          {loading ? (
            <div className="p-6 text-slate-600">Loading collaborators...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-slate-700">Photo</th>
                    <th className="p-4 text-sm font-semibold text-slate-700">First Name</th>
                    <th className="p-4 text-sm font-semibold text-slate-700">Last Name</th>
                    <th className="p-4 text-sm font-semibold text-slate-700">Email</th>
                    <th className="p-4 text-sm font-semibold text-slate-700">Role</th>
                    <th className="p-4 text-sm font-semibold text-slate-700">Job Title</th>
                    <th className="p-4 text-sm font-semibold text-slate-700">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborators.length > 0 ? (
                    collaborators.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="p-4">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                              {item.firstName?.[0] || item.email?.[0] || "U"}
                            </div>
                          )}
                        </td>
                        <td className="p-4">{item.firstName || "-"}</td>
                        <td className="p-4">{item.lastName || "-"}</td>
                        <td className="p-4">{item.email}</td>
                        <td className="p-4">
                          {item.roles.includes("ROLE_ADMIN") ? "Admin / RH" : "Collaborator"}
                        </td>
                        <td className="p-4">{item.jobTitle || "-"}</td>
                        <td className="p-4">{item.department || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-500">
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
    </AppLayout>
  );
}
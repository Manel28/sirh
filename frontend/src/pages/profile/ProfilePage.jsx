import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { getProfileById, updateProfileById } from "../../services/userService";

export default function ProfilePage() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    photoFile: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfileById(storedUser.id);
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    if (storedUser?.id) fetchProfile();
  }, [storedUser?.id]);

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "User";

  const roleLabel = profile?.roles?.includes("ROLE_ADMIN")
    ? "Admin / HR"
    : "Collaborator";

  const initials =
    `${profile?.firstName?.[0] || ""}${profile?.lastName?.[0] || ""}`.trim() ||
    profile?.email?.[0]?.toUpperCase() ||
    "U";

  const previewPhoto = useMemo(() => {
    if (form.photoFile) return URL.createObjectURL(form.photoFile);
    return profile?.photo || null;
  }, [form.photoFile, profile?.photo]);

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

  const closeEditModal = () => {
    setShowEditModal(false);
    setError("");
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);

      if (form.photoFile) {
        formData.append("photoFile", form.photoFile);
      }

      const response = await updateProfileById(storedUser.id, formData);
      const updatedUser = response.user;

      setProfile(updatedUser);

      const currentUser = JSON.parse(localStorage.getItem("user") || "null");

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
        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
            {successMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
          <div className="h-24 bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500" />

          <div className="px-6 pb-7 md:px-8">
            <div className="-mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
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

              <button
                onClick={openEditModal}
                className="mt-0 rounded-2xl bg-[#12396b] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0f2f58] md:mt-11"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </section>

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

      {showEditModal && (
        <div className="fixed left-0 top-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Edit Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update your personal information.
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                label="First Name"
                value={form.firstName}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, firstName: value }))
                }
              />

              <FormField
                label="Last Name"
                value={form.lastName}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, lastName: value }))
                }
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Profile Photo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      photoFile: e.target.files?.[0] || null,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              {previewPhoto && (
                <img
                  src={previewPhoto}
                  alt="Preview"
                  className="h-24 w-24 rounded-2xl object-cover"
                />
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-2xl bg-[#12396b] px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#0f2f58] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

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
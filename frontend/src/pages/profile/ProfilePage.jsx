import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { getProfileById, updateProfileById } from "../../services/userService";

export default function ProfilePage() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (storedUser?.id) {
      fetchProfile();
    }
  }, [storedUser]);

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

  const previewPhoto = useMemo(() => {
    if (form.photoFile) {
      return URL.createObjectURL(form.photoFile);
    }
    return profile?.photo || null;
  }, [form.photoFile, profile?.photo]);

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
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "User";

  const roleLabel = profile?.roles?.includes("ROLE_ADMIN")
    ? "Admin / RH"
    : "Collaborator";

  const initials =
    `${profile?.firstName?.[0] || ""}${profile?.lastName?.[0] || ""}`.trim() ||
    profile?.email?.[0]?.toUpperCase() ||
    "U";

  if (loading) {
    return (
      <AppLayout title="Profile">
        <div className="space-y-6">
          <div className="rounded-[28px] overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="h-44 bg-slate-200 animate-pulse" />
            <div className="px-6 md:px-8 pb-8 -mt-14">
              <div className="animate-pulse flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="flex items-end gap-5">
                  <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white" />
                  <div className="space-y-3 pb-2">
                    <div className="h-7 w-48 bg-slate-200 rounded-full" />
                    <div className="h-5 w-36 bg-slate-200 rounded-full" />
                    <div className="h-8 w-28 bg-slate-200 rounded-full" />
                  </div>
                </div>
                <div className="h-28 w-full lg:w-72 bg-slate-100 rounded-3xl border border-slate-200" />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && !profile) {
    return (
      <AppLayout title="Profile">
        <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-sm">
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="space-y-6">
        {successMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-700">
            {successMessage}
          </div>
        )}

        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
          <div className="relative h-64 bg-gradient-to-r from-slate-900 via-blue-700 to-violet-600">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.30),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_24%)]" />
            <div className="absolute top-8 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-16 w-44 h-44 rounded-full bg-cyan-300/10 blur-3xl" />
          </div>

          <div className="px-6 md:px-8 pb-8 -mt-28 relative z-10">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="shrink-0">
                  {profile?.photo ? (
                    <div className="p-2 rounded-full bg-white shadow-2xl">
                      <img
                        src={profile.photo}
                        alt="Profile"
                        className="w-40 h-40 rounded-full object-cover border-[6px] border-white"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-white shadow-2xl border-[8px] border-white flex items-center justify-center text-5xl font-bold text-slate-700">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center rounded-full bg-white/90 text-[#12396b] px-4 py-1.5 text-sm font-semibold shadow-sm">
                      Employee Profile
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-4 py-1.5 text-sm font-semibold">
                      Active
                    </span>
                  </div>

                  <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {fullName}
                  </h3>

                  <p className="text-slate-600 mt-3 text-lg md:text-2xl font-semibold">
                    {profile?.jobTitle || "No job title specified"}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-4 py-2 text-sm font-semibold">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 xl:min-w-[460px] xl:justify-end">
                <MiniStatCard
                  title="Profile"
                  value={`${getProfileCompletion(profile)}%`}
                  tone="blue"
                />
                <MiniStatCard
                  title="Department"
                  value={profile?.department || "-"}
                  tone="violet"
                />
                <MiniStatCard
                  title="Access"
                  value={roleLabel}
                  tone="emerald"
                />
                <button
                  onClick={openEditModal}
                  className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm hover:shadow-md transition"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Action
                  </p>
                  <p className="text-sm font-bold mt-2 text-slate-800">
                    Edit Profile
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-7">
            <div>
              <h4 className="text-2xl font-bold text-slate-900">
                Personal Information
              </h4>
              <p className="text-slate-500 text-sm mt-1">
                Main identity and professional details
              </p>
            </div>

            <div className="h-2 w-28 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              label="First Name"
              value={profile?.firstName}
              tone="blue"
              icon="👤"
            />
            <InfoCard
              label="Last Name"
              value={profile?.lastName}
              tone="violet"
              icon="🪪"
            />
            <InfoCard
              label="Email Address"
              value={profile?.email}
              tone="cyan"
              icon="✉️"
            />
            <InfoCard
              label="Job Title"
              value={profile?.jobTitle}
              tone="amber"
              icon="💼"
            />
            <InfoCard
              label="Department"
              value={profile?.department}
              tone="emerald"
              icon="🏢"
            />
            <InfoCard
              label="Role"
              value={roleLabel}
              tone="rose"
              icon="⭐"
            />
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-blue-700 to-violet-600 px-6 py-5">
              <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
              <p className="text-white/80 text-sm mt-1">
                Update your personal information
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="First Name"
                  value={form.firstName}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, firstName: value }))
                  }
                  placeholder="Enter your first name"
                />

                <FormField
                  label="Last Name"
                  value={form.lastName}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, lastName: value }))
                  }
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profile Photo
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      photoFile: e.target.files?.[0] || null,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition bg-white"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Accepted formats: JPG, PNG, WEBP. Max 5 MB.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4">
                  Preview
                </p>

                <div className="flex items-center gap-4">
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600">
                      {(form.firstName?.[0] || form.lastName?.[0] || "U").toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {[form.firstName, form.lastName].filter(Boolean).join(" ") || "User"}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {profile?.jobTitle || "No job title specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#12396b] via-blue-600 to-violet-600 text-white font-semibold hover:opacity-95 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function FormField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
      />
    </div>
  );
}

function InfoCard({ label, value, tone = "blue", icon = "•" }) {
  const styles = {
    blue: "from-blue-50 to-white border-blue-100 text-blue-700",
    violet: "from-violet-50 to-white border-violet-100 text-violet-700",
    cyan: "from-cyan-50 to-white border-cyan-100 text-cyan-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
    emerald: "from-emerald-50 to-white border-emerald-100 text-emerald-700",
    rose: "from-rose-50 to-white border-rose-100 text-rose-700",
  };

  const toneStyle = styles[tone] || styles.blue;

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br px-5 py-5 transition hover:shadow-md ${toneStyle}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 mb-2">{label}</p>
          <p className="text-base font-bold text-slate-800 break-words">
            {value || "-"}
          </p>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({ title, value, tone = "blue" }) {
  const styles = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  };

  const toneStyle = styles[tone] || styles.blue;

  return (
    <div className={`rounded-3xl border px-4 py-4 ${toneStyle}`}>
      <p className="text-xs uppercase tracking-wide opacity-70">{title}</p>
      <p className="text-sm font-bold mt-2 break-words">{value}</p>
    </div>
  );
}

function getProfileCompletion(profile) {
  const fields = [
    profile?.firstName,
    profile?.lastName,
    profile?.email,
    profile?.jobTitle,
    profile?.department,
    profile?.photo,
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
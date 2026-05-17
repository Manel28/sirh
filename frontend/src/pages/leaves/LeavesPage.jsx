import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
} from "../../services/leaveService";

function countWorkingDays(startDateString, endDateString) {
  const start = new Date(startDateString);
  const end = new Date(endDateString);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }

  return count;
}

function formatPeriod(start, end) {
  return `From ${start} to ${end}`;
}

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

export default function LeavesPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "",
    start: "",
    end: "",
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchLeaves();
  }, []);

  const stats = useMemo(() => {
    return {
      pending: leaves.filter((l) => l.status === "Pending").length,
      approved: leaves.filter((l) => l.status === "Approved").length,
      rejected: leaves.filter((l) => l.status === "Rejected").length,
      cancelled: leaves.filter((l) => l.status === "Cancelled").length,
    };
  }, [leaves]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getLeaves();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      type: "",
      start: "",
      end: "",
    });
    setError("");
  };

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  const validateForm = () => {
    if (!form.type || !form.start || !form.end) {
      return "Please fill in all required fields.";
    }

    if (form.start < today) return "Start date cannot be in the past.";
    if (form.end < today) return "End date cannot be in the past.";
    if (form.end < form.start) {
      return "End date cannot be earlier than start date.";
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await createLeave({
        type: form.type,
        start: form.start,
        end: form.end,
      });

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

  const handleCancelRequest = async (leaveId) => {
    try {
      setSubmitting(true);
      setError("");

      await updateLeaveStatus(leaveId, "Cancelled");
      await fetchLeaves();
    } catch (err) {
      console.error(err);
      setError("Failed to cancel leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminStatusUpdate = async (leaveId, status) => {
    try {
      setError("");

      await updateLeaveStatus(leaveId, status);
      await fetchLeaves();
    } catch (err) {
      console.error(err);
      setError("Failed to update leave status.");
    }
  };

  return (
    <AppLayout title={isAdmin ? "Leave Requests" : "My Leaves"}>
      <div className="space-y-6">
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
                    ? "View, approve or reject employees leave requests."
                    : "Create and follow your own leave requests."}
                </p>
              </div>

              {!isAdmin && (
                <button
                  onClick={() => {
                    setError("");
                    setShowModal(true);
                  }}
                  className="rounded-2xl bg-white px-5 py-3 font-bold text-[#12396b] shadow-lg transition hover:bg-blue-50"
                >
                  New Leave Request
                </button>
              )}
            </div>
          </div>
        </section>

        {error && !showModal && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50/40 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">
              {isAdmin ? "All Leave Requests" : "Request History"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "Review and manage all employee requests."
                : "Track the status of your submitted requests."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-gradient-to-r from-[#12396b] to-blue-600 text-white">
                <tr>
                  {isAdmin && (
                    <th className="p-4 text-sm font-semibold">Employee</th>
                  )}
                  <th className="p-4 text-sm font-semibold">Leave Type</th>
                  <th className="p-4 text-sm font-semibold">Period</th>
                  <th className="p-4 text-sm font-semibold">Duration</th>
                  <th className="p-4 text-sm font-semibold">Status</th>
                  <th className="p-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      className="p-8 text-center font-semibold text-slate-500"
                    >
                      Loading leave requests...
                    </td>
                  </tr>
                ) : leaves.length > 0 ? (
                  leaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="border-t border-slate-200 transition hover:bg-blue-50/40"
                    >
                      {isAdmin && (
                        <td className="p-4 font-semibold text-slate-800">
                          {leave.user?.firstName || leave.user?.lastName
                            ? `${leave.user?.firstName || ""} ${
                                leave.user?.lastName || ""
                              }`
                            : leave.user?.email || "Unknown"}
                        </td>
                      )}

                      <td className="p-4">{leave.type}</td>

                      <td className="p-4">
                        {formatPeriod(leave.start, leave.end)}
                      </td>

                      <td className="p-4">
                        {countWorkingDays(leave.start, leave.end)} day(s)
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                            leave.status
                          )}`}
                        >
                          {getStatusLabel(leave.status)}
                        </span>
                      </td>

                      <td className="p-4">
                        {isAdmin && leave.status === "Pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleAdminStatusUpdate(leave.id, "Approved")
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                handleAdminStatusUpdate(leave.id, "Rejected")
                              }
                              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        ) : !isAdmin && leave.status === "Pending" ? (
                          <button
                            onClick={() => handleCancelRequest(leave.id)}
                            disabled={submitting}
                            className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                          >
                            Cancel Request
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
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

              {error && (
                <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Leave Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value })
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
                        setForm({ ...form, start: e.target.value })
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
                        setForm({ ...form, end: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>

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

function StatusCard({ label, value, className }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm ${className}`}>
      <p className="text-sm font-semibold opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
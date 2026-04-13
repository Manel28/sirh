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

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  if (end < start) {
    return 0;
  }

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();

    if (day !== 0 && day !== 6) {
      count += 1;
    }

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
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    case "Cancelled":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-yellow-100 text-yellow-700";
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
    reason: "",
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getLeaves();
      setLeaves(data);
    } catch (err) {
      setError("Failed to load leave requests.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const leaveSummary = useMemo(() => {
    const approvedLeaves = leaves.filter((leave) => leave.status === "Approved");

    const usedDays = approvedLeaves.reduce((total, leave) => {
      return total + countWorkingDays(leave.start, leave.end);
    }, 0);

    const remainingN1 = 5;
    const remainingN = Math.max(14 - usedDays, 0);
    const jnt = 5.48;

    return {
      remainingN1,
      remainingN,
      jnt,
    };
  }, [leaves]);

  const resetForm = () => {
    setForm({
      type: "",
      start: "",
      end: "",
      reason: "",
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
      setError("Failed to create leave request.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (leaveId) => {
    try {
      await updateLeaveStatus(leaveId, "Cancelled");
      await fetchLeaves();
    } catch (err) {
      setError("Failed to cancel leave request.");
      console.error(err);
    }
  };

  const handleAdminStatusUpdate = async (leaveId, status) => {
    try {
      await updateLeaveStatus(leaveId, status);
      await fetchLeaves();
    } catch (err) {
      setError("Failed to update leave status.");
      console.error(err);
    }
  };

  if (isAdmin) {
    return (
      <AppLayout title="Leave Requests">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-slate-800">
            All Leave Requests
          </h3>
          <p className="text-slate-500 mt-2">
            View and manage all employees leave requests
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-6 border">
            <p className="text-slate-600">Loading leave requests...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#12396b] text-white">
                <tr>
                  <th className="p-4 text-sm font-semibold">Employee</th>
                  <th className="p-4 text-sm font-semibold">Leave Type</th>
                  <th className="p-4 text-sm font-semibold">Period</th>
                  <th className="p-4 text-sm font-semibold">Duration</th>
                  <th className="p-4 text-sm font-semibold">Status</th>
                  <th className="p-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {leaves.length > 0 ? (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="border-t border-slate-200">
                      <td className="p-4">{leave.user?.email || "Unknown"}</td>
                      <td className="p-4">{leave.type}</td>
                      <td className="p-4">{formatPeriod(leave.start, leave.end)}</td>
                      <td className="p-4">
                        {countWorkingDays(leave.start, leave.end)} day(s)
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                            leave.status
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAdminStatusUpdate(leave.id, "Approved")
                            }
                            className="px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAdminStatusUpdate(leave.id, "Rejected")
                            }
                            className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500">
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Leave Requests / Absences">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800">
          My Leave Requests
        </h3>

        <button
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className="bg-[#12396b] text-white px-5 py-2 rounded-md hover:bg-[#0f2f58] transition"
        >
          New Leave Request
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-4 rounded-lg bg-red-100 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border overflow-hidden mb-8">
        <div className="bg-[#12396b] text-white px-6 py-3 text-sm font-semibold flex flex-wrap gap-8">
          <span>Remaining Leave N-1: {leaveSummary.remainingN1}</span>
          <span>Remaining Leave N: {leaveSummary.remainingN}</span>
          <span>JNT: {leaveSummary.jnt}</span>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-700">Leave Type</th>
              <th className="p-4 text-sm font-semibold text-slate-700">Period</th>
              <th className="p-4 text-sm font-semibold text-slate-700">Duration</th>
              <th className="p-4 text-sm font-semibold text-slate-700">Reason</th>
              <th className="p-4 text-sm font-semibold text-slate-700">Status</th>
              <th className="p-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-slate-500">
                  Loading leave requests...
                </td>
              </tr>
            ) : leaves.length > 0 ? (
              leaves.map((leave) => (
                <tr key={leave.id} className="border-t border-slate-200">
                  <td className="p-4">{leave.type}</td>
                  <td className="p-4">{formatPeriod(leave.start, leave.end)}</td>
                  <td className="p-4">
                    {countWorkingDays(leave.start, leave.end)} day(s)
                  </td>
                  <td className="p-4">-</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                        leave.status
                      )}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {leave.status === "Pending" ? (
                      <button
                        onClick={() => handleCancelRequest(leave.id)}
                        className="px-3 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition"
                      >
                        Cancel Request
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">
                        No action available
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-6 text-center text-slate-500">
                  No leave requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow border overflow-hidden xl:col-span-1">
          <div className="bg-[#12396b] text-white px-4 py-3 text-sm font-semibold">
            MY TEAM UPCOMING REQUESTS
          </div>

          <div className="p-4">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Period</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 text-slate-400" colSpan="3">
                    No team data available yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow border overflow-hidden xl:col-span-2">
          <div className="bg-[#12396b] text-white px-4 py-3 text-sm font-semibold">
            MY TEAM CALENDAR
          </div>

          <div className="p-4">
            <div className="mb-4 flex items-center gap-4 flex-wrap">
              <select className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                <option>April</option>
              </select>

              <select className="border border-slate-300 rounded-md px-3 py-2 text-sm">
                <option>2026</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2">Name</th>
                    {Array.from({ length: 10 }).map((_, index) => (
                      <th key={index} className="border p-2">
                        {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 font-medium">My Schedule</td>
                    <td className="border p-2 bg-blue-100 text-center">SS</td>
                    <td className="border p-2 bg-blue-100 text-center">SS</td>
                    <td className="border p-2 bg-slate-100 text-center">WK</td>
                    <td className="border p-2 bg-slate-100 text-center">WK</td>
                    <td className="border p-2 bg-cyan-100 text-center">TT</td>
                    <td className="border p-2 bg-cyan-100 text-center">TT</td>
                    <td className="border p-2 bg-green-100 text-center">TR</td>
                    <td className="border p-2 bg-orange-100 text-center">DP</td>
                    <td className="border p-2 bg-blue-100 text-center">SS</td>
                    <td className="border p-2 bg-blue-100 text-center">SS</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="px-2 py-1 rounded bg-blue-100">SS = On Site</span>
              <span className="px-2 py-1 rounded bg-cyan-100">TT = Remote Work</span>
              <span className="px-2 py-1 rounded bg-slate-100">WK = Weekend</span>
              <span className="px-2 py-1 rounded bg-green-100">TR = Training</span>
              <span className="px-2 py-1 rounded bg-orange-100">DP = Travel</span>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-lg">
            <div className="flex items-center justify-between mb-5">
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
              <div className="mb-4 rounded-lg bg-red-100 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Leave Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select a leave type</option>
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                  <option value="Special Event Leave">Special Event Leave</option>
                  <option value="JNT">JNT</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Half-day Morning">Half-day Morning</option>
                  <option value="Half-day Afternoon">Half-day Afternoon</option>
                  <option value="Other Absence">Other Absence</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                    className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    min={form.start || today}
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                    className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason
                </label>
                <textarea
                  rows="4"
                  placeholder="Specify if needed"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-[#12396b] text-white rounded-lg hover:bg-[#0f2f58] transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
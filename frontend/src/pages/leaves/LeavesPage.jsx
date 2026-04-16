import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
} from "../../services/leaveService";
import { getCollaborators } from "../../services/userService";
import {
  getWorkEntriesByMonth,
  saveWorkEntry,
} from "../../services/workEntryService";

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

function getPlanningCellClass(code, isWeekend) {
  if (isWeekend) {
    return "bg-slate-100 text-slate-500";
  }

  switch (code) {
    case "SS":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "TT":
      return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case "TR":
      return "bg-green-100 text-green-700 border-green-200";
    case "AB":
      return "bg-red-100 text-red-700 border-red-200";
    case "LV":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "WK":
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-white text-slate-400 border-slate-200";
  }
}

function getNextCode(currentCode, isWeekend) {
  if (isWeekend) return "WK";

  const cycle = ["", "SS", "TT", "TR", "AB"];
  const currentIndex = cycle.indexOf(currentCode || "");
  const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % cycle.length;
  return cycle[nextIndex];
}

export default function LeavesPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [teamMembers, setTeamMembers] = useState([]);
  const [teamEntries, setTeamEntries] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [savingCell, setSavingCell] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    type: "",
    start: "",
    end: "",
    reason: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const totalDays = new Date(year, month, 0).getDate();

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const date = new Date(year, month - 1, day);

      return {
        day,
        dateString: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      };
    });
  }, [selectedMonth]);

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      fetchTeamCalendar();
    }
  }, [isAdmin, selectedMonth]);

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

  const fetchTeamCalendar = async () => {
    try {
      setTeamLoading(true);

      const [usersData, entriesData] = await Promise.all([
        getCollaborators(),
        getWorkEntriesByMonth(selectedMonth),
      ]);

      const collaborators = (Array.isArray(usersData) ? usersData : []).filter(
        (item) => !item.roles?.includes("ROLE_ADMIN")
      );

      setTeamMembers(collaborators);
      setTeamEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setTeamLoading(false);
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

  const teamEntryMap = useMemo(() => {
    const map = {};
    teamEntries.forEach((entry) => {
      map[`${entry.userId}_${entry.date}`] = entry.code;
    });
    return map;
  }, [teamEntries]);

  const filteredTeamMembers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return teamMembers;

    return teamMembers.filter((member) => {
      const fullName = [member.firstName, member.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const email = (member.email || "").toLowerCase();

      return fullName.includes(query) || email.includes(query);
    });
  }, [teamMembers, searchTerm]);

  const teamStats = useMemo(() => {
    const todayDate = new Date();
    const selectedDateString = `${todayDate.getFullYear()}-${String(
      todayDate.getMonth() + 1
    ).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

    let onSite = 0;
    let remote = 0;
    let training = 0;
    let absence = 0;
    let leave = 0;

    filteredTeamMembers.forEach((member) => {
      const code = teamEntryMap[`${member.id}_${selectedDateString}`];

      switch (code) {
        case "SS":
          onSite += 1;
          break;
        case "TT":
          remote += 1;
          break;
        case "TR":
          training += 1;
          break;
        case "AB":
          absence += 1;
          break;
        case "LV":
          leave += 1;
          break;
        default:
          break;
      }
    });

    return {
      total: filteredTeamMembers.length,
      onSite,
      remote,
      training,
      absence,
      leave,
    };
  }, [filteredTeamMembers, teamEntryMap]);

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
      await fetchTeamCalendar();
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
      await fetchTeamCalendar();
    } catch (err) {
      setError("Failed to cancel leave request.");
      console.error(err);
    } finally {
      setSubmitting(false);
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

  const handleCalendarCellClick = async (memberId, dateString, isWeekend) => {
    if (isWeekend) return;

    const mapKey = `${memberId}_${dateString}`;
    const currentCode = teamEntryMap[mapKey] || "";
    const nextCode = getNextCode(currentCode, isWeekend);

    try {
      setSavingCell(mapKey);
      await saveWorkEntry({
        userId: memberId,
        date: dateString,
        code: nextCode === "WK" ? "" : nextCode,
      });
      await fetchTeamCalendar();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update planning."
      );
    } finally {
      setSavingCell("");
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

      <div className="bg-white rounded-3xl shadow border overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-[#12396b] via-blue-700 to-violet-600 text-white px-6 py-4 text-sm font-semibold flex flex-wrap gap-8">
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

      <div className="rounded-[30px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="bg-gradient-to-r from-[#12396b] via-blue-700 to-violet-600 text-white px-5 py-4">
          <h4 className="text-lg font-bold">MY TEAM CALENDAR</h4>
          <p className="text-white/80 text-sm mt-1">
            View and manage your team planning by month
          </p>
        </div>

        <div className="p-5 md:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <StatsCard label="Employees" value={teamStats.total} tone="blue" />
            <StatsCard label="On Site" value={teamStats.onSite} tone="cyan" />
            <StatsCard label="Remote" value={teamStats.remote} tone="emerald" />
            <StatsCard label="Training" value={teamStats.training} tone="green" />
            <StatsCard label="Absence" value={teamStats.absence} tone="red" />
            <StatsCard label="On Leave" value={teamStats.leave} tone="amber" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-300 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="border border-slate-300 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition min-w-[260px]"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold">
                SS = On Site
              </span>
              <span className="px-3 py-2 rounded-full bg-cyan-100 text-cyan-700 font-semibold">
                TT = Remote
              </span>
              <span className="px-3 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
                TR = Training
              </span>
              <span className="px-3 py-2 rounded-full bg-red-100 text-red-700 font-semibold">
                AB = Absence
              </span>
              <span className="px-3 py-2 rounded-full bg-amber-100 text-amber-700 font-semibold">
                LV = Leave
              </span>
              <span className="px-3 py-2 rounded-full bg-slate-100 text-slate-700 font-semibold">
                WK = Weekend
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="sticky left-0 z-20 border border-slate-200 bg-slate-100 p-3 min-w-[220px] text-left font-bold text-slate-700">
                    Name
                  </th>
                  {calendarDays.map((day) => (
                    <th
                      key={day.dateString}
                      className={`border border-slate-200 p-2 min-w-[52px] text-center ${
                        day.isWeekend ? "bg-slate-200" : "bg-slate-100"
                      }`}
                    >
                      <div className="font-bold text-slate-800">{day.day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamLoading ? (
                  <tr>
                    <td
                      className="border border-slate-200 p-6 text-center text-slate-500"
                      colSpan={calendarDays.length + 1}
                    >
                      Loading team calendar...
                    </td>
                  </tr>
                ) : filteredTeamMembers.length > 0 ? (
                  filteredTeamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition">
                      <td className="sticky left-0 z-10 border border-slate-200 bg-white p-3 font-medium">
                        <div className="font-semibold text-slate-800">
                          {[member.firstName, member.lastName]
                            .filter(Boolean)
                            .join(" ") || member.email}
                        </div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </td>

                      {calendarDays.map((day) => {
                        const mapKey = `${member.id}_${day.dateString}`;
                        const code =
                          teamEntryMap[mapKey] || (day.isWeekend ? "WK" : "");
                        const isSaving = savingCell === mapKey;

                        return (
                          <td
                            key={day.dateString}
                            onClick={() =>
                              handleCalendarCellClick(
                                member.id,
                                day.dateString,
                                day.isWeekend
                              )
                            }
                            className={`border border-slate-200 p-1 text-center font-semibold transition ${
                              isAdmin || day.isWeekend
                                ? "cursor-default"
                                : "cursor-pointer hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`rounded-xl px-2 py-2 text-xs border ${getPlanningCellClass(
                                code,
                                day.isWeekend
                              )} ${isSaving ? "opacity-50" : ""}`}
                              title={
                                day.isWeekend
                                  ? "Weekend"
                                  : "Click to change planning code"
                              }
                            >
                              {code || "—"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="border border-slate-200 p-6 text-center text-slate-500"
                      colSpan={calendarDays.length + 1}
                    >
                      No collaborator found for this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500">
            Tip: click a day cell to cycle through planning codes. Approved leave days remain automatically displayed as LV.
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

function StatsCard({ label, value, tone = "blue" }) {
  const toneClasses = {
    blue: "from-blue-50 to-white border-blue-100 text-blue-700",
    cyan: "from-cyan-50 to-white border-cyan-100 text-cyan-700",
    emerald: "from-emerald-50 to-white border-emerald-100 text-emerald-700",
    green: "from-green-50 to-white border-green-100 text-green-700",
    red: "from-red-50 to-white border-red-100 text-red-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
  };

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br px-4 py-4 shadow-sm ${toneClasses[tone]}`}
    >
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
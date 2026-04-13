import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { getCollaborators } from "../../services/userService";
import {
  getWorkEntriesByMonth,
  saveWorkEntry,
} from "../../services/workEntryService";

const CODE_OPTIONS = ["", "SS", "TT", "TR", "AB", "LV"];

export default function CalendarPage() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = storedUser?.roles?.includes("ROLE_ADMIN");
  const currentUserId = storedUser?.id;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCell, setSavingCell] = useState("");
  const [error, setError] = useState("");

  const days = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const count = new Date(year, month, 0).getDate();

    return Array.from({ length: count }, (_, index) => {
      const day = index + 1;
      const date = new Date(year, month - 1, day);
      return {
        label: String(day),
        dateString: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        weekDay: date.toLocaleDateString("en-GB", { weekday: "short" }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      };
    });
  }, [selectedMonth]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const entriesData = await getWorkEntriesByMonth(selectedMonth);
        setEntries(Array.isArray(entriesData) ? entriesData : []);

        if (isAdmin) {
          const usersData = await getCollaborators();
          const list = (Array.isArray(usersData) ? usersData : []).filter(
            (item) => !item.roles?.includes("ROLE_ADMIN")
          );
          setEmployees(list);
        } else {
          setEmployees([
            {
              id: storedUser?.id,
              firstName: storedUser?.firstName,
              lastName: storedUser?.lastName,
              email: storedUser?.email,
            },
          ]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load calendar.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      loadData();
    }
  }, [selectedMonth, isAdmin, currentUserId]);

  const entriesMap = useMemo(() => {
    const map = {};
    entries.forEach((entry) => {
      map[`${entry.userId}_${entry.date}`] = entry.code;
    });
    return map;
  }, [entries]);

  const handleChange = async (userId, date, code) => {
    try {
      setSavingCell(`${userId}_${date}`);
      setError("");

      await saveWorkEntry({ userId, date, code });

      setEntries((prev) => {
        const filtered = prev.filter(
          (item) => !(item.userId === userId && item.date === date)
        );

        if (!code) {
          return filtered;
        }

        return [...filtered, { userId, date, code }];
      });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to save entry."
      );
    } finally {
      setSavingCell("");
    }
  };

  return (
    <AppLayout title={isAdmin ? "HR Calendar" : "My Calendar"}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {isAdmin ? "Team Calendar" : "My Calendar"}
              </h3>
              <p className="text-slate-500 mt-2">
                {isAdmin
                  ? "Manage daily codes for each employee."
                  : "View your monthly planning."}
              </p>
            </div>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Legend code="SS" label="On Site" className="bg-blue-100 text-blue-700" />
          <Legend code="TT" label="Remote" className="bg-green-100 text-green-700" />
          <Legend code="TR" label="Training" className="bg-violet-100 text-violet-700" />
          <Legend code="AB" label="Absence" className="bg-red-100 text-red-700" />
          <Legend code="LV" label="Leave" className="bg-amber-100 text-amber-700" />
          <Legend code="WK" label="Weekend" className="bg-slate-200 text-slate-700" />
        </div>

        {error && (
          <div className="rounded-lg bg-red-100 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border shadow overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-slate-100 border border-slate-300 px-4 py-3 text-left min-w-[220px]">
                  Employee
                </th>

                {days.map((day) => (
                  <th
                    key={day.dateString}
                    className={`border border-slate-300 px-2 py-2 text-center min-w-[78px] ${
                      day.isWeekend ? "bg-slate-200" : "bg-slate-100"
                    }`}
                  >
                    <div className="font-bold text-slate-800">{day.label}</div>
                    <div className="text-xs text-slate-500">{day.weekDay}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={days.length + 1}
                    className="border border-slate-300 px-6 py-8 text-center text-slate-500"
                  >
                    Loading calendar...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={days.length + 1}
                    className="border border-slate-300 px-6 py-8 text-center text-slate-500"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="sticky left-0 z-10 bg-white border border-slate-300 px-4 py-3 min-w-[220px]">
                      <div className="font-semibold text-slate-800">
                        {[employee.firstName, employee.lastName]
                          .filter(Boolean)
                          .join(" ") || employee.email}
                      </div>
                      <div className="text-xs text-slate-500">{employee.email}</div>
                    </td>

                    {days.map((day) => {
                      const mapKey = `${employee.id}_${day.dateString}`;
                      const code = entriesMap[mapKey] || "";
                      const weekendCode = day.isWeekend ? "WK" : "";

                      return (
                        <td
                          key={day.dateString}
                          className={`border border-slate-300 px-1 py-1 text-center ${
                            day.isWeekend ? "bg-slate-50" : "bg-white"
                          }`}
                        >
                          {isAdmin ? (
                            day.isWeekend ? (
                              <div className="rounded px-2 py-2 text-xs font-bold bg-slate-200 text-slate-700">
                                WK
                              </div>
                            ) : (
                              <select
                                value={code}
                                onChange={(e) =>
                                  handleChange(employee.id, day.dateString, e.target.value)
                                }
                                disabled={savingCell === mapKey}
                                className={`w-full rounded px-2 py-2 text-xs font-bold border ${getCellClass(
                                  code
                                )}`}
                              >
                                {CODE_OPTIONS.map((option) => (
                                  <option key={option || "empty"} value={option}>
                                    {option || "—"}
                                  </option>
                                ))}
                              </select>
                            )
                          ) : (
                            <div
                              className={`rounded px-2 py-2 text-xs font-bold ${
                                day.isWeekend ? "bg-slate-200 text-slate-700" : getCellClass(code)
                              }`}
                            >
                              {day.isWeekend ? weekendCode : code || "—"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Legend({ code, label, className }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 font-semibold ${className}`}>
      <span>{code}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

function getCellClass(code) {
  switch (code) {
    case "SS":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "TT":
      return "bg-green-100 text-green-700 border-green-200";
    case "TR":
      return "bg-violet-100 text-violet-700 border-violet-200";
    case "AB":
      return "bg-red-100 text-red-700 border-red-200";
    case "LV":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-white text-slate-700 border-slate-300";
  }
}
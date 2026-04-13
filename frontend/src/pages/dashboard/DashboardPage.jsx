import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { useNavigate } from "react-router-dom";
import { getLeaves } from "../../services/leaveService";
import { getCollaborators } from "../../services/userService";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [leaves, setLeaves] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const firstName = user?.firstName || "User";
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.trim() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);

        const leavesData = await getLeaves();
        setLeaves(Array.isArray(leavesData) ? leavesData : []);

        if (isAdmin) {
          const usersData = await getCollaborators();
          setCollaborators(Array.isArray(usersData) ? usersData : []);
        }
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = formatDateLocal(today);

    if (!isAdmin) {
      const pendingRequests = leaves.filter(
        (leave) => leave.status === "Pending"
      ).length;

      const approvedLeaves = leaves.filter(
        (leave) => leave.status === "Approved"
      );

      const approvedCount = approvedLeaves.length;

      const usedDays = approvedLeaves.reduce((total, leave) => {
        return total + countWorkingDays(leave.start, leave.end);
      }, 0);

      const remainingLeave = Math.max(25 - usedDays, 0);

      const upcomingApproved = approvedLeaves
        .filter((leave) => leave.start >= todayStr)
        .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

      return {
        pendingRequests,
        approvedCount,
        remainingLeave,
        nextApprovedLeave: upcomingApproved
          ? `${formatShortDate(upcomingApproved.start)} → ${formatShortDate(
              upcomingApproved.end
            )}`
          : "No upcoming leave",
      };
    }

    const pendingRequests = leaves.filter(
      (leave) => leave.status === "Pending"
    ).length;

    const rejectedRequests = leaves.filter(
      (leave) => leave.status === "Rejected"
    ).length;

    const approvedRequests = leaves.filter(
      (leave) => leave.status === "Approved"
    ).length;

    const employeesCount = collaborators.filter(
      (item) => !item.roles?.includes("ROLE_ADMIN")
    ).length;

    return {
      employeesCount,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    };
  }, [isAdmin, leaves, collaborators]);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="relative bg-gradient-to-r from-slate-900 via-blue-700 to-violet-600 px-6 py-10 md:px-8 md:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_24%)]" />
            <div className="absolute top-4 right-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
                  {isAdmin ? "HR Dashboard" : "Employee Dashboard"}
                </div>

                <h3 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                  Welcome back, {firstName}
                </h3>

                <p className="mt-3 max-w-xl text-base text-white/80 md:text-lg">
                  {isAdmin
                    ? "Manage employees, review leave requests, and keep your HR space organized."
                    : "Access your leaves, calendar, and HR documents from one place."}
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-xl">
                {user?.photo ? (
                  <img
                    src={
                      user.photo.startsWith("http")
                        ? user.photo
                        : `http://127.0.0.1:8000/${user.photo}`
                    }
                    alt="Profile"
                    className="h-20 w-20 rounded-2xl object-cover border-4 border-white/50 shadow-lg"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white border border-white/20">
                    {initials}
                  </div>
                )}

                <div>
                  <p className="text-sm text-white/70">Signed in as</p>
                  <p className="text-lg font-bold text-white">{fullName}</p>
                  <p className="text-sm text-white/80">
                    {isAdmin ? "Admin / RH" : "Collaborator"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] animate-pulse"
              >
                <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-200" />
                <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
                <div className="mb-3 h-8 w-20 rounded bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-100" />
              </div>
            ))
          ) : isAdmin ? (
            <>
              <StatCard
                title="Employees"
                value={stats.employeesCount}
                subtitle="Active collaborators"
                icon="👥"
                accent="from-blue-600 to-cyan-500"
              />
              <StatCard
                title="Pending Requests"
                value={stats.pendingRequests}
                subtitle="Waiting for validation"
                icon="⏳"
                accent="from-amber-500 to-orange-500"
              />
              <StatCard
                title="Approved Requests"
                value={stats.approvedRequests}
                subtitle="Validated leave requests"
                icon="✅"
                accent="from-emerald-600 to-teal-500"
              />
              <StatCard
                title="Rejected Requests"
                value={stats.rejectedRequests}
                subtitle="Rejected so far"
                icon="❌"
                accent="from-violet-600 to-pink-500"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Pending Requests"
                value={stats.pendingRequests}
                subtitle="Still waiting for response"
                icon="⏳"
                accent="from-amber-500 to-orange-500"
              />
              <StatCard
                title="Approved Leaves"
                value={stats.approvedCount}
                subtitle="Validated leave requests"
                icon="✅"
                accent="from-emerald-600 to-teal-500"
              />
              <StatCard
                title="Remaining Leave"
                value={stats.remainingLeave}
                subtitle="Estimated remaining days"
                icon="🌴"
                accent="from-blue-600 to-cyan-500"
              />
              <StatCard
                title="Next Leave"
                value={stats.nextApprovedLeave}
                subtitle="Your next approved period"
                icon="📅"
                accent="from-violet-600 to-pink-500"
                compact
              />
            </>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isAdmin ? (
            <>
              <DashboardCard
                title="Leave Requests"
                description="Review and manage all employee leave requests."
                icon="🗂️"
                accent="from-blue-600 to-cyan-500"
                badge="HR"
                onClick={() => navigate("/leaves")}
              />

              <DashboardCard
                title="Calendar"
                description="View the HR calendar and team planning."
                icon="📅"
                accent="from-violet-600 to-fuchsia-500"
                badge="Planning"
                onClick={() => navigate("/calendar")}
              />

              <DashboardCard
                title="Employees"
                description="Access employee information and management tools."
                icon="👥"
                accent="from-emerald-600 to-teal-500"
                badge="People"
                onClick={() => navigate("/employees")}
              />
            </>
          ) : (
            <>
              <DashboardCard
                title="My Calendar"
                description="View your personal work and leave calendar."
                icon="🗓️"
                accent="from-blue-600 to-cyan-500"
                badge="Schedule"
                onClick={() => navigate("/calendar")}
              />

              <DashboardCard
                title="My Leaves"
                description="Track your leave requests and their status."
                icon="🌴"
                accent="from-violet-600 to-pink-500"
                badge="Requests"
                onClick={() => navigate("/leaves")}
              />

              <DashboardCard
                title="My Documents"
                description="Access your HR documents and files."
                icon="📄"
                accent="from-amber-500 to-orange-500"
                badge="Files"
                onClick={() => navigate("/documents")}
              />
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, subtitle, icon, accent, compact = false }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent}`} />

      <div className="mb-4 flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-xl shadow-lg`}
        >
          {icon}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p
        className={`mt-2 break-words font-extrabold text-slate-900 ${
          compact ? "text-lg leading-7" : "text-4xl"
        }`}
      >
        {value ?? "-"}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p>
    </div>
  );
}

function DashboardCard({ title, description, icon, accent, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)]"
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent}`} />

      <div className="mb-5 flex items-start justify-between gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-2xl shadow-lg`}
        >
          <span>{icon}</span>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {badge}
        </span>
      </div>

      <h3 className="text-2xl font-extrabold text-slate-900 transition group-hover:text-blue-700">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>

      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="transition group-hover:translate-x-1">Open section</span>
        <span>→</span>
      </div>
    </button>
  );
}

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

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}
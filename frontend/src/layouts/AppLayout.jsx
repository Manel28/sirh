import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "../services/notificationService";

export default function AppLayout({ title, children }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Guest";

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (!user?.id) return;

      try {
        const data = await getNotifications(user.id);
        const count = Array.isArray(data)
          ? data.filter((item) => !item.isRead).length
          : 0;

        setUnreadNotifications(count);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnreadNotifications();
  }, [user?.id]);

  const goTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#0b2a55] text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1
              className="text-xl font-bold cursor-pointer shrink-0"
              onClick={() => goTo("/dashboard")}
            >
              HRIS
            </h1>

            <nav className="hidden lg:flex items-center gap-5 text-sm">
              <NavButton onClick={() => goTo("/dashboard")}>Dashboard</NavButton>

              <NavButton onClick={() => goTo("/leaves")}>
                {isAdmin ? "Leave Requests" : "My Leaves"}
              </NavButton>

              <NavButton onClick={() => goTo("/calendar")}>Calendar</NavButton>

              <NavButton onClick={() => goTo("/documents")}>Documents</NavButton>

              <NavButton onClick={() => goTo("/profile")}>Profile</NavButton>

              <button
                onClick={() => goTo("/notifications")}
                className="relative hover:text-blue-200 transition"
                title="Notifications"
              >
                🔔
                {unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {isAdmin && (
                <button
                  onClick={() => goTo("/admin/collaborators")}
                  className="bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition font-semibold"
                >
                  Collaborators
                </button>
              )}
            </nav>

            <div className="hidden sm:flex items-center gap-4 text-sm">
              <span className="font-medium max-w-[180px] truncate">
                {fullName}
              </span>

              <button
                onClick={handleLogout}
                className="text-red-300 hover:text-red-200 transition"
              >
                Logout
              </button>
            </div>

            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="lg:hidden rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/20 transition"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>

          {menuOpen && (
            <div className="lg:hidden mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <span className="text-sm font-semibold truncate">
                  {fullName}
                </span>

                <button
                  onClick={handleLogout}
                  className="text-sm text-red-300 font-semibold"
                >
                  Logout
                </button>
              </div>

              <nav className="grid gap-2 text-sm">
                <MobileButton onClick={() => goTo("/dashboard")}>
                  Dashboard
                </MobileButton>

                <MobileButton onClick={() => goTo("/leaves")}>
                  {isAdmin ? "Leave Requests" : "My Leaves"}
                </MobileButton>

                <MobileButton onClick={() => goTo("/calendar")}>
                  Calendar
                </MobileButton>

                <MobileButton onClick={() => goTo("/documents")}>
                  Documents
                </MobileButton>

                <MobileButton onClick={() => goTo("/profile")}>
                  Profile
                </MobileButton>

                <MobileButton onClick={() => goTo("/notifications")}>
                  Notifications{" "}
                  {unreadNotifications > 0 ? `(${unreadNotifications})` : ""}
                </MobileButton>

                {isAdmin && (
                  <MobileButton onClick={() => goTo("/admin/collaborators")}>
                    Collaborators
                  </MobileButton>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-6 sm:mb-8 break-words">
          {title}
        </h2>

        {children}
      </main>
    </div>
  );
}

function NavButton({ children, onClick }) {
  return (
    <button onClick={onClick} className="hover:text-blue-200 transition">
      {children}
    </button>
  );
}

function MobileButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl px-4 py-3 text-left font-semibold hover:bg-white/10 transition"
    >
      {children}
    </button>
  );
}
import { useNavigate } from "react-router-dom";

export default function AppLayout({ title, children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Guest";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#0b2a55] text-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1
              className="text-xl font-bold cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              HRIS
            </h1>

            <nav className="flex items-center gap-5 text-sm flex-wrap">
              <button
                onClick={() => navigate("/dashboard")}
                className="hover:text-blue-200 transition"
              >
                Dashboard
              </button>

              <button
                onClick={() => navigate("/leaves")}
                className="hover:text-blue-200 transition"
              >
                {isAdmin ? "Leave Requests" : "My Leaves"}
              </button>

              {isAdmin && (
                <button
                  onClick={() => navigate("/admin/collaborators")}
                  className="hover:text-blue-200 transition"
                >
                  Collaborators
                </button>
              )}

              <button
                onClick={() => navigate("/documents")}
                className="hover:text-blue-200 transition"
              >
                Documents
              </button>

              <button
                onClick={() => navigate("/profile")}
                className="hover:text-blue-200 transition"
              >
                Profile
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {user?.photo ? (
              <img
                src={user.photo}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-white/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </div>
            )}

            <span className="font-medium">{fullName}</span>

            <button
              onClick={handleLogout}
              className="text-red-300 hover:text-red-200 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-4xl font-bold text-slate-800 mb-8">{title}</h2>
        {children}
      </main>
    </div>
  );
}
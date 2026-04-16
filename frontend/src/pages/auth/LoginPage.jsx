import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await axios.post("http://127.0.0.1:8000/api/login", {
        email: form.email,
        password: form.password,
      });

      const user = response.data.user;

      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#12396b] to-violet-700 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 rounded-[36px] overflow-hidden shadow-[0_25px_80px_rgba(15,23,42,0.35)] border border-white/10 bg-white/10 backdrop-blur-xl">
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#0b2242] via-[#12396b] to-[#2563eb] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_24%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              HRIS Platform
            </div>

            <h1 className="mt-8 text-5xl font-extrabold leading-tight">
              Welcome back.
            </h1>

            <p className="mt-5 text-white/80 text-lg leading-8 max-w-md">
              Manage your HR tasks, leave requests, planning and employee data
              in one modern workspace.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <FeatureCard title="Leaves" text="Track and approve requests" />
            <FeatureCard title="Calendar" text="Manage team planning" />
            <FeatureCard title="Profiles" text="Access employee information" />
            <FeatureCard title="Dashboard" text="View key HR insights" />
          </div>
        </div>

        <div className="bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#12396b] to-violet-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                HR
              </div>

              <h2 className="mt-6 text-4xl font-extrabold text-slate-900">
                Sign in
              </h2>

              <p className="mt-3 text-slate-500">
                Enter your credentials to access your workspace.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#12396b] via-blue-600 to-violet-600 px-5 py-3.5 text-white font-bold shadow-lg transition hover:opacity-95 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4 text-sm text-slate-500">
              Press <span className="font-semibold text-slate-700">Enter</span>{" "}
              after typing your password to sign in directly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-white/75">{text}</p>
    </div>
  );
}
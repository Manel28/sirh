// Import du hook React permettant de gérer les états locaux du composant
import { useState } from "react";

// Import du hook permettant de rediriger l'utilisateur vers une autre page
import { useNavigate } from "react-router-dom";

// Import d'Axios pour envoyer les requêtes HTTP vers l'API Symfony
import axios from "axios";
import { API_BASE_URL } from "../../services/apiConfig";

// Import des icônes utilisées pour afficher ou masquer le mot de passe
import { Eye, EyeOff } from "lucide-react";

/**
 * Page de connexion de l'application.
 *
 * Cette page permet à l'utilisateur de :
 * - saisir son email et son mot de passe 
 * - envoyer ses identifiants à l'API 
 * - stocker les informations utilisateur dans le localStorage 
 * - être redirigé vers le changement de mot de passe si nécessaire 
 * - accéder au tableau de bord après authentification
 */
export default function LoginPage() {
  // Hook utilisé pour effectuer les redirections
  const navigate = useNavigate();

  // État contenant les champs du formulaire de connexion
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // État permettant d'afficher ou masquer le mot de passe
  const [showPassword, setShowPassword] = useState(false);

  // État indiquant si la connexion est en cours
  const [loading, setLoading] = useState(false);

  // Message d'erreur affiché en cas d'échec de connexion
  const [error, setError] = useState("");

  /**
   * Met à jour les champs du formulaire lors de la saisie.
   *
   * Le nom du champ HTML est utilisé pour modifier dynamiquement
   * la bonne propriété dans l'état form.
   */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /**
   * Gère la tentative de connexion.
   *
   * Étapes :
   * - empêche le rechargement de la page ;
   * - envoie l'email et le mot de passe à l'API ;
   * - récupère l'utilisateur connecté ;
   * - stocke l'utilisateur dans le localStorage ;
   * - redirige selon l'obligation ou non de changer le mot de passe.
   */
  const handleLogin = async (e) => {
    // Empêche le comportement par défaut du formulaire
    e.preventDefault();

    try {
      // Active l'état de chargement du bouton
      setLoading(true);

      // Réinitialise les erreurs précédentes
      setError("");

      // Envoi des identifiants à l'API Symfony
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: form.email,
        password: form.password,
      });

      // Récupération de l'utilisateur retourné par l'API
      const user = response.data.user;

      // Stockage de l'utilisateur connecté dans le navigateur
      localStorage.setItem("user", JSON.stringify(user));

      // Si le mot de passe temporaire doit être changé, redirection vers la page dédiée
      if (response.data.mustChangePassword || user.mustChangePassword) {
        navigate("/change-password");
      } else {
        // Sinon, l'utilisateur accède directement au tableau de bord
        navigate("/dashboard");
      }
    } catch (err) {
      // Affiche l'erreur dans la console pour le débogage
      console.error(err);

      // Affiche le message d'erreur renvoyé par l'API ou un message par défaut
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid email or password."
      );
    } finally {
      // Désactive l'état de chargement
      setLoading(false);
    }
  };

  return (
    // Conteneur principal de la page de connexion
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#12396b] to-violet-700 flex items-center justify-center px-4 py-10">
      {/* Carte principale divisée en deux parties sur grand écran */}
      <div className="w-full max-w-6xl grid lg:grid-cols-2 rounded-[36px] overflow-hidden shadow-[0_25px_80px_rgba(15,23,42,0.35)] border border-white/10 bg-white/10 backdrop-blur-xl">
        {/* Partie gauche : présentation de l'application, visible uniquement sur desktop */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#0b2242] via-[#12396b] to-[#2563eb] text-white">
          {/* Effet visuel décoratif en arrière-plan */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_24%)]" />

          {/* Texte de présentation */}
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              HRIS Platform
            </div>

            <h1 className="mt-8 text-5xl font-extrabold leading-tight">
              Welcome.
            </h1>

            <p className="mt-5 text-white/80 text-lg leading-8 max-w-md">
              Manage your HR tasks, leave requests, planning and employee data
              in one modern workspace.
            </p>
          </div>

          {/* Cartes de présentation des fonctionnalités */}
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <FeatureCard title="Leaves" text="Track and approve requests" />
            <FeatureCard title="Calendar" text="Manage team planning" />
            <FeatureCard title="Profiles" text="Access employee information" />
            <FeatureCard title="Dashboard" text="View key HR insights" />
          </div>
        </div>

        {/* Partie droite : formulaire de connexion */}
        <div className="bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="max-w-md mx-auto">
            {/* En-tête du formulaire */}
            <div className="mb-8">
              {/* Logo */}
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

            {/* Formulaire de connexion */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Affichage du message d'erreur */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Champ email */}
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

              {/* Champ mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    required
                  />

                  {/* Bouton permettant d'afficher ou masquer le mot de passe */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#12396b] via-blue-600 to-violet-600 px-5 py-3.5 text-white font-bold shadow-lg transition hover:opacity-95 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Message d'aide utilisateur */}
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

/**
 * Carte de présentation d'une fonctionnalité de l'application.
 *
 * @param {string} title Titre de la fonctionnalité
 * @param {string} text Description courte de la fonctionnalité
 */
function FeatureCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-white/75">{text}</p>
    </div>
  );
}

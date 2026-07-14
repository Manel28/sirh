// Import du hook React permettant de gérer l'état local du composant
import { useState } from "react";

// Import du hook permettant la navigation entre les pages
import { useNavigate } from "react-router-dom";

// Import d'Axios pour effectuer les requêtes HTTP vers l'API Symfony
import api from "../../services/api";

// Import des icônes utilisées pour afficher ou masquer le mot de passe
import { Eye, EyeOff } from "lucide-react";

/**
 * Page permettant à un utilisateur de modifier son mot de passe.
 *
 * Fonctionnalités :
 * - saisie d'un nouveau mot de passe
 * - confirmation du mot de passe
 * - vérification de la complexité
 * - affichage/masquage du mot de passe
 * - envoi des données à l'API Symfony
 * - redirection vers le dashboard après modification
 */
export default function ChangePasswordPage() {
  // Hook utilisé pour effectuer les redirections
  const navigate = useNavigate();

  // Récupération de l'utilisateur connecté depuis le localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // État contenant les données du formulaire
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Contrôle l'affichage du nouveau mot de passe
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Contrôle l'affichage du mot de passe de confirmation
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Message d'erreur affiché à l'utilisateur
  const [error, setError] = useState("");

  // Indique si la requête est en cours d'exécution
  const [loading, setLoading] = useState(false);

  /**
   * Expression régulière utilisée pour vérifier
   * la complexité du mot de passe.
   *
   * Conditions :
   * - minimum 8 caractères ;
   * - une minuscule ;
   * - une majuscule ;
   * - un chiffre ;
   * - un caractère spécial.
   */
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  /**
   * Met à jour les champs du formulaire lors de la saisie.
   *
   * @param {Event} e Événement déclenché lors de la saisie
   */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /**
   * Gère la soumission du formulaire.
   *
   * Étapes :
   * - vérifie que l'utilisateur est connecté ;
   * - vérifie la complexité du mot de passe ;
   * - vérifie la correspondance des deux mots de passe ;
   * - envoie les données à l'API ;
   * - met à jour les informations utilisateur ;
   * - redirige vers le dashboard.
   */
  const handleSubmit = async (e) => {
    // Empêche le rechargement automatique de la page
    e.preventDefault();

    // Vérifie qu'un utilisateur est connecté
    if (!user) {
      navigate("/");
      return;
    }

    // Vérification de la complexité du mot de passe
    if (!strongPasswordRegex.test(form.newPassword)) {
      setError(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    // Vérification que les deux mots de passe correspondent
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Active l'état de chargement
      setLoading(true);

      // Réinitialise les erreurs précédentes
      setError("");

      // Envoi de la requête à l'API Symfony
      const response = await api.post("/change-password", {
        newPassword: form.newPassword,
      });

      // Mise à jour de l'utilisateur dans le localStorage
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirection vers le tableau de bord
      navigate("/dashboard");
    } catch (err) {
      // Affiche l'erreur dans la console
      console.error(err);

      // Affiche le message d'erreur renvoyé par l'API
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Error while changing password."
      );
    } finally {
      // Désactive le chargement
      setLoading(false);
    }
  };

  return (
    // Conteneur principal centré verticalement et horizontalement
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#12396b] to-violet-700 flex items-center justify-center px-4">

      {/* Carte contenant le formulaire */}
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl">

        {/* Logo de l'application */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#12396b] to-violet-600 text-white flex items-center justify-center text-xl font-bold">
          HR
        </div>

        {/* Titre de la page */}
        <h1 className="mt-6 text-3xl font-extrabold text-slate-900">
          Change password
        </h1>

        {/* Instructions utilisateur */}
        <p className="mt-3 text-slate-500">
          Your password must contain at least 8 characters, one uppercase letter,
          one lowercase letter, one number, and one special character.
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          {/* Affichage des erreurs */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Champ nouveau mot de passe */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              New password
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 pr-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />

              {/* Bouton afficher/masquer mot de passe */}
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Champ confirmation mot de passe */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 pr-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />

              {/* Bouton afficher/masquer confirmation */}
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Bouton de validation */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#12396b] via-blue-600 to-violet-600 px-5 py-3.5 text-white font-bold shadow-lg disabled:opacity-50"
          >
            {loading ? "Saving..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}

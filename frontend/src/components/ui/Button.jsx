export default function Button({ children, onClick, type = "button" }) {
  return (
    <button
      // Définit le type du bouton
      type={type}

      // Fonction appelée lors du clic
      onClick={onClick}

      // Classes Tailwind CSS pour le style du bouton
      className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
    >
      {/* Contenu du bouton */}
      {children}
    </button>
  );
}
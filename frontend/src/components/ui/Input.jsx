export default function Input({ type = "text", placeholder }) {
  return (
    <input
      // Type du champ de saisie
      type={type}

      // Texte affiché tant que l'utilisateur n'a rien saisi
      placeholder={placeholder}

      // Classes Tailwind CSS pour la mise en forme
      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    />
  );
}
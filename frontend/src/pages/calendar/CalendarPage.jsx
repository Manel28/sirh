import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { getCollaborators } from "../../services/userService";
import {
  getWorkEntriesByMonth,
  saveWorkEntry,
} from "../../services/workEntryService";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Home,
  Search,
  Users,
  XCircle,
} from "lucide-react";

// Codes disponibles pour renseigner une journée de travail
const CODE_OPTIONS = ["", "SS", "TT", "TR", "AB"];

// Liste des mois utilisée dans le sélecteur
const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

/**
 * Page principale du calendrier RH.
 *
 * Elle permet d'afficher le planning mensuel,
 * de consulter les présences de l'équipe,
 * de modifier son propre planning et de visualiser
 * les statistiques du jour.
 */
export default function CalendarPage() {
  // Récupération de l'utilisateur connecté
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = user?.id;
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  // Initialisation du calendrier sur le mois courant
  const now = new Date();
  const currentYear = now.getFullYear();

  const [month, setMonth] = useState(
    `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  // Génération d'une grande liste d'années à partir de 2026
  const yearOptions = Array.from(
    { length: 1000 },
    (_, index) => 2026 + index
  );

  // Séparation du mois sélectionné en année et mois
  const selectedYear = month.split("-")[0];
  const selectedMonth = month.split("-")[1];

  // Liste des collaborateurs
  const [employees, setEmployees] = useState([]);

  // Entrées du calendrier récupérées depuis l'API
  const [entries, setEntries] = useState([]);

  // Gestion des états d'affichage
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  /**
   * Génère tous les jours du mois sélectionné.
   *
   * Chaque jour contient :
   * - son numéro ;
   * - sa date complète ;
   * - son nom abrégé ;
   * - une indication week-end.
   */
  const days = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const count = new Date(y, m, 0).getDate();

    return Array.from({ length: count }, (_, i) => {
      const d = i + 1;
      const date = new Date(y, m - 1, d);

      return {
        label: d,
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      };
    });
  }, [month]);

  /**
   * Charge les données nécessaires au calendrier.
   *
   * Deux appels API sont exécutés en parallèle :
   * - récupération des entrées du mois ;
   * - récupération des collaborateurs.
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [entriesData, usersData] = isAdmin
        ? await Promise.all([
            getWorkEntriesByMonth(month),
            getCollaborators(),
          ])
        : [await getWorkEntriesByMonth(month), []];

      // Stockage des entrées du calendrier
      setEntries(Array.isArray(entriesData) ? entriesData : []);

      // Exclusion des administrateurs de la liste des collaborateurs affichés
      const collaborators = (Array.isArray(usersData) ? usersData : []).filter(
        (item) => !item.roles?.includes("ROLE_ADMIN")
      );

      setEmployees(collaborators);
    } catch (err) {
      console.error(err);
      setError("Failed to load calendar.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, month]);

  /**
   * Recharge automatiquement le calendrier
   * quand l'utilisateur ou le mois sélectionné change.
   */
  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId, loadData]);

  /**
   * Transforme les entrées en objet clé/valeur.
   *
   * Cela permet de retrouver rapidement le code
   * d'un collaborateur pour une date donnée.
   */
  const entriesMap = useMemo(() => {
    const map = {};

    entries.forEach((entry) => {
      map[`${entry.userId}_${entry.date}`] = entry.code;
    });

    return map;
  }, [entries]);

  /**
   * Prépare les informations de l'utilisateur connecté
   * pour afficher son propre calendrier.
   */
  const currentUser = useMemo(() => {
    return {
      id: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
    };
  }, [user]);

  /**
   * Filtre les collaborateurs selon la recherche.
   *
   * La recherche fonctionne sur :
   * - prénom ;
   * - nom ;
   * - email.
   */
  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return employees;

    return employees.filter((employee) => {
      const fullName = [employee.firstName, employee.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const email = (employee.email || "").toLowerCase();

      return fullName.includes(query) || email.includes(query);
    });
  }, [employees, search]);

  /**
   * Calcule les statistiques du jour.
   *
   * Les statistiques sont calculées à partir des codes :
   * SS = sur site
   * TT = télétravail
   * TR = formation
   * AB = absence
   * LV = congé
   */
  const stats = useMemo(() => {
    const today = new Date();

    const todayString = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let ss = 0;
    let tt = 0;
    let tr = 0;
    let ab = 0;
    let lv = 0;

    const employeeIds = new Set(
      filteredEmployees.map((employee) => Number(employee.id))
    );

    if (currentUserId !== undefined && currentUserId !== null) {
      employeeIds.add(Number(currentUserId));
    }

    employeeIds.forEach((employeeId) => {
      const code = entriesMap[`${employeeId}_${todayString}`];

      if (code === "SS") ss += 1;
      if (code === "TT") tt += 1;
      if (code === "TR") tr += 1;
      if (code === "AB") ab += 1;
      if (code === "LV") lv += 1;
    });

    return {
      total: employeeIds.size,
      ss,
      tt,
      tr,
      ab,
      lv,
    };
  }, [filteredEmployees, entriesMap, currentUserId]);

  // Change uniquement le mois tout en gardant l'année sélectionnée
  const handleMonthChange = (newMonth) => {
    setMonth(`${selectedYear}-${newMonth}`);
  };

  // Change uniquement l'année tout en gardant le mois sélectionné
  const handleYearChange = (newYear) => {
    setMonth(`${newYear}-${selectedMonth}`);
  };

  /**
   * Enregistre une modification du calendrier.
   *
   * La modification concerne uniquement les cellules autorisées,
   * c'est-à-dire les jours ouvrés de l'utilisateur connecté.
   */
  const handleChange = async (userId, date, code) => {
    try {
      const key = `${userId}_${date}`;

      setSaving(key);
      setError("");

      await saveWorkEntry({ userId, date, code });

      // Recharge les données après sauvegarde
      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to save entry."
      );
    } finally {
      setSaving("");
    }
  };

  return (
    <AppLayout title="Calendar">
      <div className="space-y-7">
        {/* En-tête visuel de la page calendrier */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 shadow-[0_20px_60px_rgba(18,57,107,0.18)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.22),transparent_28%)]" />

          <div className="relative px-6 py-8 md:px-9 md:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur">
                  <CalendarDays size={16} />
                  Monthly planning
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                  Team Calendar
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  Manage work presence, remote days, training, absences, and
                  approved leave in one centralized calendar.
                </p>
              </div>

              {/* Sélecteurs du mois et de l'année */}
              <div className="rounded-3xl border border-white/20 bg-white/15 p-4 backdrop-blur-xl shadow-xl">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/70">
                  Selected month
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-white/20"
                  >
                    {MONTH_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-white/20"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Message d'erreur */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Statistiques du jour */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <TopStat label="Employees" value={stats.total} icon={Users} />
          <TopStat label="On Site" value={stats.ss} icon={CheckCircle2} />
          <TopStat label="Remote" value={stats.tt} icon={Home} />
          <TopStat label="Training" value={stats.tr} icon={GraduationCap} />
          <TopStat label="Absence" value={stats.ab} icon={XCircle} />
          <TopStat label="Leave" value={stats.lv} icon={Clock3} />
        </section>

        {/* Légende des codes du calendrier */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Calendar codes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Use these codes to read and update planning entries.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Legend code="SS" label="On Site" className="bg-blue-50 text-blue-700 border-blue-200" />
              <Legend code="TT" label="Remote" className="bg-emerald-50 text-emerald-700 border-emerald-200" />
              <Legend code="TR" label="Training" className="bg-violet-50 text-violet-700 border-violet-200" />
              <Legend code="AB" label="Absence" className="bg-rose-50 text-rose-700 border-rose-200" />
              <Legend code="LV" label="Leave" className="bg-orange-50 text-orange-700 border-orange-200" />
              <Legend code="WK" label="Weekend" className="bg-slate-100 text-slate-700 border-slate-200" />
            </div>
          </div>
        </section>

        {/* Calendrier personnel de l'utilisateur connecté */}
        <CalendarTable
          title="My Calendar"
          subtitle="You can edit your own work days. Weekends and approved leave are locked."
          days={days}
          employees={[currentUser]}
          entriesMap={entriesMap}
          currentUserId={currentUserId}
          isEditable={true}
          saving={saving}
          onChange={handleChange}
          loading={loading}
        />

        {/* Zone de recherche pour le planning de l'équipe */}
        {isAdmin && (
          <>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Team planning
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View all collaborators planning for the selected month.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search collaborator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm font-medium outline-none transition focus:border-[#12396b] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {/* Planning global de l'équipe, non modifiable */}
        <CalendarTable
          title=""
          subtitle=""
          days={days}
          employees={filteredEmployees}
          entriesMap={entriesMap}
          currentUserId={currentUserId}
          isEditable={false}
          saving={saving}
          onChange={handleChange}
          loading={loading}
        />
          </>
        )}
      </div>
    </AppLayout>
  );
}

/**
 * Tableau réutilisable du calendrier.
 *
 * Il affiche une ligne par collaborateur
 * et une colonne par jour du mois.
 */
function CalendarTable({
  title,
  subtitle,
  days,
  employees,
  entriesMap,
  currentUserId,
  isEditable,
  saving,
  onChange,
  loading,
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
      {/* Titre optionnel du tableau */}
      {(title || subtitle) && (
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50/40 px-6 py-5">
          {title && (
            <h3 className="text-xl font-black text-slate-900">{title}</h3>
          )}
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}

      {/* Tableau avec défilement horizontal */}
      <div className="overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-[240px] border-b border-r border-slate-200 bg-slate-50 p-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                Collaborator
              </th>

              {/* Affichage des jours du mois */}
              {days.map((day) => (
                <th
                  key={day.date}
                  className={`min-w-[64px] border-b border-r border-slate-200 p-3 text-center ${
                    day.isWeekend ? "bg-slate-100" : "bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-black text-slate-900">
                    {day.label}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                    {day.dayName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* État de chargement */}
            {loading ? (
              <tr>
                <td
                  colSpan={days.length + 1}
                  className="p-8 text-center text-sm font-semibold text-slate-500"
                >
                  Loading calendar...
                </td>
              </tr>
            ) : employees.length > 0 ? (
              employees.map((employee) => (
                <tr key={employee.id} className="transition hover:bg-blue-50/30">
                  {/* Informations du collaborateur */}
                  <td className="sticky left-0 z-10 min-w-[240px] border-b border-r border-slate-100 bg-white p-4">
                    <div className="font-bold text-slate-900">
                      {[employee.firstName, employee.lastName]
                        .filter(Boolean)
                        .join(" ") || employee.email}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {employee.email}
                    </div>
                  </td>

                  {/* Cellules du calendrier */}
                  {days.map((day) => {
                    const key = `${employee.id}_${day.date}`;

                    // Code enregistré pour ce jour, ou WK si week-end
                    const code = entriesMap[key] || (day.isWeekend ? "WK" : "");

                    // Vérifie si cette cellule est en cours de sauvegarde
                    const isSaving = saving === key;

                    // Seul l'utilisateur connecté peut modifier ses jours ouvrés
                    const canEdit =
                      isEditable &&
                      Number(employee.id) === Number(currentUserId) &&
                      !day.isWeekend &&
                      code !== "LV";

                    return (
                      <td
                        key={day.date}
                        className={`border-b border-r border-slate-100 p-1.5 text-center ${
                          day.isWeekend ? "bg-slate-50" : "bg-white"
                        }`}
                      >
                        {canEdit ? (
                          // Cellule modifiable sous forme de liste déroulante
                          <select
                            value={code}
                            onChange={(e) =>
                              onChange(employee.id, day.date, e.target.value)
                            }
                            disabled={isSaving}
                            className={`w-full rounded-xl border px-2 py-2 text-xs font-black outline-none transition focus:ring-2 focus:ring-blue-100 ${getCellClass(
                              code
                            )} ${isSaving ? "opacity-50" : ""}`}
                          >
                            {CODE_OPTIONS.map((option) => (
                              <option key={option || "empty"} value={option}>
                                {option || "—"}
                              </option>
                            ))}
                          </select>
                        ) : (
                          // Cellule non modifiable
                          <div
                            className={`rounded-xl border px-2 py-2 text-xs font-black ${getCellClass(
                              code
                            )}`}
                          >
                            {code || "—"}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              // Message si aucun collaborateur n'est disponible
              <tr>
                <td
                  colSpan={days.length + 1}
                  className="p-8 text-center text-sm font-semibold text-slate-500"
                >
                  No collaborators found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Carte affichant une statistique du calendrier.
 */
function TopStat({ label, value, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(18,57,107,0.15)]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-orange-50/40 opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12396b] to-orange-500 text-white shadow-lg">
          <Icon size={23} />
        </div>

        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

/**
 * Élément de légende pour expliquer les codes du calendrier.
 */
function Legend({ code, label, className }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${className}`}
    >
      <span>{code}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

/**
 * Retourne le style CSS correspondant au code de présence.
 */
function getCellClass(code) {
  switch (code) {
    case "SS":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "TT":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "TR":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "AB":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "LV":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "WK":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-white text-slate-400 border-slate-200";
  }
}

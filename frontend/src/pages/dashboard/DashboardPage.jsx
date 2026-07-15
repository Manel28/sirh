// Import des hooks React utilisés pour gérer les effets, les calculs optimisés et les états
import { useEffect, useMemo, useState } from "react";

// Import du layout principal utilisé pour les pages connectées
import AppLayout from "../../layouts/AppLayout";

// Import du hook de navigation React Router
import { useNavigate } from "react-router-dom";

// Import du service permettant de récupérer les demandes de congé
import { getLeaves } from "../../services/leaveService";

// Import du service permettant de récupérer les collaborateurs
import { getCollaborators } from "../../services/userService";
import { buildBackendUrl } from "../../services/api";

// Import des icônes utilisées dans le tableau de bord
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

/**
 * Page principale du tableau de bord.
 *
 * Le contenu affiché dépend du rôle de l'utilisateur :
 * - administrateur/RH : statistiques RH, congés récents, collaborateurs récents ;
 * - collaborateur : accès rapide au calendrier, aux congés et aux documents.
 */
export default function DashboardPage() {
  // Hook permettant de rediriger l'utilisateur vers une autre page
  const navigate = useNavigate();

  // Récupération de l'utilisateur connecté depuis le localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Vérifie si l'utilisateur possède le rôle administrateur/RH
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  // Liste des demandes de congé récupérées depuis l'API
  const [leaves, setLeaves] = useState([]);

  // Liste des collaborateurs récupérés depuis l'API
  const [collaborators, setCollaborators] = useState([]);

  // État indiquant si les statistiques sont en cours de chargement
  const [loadingStats, setLoadingStats] = useState(true);

  // Prénom utilisé dans le message de bienvenue
  const firstName = user?.firstName || "User";

  // Nom complet affiché dans le bloc profil
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";

  // Initiales affichées si l'utilisateur n'a pas de photo
  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.trim() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  /**
   * Chargement des données du tableau de bord.
   *
   * Tous les utilisateurs récupèrent les demandes de congé.
   * Les administrateurs récupèrent aussi la liste des collaborateurs.
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Active l'affichage du chargement
        setLoadingStats(true);

        // Récupération des congés depuis l'API
        const leavesData = await getLeaves();

        // Normalisation de la réponse API pour garantir un tableau
        setLeaves(
          Array.isArray(leavesData)
            ? leavesData
            : Array.isArray(leavesData?.leaves)
            ? leavesData.leaves
            : []
        );

        // Si l'utilisateur est administrateur, on récupère aussi les collaborateurs
        if (isAdmin) {
          const usersData = await getCollaborators();
          setCollaborators(Array.isArray(usersData) ? usersData : []);
        }
      } catch (error) {
        // Affichage de l'erreur dans la console pour faciliter le débogage
        console.error("Dashboard stats error:", error);
      } finally {
        // Désactive le chargement dans tous les cas
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  /**
   * Calcul des statistiques affichées dans les cartes.
   *
   * Les statistiques changent selon le rôle :
   * - collaborateur : demandes en attente, congés approuvés, prochain congé ;
   * - admin/RH : nombre de collaborateurs, demandes en attente, approuvées et refusées.
   */
  const stats = useMemo(() => {
    // Date du jour au format local YYYY-MM-DD
    const todayStr = formatDateLocal(new Date());

    // Statistiques spécifiques au collaborateur
    if (!isAdmin) {
      const pendingRequests = leaves.filter(
        (leave) => leave.status === "Pending"
      ).length;

      const approvedLeaves = leaves.filter(
        (leave) => leave.status === "Approved"
      );

      // Recherche du prochain congé approuvé à venir
      const upcomingApproved = approvedLeaves
        .filter((leave) => leave.start >= todayStr)
        .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

      return {
        pendingRequests,
        approvedCount: approvedLeaves.length,
        nextApprovedLeave: upcomingApproved
          ? `${formatShortDate(upcomingApproved.start)} → ${formatShortDate(
              upcomingApproved.end
            )}`
          : "No upcoming leave",
      };
    }

    // Pour l'admin, on exclut les autres administrateurs du nombre de collaborateurs
    const employeesOnly = collaborators.filter(
      (item) => !item.roles?.includes("ROLE_ADMIN")
    );

    return {
      collaboratorsCount: employeesOnly.length,
      pendingRequests: leaves.filter((leave) => leave.status === "Pending")
        .length,
      approvedRequests: leaves.filter((leave) => leave.status === "Approved")
        .length,
      rejectedRequests: leaves.filter((leave) => leave.status === "Rejected")
        .length,
    };
  }, [isAdmin, leaves, collaborators]);

  /**
   * Récupère les 5 demandes de congé les plus récentes.
   * Cette section est utilisée dans le tableau de bord administrateur.
   */
  const recentLeaves = useMemo(() => {
    return [...leaves]
      .sort((a, b) => new Date(b.start) - new Date(a.start))
      .slice(0, 5);
  }, [leaves]);

  /**
   * Récupère les 5 premiers collaborateurs non administrateurs.
   * Cette section est utilisée dans le tableau de bord administrateur.
   */
  const recentCollaborators = useMemo(() => {
    return [...collaborators]
      .filter((item) => !item.roles?.includes("ROLE_ADMIN"))
      .slice(0, 5);
  }, [collaborators]);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-7">
        {/* En-tête principal du tableau de bord */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-r from-[#12396b] via-blue-600 to-orange-500 shadow-[0_20px_60px_rgba(18,57,107,0.18)]">
          {/* Effet décoratif en arrière-plan */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.22),transparent_28%)]" />

          <div className="relative px-6 py-9 md:px-9 md:py-11">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {/* Badge indiquant le type d'espace utilisateur */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur">
                  <ShieldCheck size={16} />
                  {isAdmin ? "HR Administration" : "Employee Workspace"}
                </div>

                {/* Message de bienvenue */}
                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                  Welcome, {firstName}
                </h1>

                {/* Description adaptée selon le rôle */}
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  {isAdmin
                    ? "Monitor HR activity, review leave requests, and manage your workforce from one clean workspace."
                    : "Manage your leave requests, calendar, and HR documents from one place."}
                </p>
              </div>

              {/* Carte profil de l'utilisateur connecté */}
              <div className="flex items-center gap-4 rounded-3xl border border-white/20 bg-white/15 p-4 backdrop-blur-xl shadow-xl">
                {user?.photo ? (
                  // Affichage de la photo si elle existe
                  <img
                    src={buildBackendUrl(user.photo)}
                    alt="Profile"
                    className="h-16 w-16 rounded-2xl border-2 border-white/40 object-cover"
                  />
                ) : (
                  // Sinon, affichage des initiales
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-xl font-black text-white">
                    {initials}
                  </div>
                )}

                {/* Informations utilisateur */}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/70">
                    Signed in as
                  </p>
                  <p className="truncate text-base font-bold text-white">
                    {fullName}
                  </p>
                  <p className="text-sm text-white/80">
                    {isAdmin ? "Admin / HR" : "Collaborator"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section des cartes statistiques */}
        <section
          className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${
            isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-3"
          }`}
        >
          {loadingStats ? (
            // Skeleton affiché pendant le chargement des statistiques
            Array.from({ length: isAdmin ? 4 : 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 h-14 w-14 rounded-2xl bg-slate-200" />
                <div className="mb-3 h-4 w-28 rounded bg-slate-200" />
                <div className="mb-3 h-9 w-20 rounded bg-slate-200" />
                <div className="h-4 w-36 rounded bg-slate-100" />
              </div>
            ))
          ) : isAdmin ? (
            // Statistiques visibles par l'administrateur/RH
            <>
              <StatCard
                title="Collaborators"
                value={stats.collaboratorsCount}
                subtitle="Active employee accounts"
                icon={Users}
              />
              <StatCard
                title="Pending Requests"
                value={stats.pendingRequests}
                subtitle="Waiting for HR review"
                icon={Clock3}
              />
              <StatCard
                title="Approved Requests"
                value={stats.approvedRequests}
                subtitle="Validated leave requests"
                icon={CheckCircle2}
              />
              <StatCard
                title="Rejected Requests"
                value={stats.rejectedRequests}
                subtitle="Requests declined"
                icon={XCircle}
              />
            </>
          ) : (
            // Statistiques visibles par un collaborateur
            <>
              <StatCard
                title="Pending Requests"
                value={stats.pendingRequests}
                subtitle="Still waiting for response"
                icon={Clock3}
              />
              <StatCard
                title="Approved Leaves"
                value={stats.approvedCount}
                subtitle="Validated leave requests"
                icon={CheckCircle2}
              />
              <StatCard
                title="Next Leave"
                value={stats.nextApprovedLeave}
                subtitle="Your next approved period"
                icon={CalendarDays}
                compact
              />
            </>
          )}
        </section>

        {/* Contenu spécifique à l'administrateur */}
        {isAdmin ? (
          <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            {/* Panneau des congés récents */}
            <Panel
              title="Recent leave requests"
              action="View all"
              onClick={() => navigate("/leaves")}
            >
              {recentLeaves.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      {/* Informations sur la demande */}
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {leave.user?.firstName ||
                            leave.firstName ||
                            "Employee"}{" "}
                          {leave.user?.lastName || leave.lastName || ""}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {formatShortDate(leave.start)} →{" "}
                          {formatShortDate(leave.end)}
                        </p>
                      </div>

                      {/* Statut de la demande */}
                      <StatusBadge status={leave.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No leave requests yet." />
              )}
            </Panel>

            {/* Panneau des collaborateurs récents */}
            <Panel
              title="Recent collaborators"
              action="Manage"
              onClick={() => navigate("/admin/collaborators")}
            >
              {recentCollaborators.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentCollaborators.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      {/* Informations du collaborateur */}
                      <div className="flex min-w-0 items-center gap-3">
                        {item.photo ? (
                          <img
                            src={buildBackendUrl(item.photo)}
                            alt="Profile"
                            className="h-11 w-11 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12396b] to-orange-500 text-sm font-black text-white">
                            {item.firstName?.[0] || item.email?.[0] || "U"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {[item.firstName, item.lastName]
                              .filter(Boolean)
                              .join(" ") || "Collaborator"}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {item.jobTitle || item.email}
                          </p>
                        </div>
                      </div>

                      {/* Département du collaborateur */}
                      <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                        {item.department || "Team"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No collaborators yet." />
              )}
            </Panel>
          </section>
        ) : (
          // Contenu spécifique au collaborateur
          <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <DashboardCard
              title="My Calendar"
              description="View your personal work and leave calendar."
              icon={CalendarDays}
              onClick={() => navigate("/calendar")}
            />
            <DashboardCard
              title="My Leaves"
              description="Track your leave requests and their status."
              icon={Clock3}
              onClick={() => navigate("/leaves")}
            />
            <DashboardCard
              title="My Documents"
              description="Access your HR documents and files."
              icon={FileText}
              onClick={() => navigate("/documents")}
            />
          </section>
        )}
      </div>
    </AppLayout>
  );
}

/**
 * Carte statistique réutilisable.
 */
function StatCard({ title, value, subtitle, icon: Icon, compact = false }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/85 p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(18,57,107,0.15)]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-orange-50/40 opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Icône de la statistique */}
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12396b] to-orange-500 text-white shadow-lg">
          <Icon size={26} />
        </div>

        {/* Titre */}
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {title}
        </p>

        {/* Valeur */}
        <p
          className={`mt-3 break-words font-black tracking-tight text-slate-900 ${
            compact ? "text-lg leading-7" : "text-4xl"
          }`}
        >
          {value ?? "-"}
        </p>

        {/* Sous-titre */}
        <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

/**
 * Carte de navigation utilisée pour les collaborateurs.
 */
function DashboardCard({ title, description, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(18,57,107,0.12)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-orange-50/30 opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Icône */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12396b] to-orange-500 text-white shadow-lg">
          <Icon size={28} />
        </div>

        {/* Titre de la fonctionnalité */}
        <h3 className="text-2xl font-black tracking-tight text-slate-900 transition group-hover:text-[#12396b]">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>

        {/* Indication de navigation */}
        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#12396b]">
          <span className="transition group-hover:translate-x-1">
            Open section
          </span>
          <span>→</span>
        </div>
      </div>
    </button>
  );
}

/**
 * Panneau réutilisable contenant une liste.
 */
function Panel({ title, action, onClick, children }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
      {/* En-tête du panneau */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50/40 px-6 py-5">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>

        {/* Bouton d'action optionnel */}
        {action && (
          <button
            onClick={onClick}
            className="rounded-full bg-[#12396b] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0f2f58]"
          >
            {action}
          </button>
        )}
      </div>

      {/* Contenu du panneau */}
      <div className="px-6">{children}</div>
    </div>
  );
}

/**
 * Badge indiquant le statut d'une demande de congé.
 */
function StatusBadge({ status }) {
  // Styles différents selon le statut
  const styles = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
        styles[status] || "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

/**
 * Message affiché lorsqu'une liste ne contient aucune donnée.
 */
function EmptyState({ text }) {
  return <div className="py-8 text-center text-sm text-slate-500">{text}</div>;
}

/**
 * Formate une date JavaScript au format YYYY-MM-DD.
 */
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Transforme une date en format court lisible.
 */
function formatShortDate(dateString) {
  const date = new Date(dateString);

  // Si la date est invalide, on retourne la valeur d'origine
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

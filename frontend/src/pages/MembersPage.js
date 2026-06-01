/**
 * Page Zone Membres
 * Affiche les développeurs avec abonnement actif
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, MapPin, Briefcase, Github, Linkedin, Globe, 
  ExternalLink, Filter, X, Loader2, Users, Code
} from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import DevisModal from "@/components/modals/DevisModal";
import Pagination from "@/components/shared/Pagination";
import { API_URL } from "@/config/constants";
import api from "@/services/api";

/**
 * Carte de membre
 */
const MemberCard = ({ member }) => {
  const profile = member.profile || {};
  const projects = member.projects || [];
  
  // Construire l'URL de la photo
  const photoUrl = profile.photo_url?.startsWith("http") 
    ? profile.photo_url 
    : profile.photo_url ? `${API_URL}${profile.photo_url}` : null;
  
  // Nom à afficher selon le choix du développeur
  const getDisplayName = () => {
    const choice = profile.display_name_choice || "name";
    
    switch (choice) {
      case "pseudo":
        return profile.pseudo || profile.first_name || member.email?.split("@")[0];
      case "company":
        return profile.company_name || profile.first_name || member.email?.split("@")[0];
      case "name":
      default:
        return profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : member.email?.split("@")[0];
    }
  };
  
  const displayName = getDisplayName();
  
  // Initiale pour le placeholder
  const initial = displayName?.charAt(0).toUpperCase() || "?";

  return (
    <div 
      className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
      style={{ background: "#16213e", border: "1px solid #1f4068" }}
      data-testid={`member-card-${member.id}`}
    >
      {/* Header avec photo et infos */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div 
            className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold text-white overflow-hidden"
            style={{ background: photoUrl ? "transparent" : "#e94560" }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          
          {/* Infos */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-white truncate">
              {displayName}
            </h3>
            
            {profile.city && (
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                <MapPin size={14} />
                {profile.city}
              </p>
            )}
            
            {profile.experience && (
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                <Briefcase size={14} />
                {profile.experience} d'expérience
              </p>
            )}
          </div>
        </div>
        
        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-gray-300 mt-4 line-clamp-3">
            {profile.bio}
          </p>
        )}
        
        {/* Compétences */}
        {profile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {profile.skills.slice(0, 6).map((skill) => (
              <span 
                key={skill}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: "#1f4068", color: "#e94560" }}
              >
                {skill}
              </span>
            ))}
            {profile.skills.length > 6 && (
              <span className="text-xs text-gray-500">
                +{profile.skills.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Aperçu des projets */}
      {projects.length > 0 && (
        <div className="px-5 pb-3">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
            Réalisations ({projects.length})
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {projects.slice(0, 3).map((project) => {
              const projectImg = project.image_url?.startsWith("http")
                ? project.image_url
                : project.image_url ? `${API_URL}${project.image_url}` : null;
              
              return (
                <div 
                  key={project.id}
                  className="aspect-video rounded overflow-hidden bg-gray-800"
                >
                  {projectImg ? (
                    <img 
                      src={projectImg} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Code size={16} className="text-gray-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Liens et actions */}
      <div 
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid #1f4068" }}
      >
        {/* Liens sociaux */}
        <div className="flex items-center gap-2">
          {profile.github && (
            <a 
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="GitHub"
            >
              <Github size={18} className="text-gray-400" />
            </a>
          )}
          {profile.linkedin && (
            <a 
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="LinkedIn"
            >
              <Linkedin size={18} className="text-gray-400" />
            </a>
          )}
          {profile.portfolio && (
            <a 
              href={profile.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Portfolio"
            >
              <Globe size={18} className="text-gray-400" />
            </a>
          )}
        </div>
        
        {/* Bouton voir profil */}
        <Link
          to={`/membres/${member.id}`}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "#e94560", color: "white" }}
        >
          Voir le profil
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
};

/**
 * Page principale Zone Membres
 */
const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, totalPages: 1 });

  // Filtres
  const [filters, setFilters] = useState({
    skill: "",
    experience: "",
    city: ""
  });
  const [searchCity, setSearchCity] = useState("");

  useEffect(() => {
    fetchMembers({}, 1);
    fetchSkills();
  }, []);

  const fetchMembers = async (appliedFilters = filters, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.skill)       params.append("skill", appliedFilters.skill);
      if (appliedFilters.experience)  params.append("experience", appliedFilters.experience);
      if (appliedFilters.city)        params.append("city", appliedFilters.city);
      params.append("page", p);
      params.append("limit", 12);

      const url = `/members/public${params.toString() ? `?${params}` : ""}`;
      const response = await api.get(url);
      setMembers(response.data.members || []);
      setPaginationInfo({
        total:      response.data.total      || 0,
        totalPages: response.data.total_pages || 1
      });
    } catch (err) {
      console.error("Erreur chargement membres:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/members/skills');
      setSkills(response.data.skills || []);
    } catch (err) {
      console.error("Erreur chargement compétences:", err);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchMembers(filters, 1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const empty = { skill: "", experience: "", city: "" };
    setFilters(empty);
    setSearchCity("");
    setPage(1);
    fetchMembers(empty, 1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchMembers(filters, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters = filters.skill || filters.experience || filters.city;

  return (
    <div className="min-h-screen" style={{ background: "#1a1a2e" }}>
      <Navigation />
      
      {/* Hero */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "#e94560" }}>
            <Users size={18} className="text-white" />
            <span className="text-white text-sm font-medium">Nos talents</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Membres du Syndicat
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Découvrez les développeurs partenaires du Syndicat du Code. 
            Des professionnels qualifiés prêts à collaborer sur vos projets.
          </p>
        </div>
      </section>

      {/* Filtres */}
      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  hasActiveFilters ? "bg-red-500 text-white" : ""
                }`}
                style={!hasActiveFilters ? { background: "#16213e", color: "#9ca3af", border: "1px solid #1f4068" } : {}}
              >
                <Filter size={16} />
                Filtres
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-white text-red-500 text-xs flex items-center justify-center font-bold">
                    !
                  </span>
                )}
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <X size={14} />
                  Effacer
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-500">
              {members.length} développeur{members.length > 1 ? "s" : ""} trouvé{members.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Panel de filtres */}
          {showFilters && (
            <div 
              className="p-5 rounded-xl mb-6"
              style={{ background: "#16213e", border: "1px solid #1f4068" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Compétence */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Compétence
                  </label>
                  <select
                    value={filters.skill}
                    onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                  >
                    <option value="">Toutes</option>
                    {skills.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.count})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Expérience */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Expérience
                  </label>
                  <select
                    value={filters.experience}
                    onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                  >
                    <option value="">Toutes</option>
                    <option value="0-2">0-2 ans</option>
                    <option value="2-5">2-5 ans</option>
                    <option value="5-10">5-10 ans</option>
                    <option value="10+">10+ ans</option>
                  </select>
                </div>
                
                {/* Ville */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    placeholder="Ex: Paris"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: "#1a1a2e", border: "1px solid #1f4068", color: "white" }}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: "#e94560" }}
                >
                  Appliquer les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Liste des membres */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-red-500" size={40} />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16">
              <Users size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun membre trouvé
              </h3>
              <p className="text-gray-400">
                {hasActiveFilters 
                  ? "Aucun développeur ne correspond à vos critères. Essayez de modifier les filtres."
                  : "Les développeurs avec un abonnement actif apparaîtront ici."
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 rounded-lg text-sm"
                  style={{ background: "#e94560", color: "white" }}
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && paginationInfo.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={paginationInfo.totalPages}
              total={paginationInfo.total}
              itemsPerPage={12}
              onPageChange={handlePageChange}
              activeColor="#e94560"
            />
          )}
        </div>
      </section>

      <Footer />
      <DevisModal />
    </div>
  );
};

export default MembersPage;

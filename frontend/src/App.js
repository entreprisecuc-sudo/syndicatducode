import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Monitor, Settings, Bot, Check, Phone, MapPin, Mail, Menu, X, ChevronRight, Store, Smartphone, Wrench } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configuration
const CONFIG = {
  companyName: "Joerke B",
  slogan: "Construisons votre futur digital",
  phone: "0660420665",
  city: "Troyes",
  email: "contact@joerkeb.fr"
};

// Navigation Component
const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#pourquoi", label: "Pourquoi nous" },
    { href: "#approche", label: "Notre approche" },
    { href: "#contact", label: "Contact" }
  ];

  return (
    <>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`} data-testid="navigation">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#" className="logo" data-testid="logo">{CONFIG.companyName}</a>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="nav-link" data-testid={`nav-${link.label.toLowerCase()}`}>
                {link.label}
              </a>
            ))}
            <a href="#contact" className="btn-primary" data-testid="nav-cta">
              Devis gratuit
            </a>
          </div>

          <div 
            className={`hamburger md:hidden ${mobileOpen ? "open" : ""}`} 
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="mobile-menu-toggle"
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`} data-testid="mobile-menu">
        <button 
          className="absolute top-6 right-6 text-white"
          onClick={() => setMobileOpen(false)}
          data-testid="mobile-menu-close"
        >
          <X size={32} />
        </button>
        {navLinks.map((link) => (
          <a 
            key={link.href} 
            href={link.href} 
            className="nav-link"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <a href="#contact" className="btn-primary" onClick={() => setMobileOpen(false)}>
          Devis gratuit
        </a>
      </div>
    </>
  );
};

// Hero Section
const HeroSection = () => (
  <section className="hero" data-testid="hero-section">
    <div className="grid-bg"></div>
    <div className="glow-orb glow-orb-1"></div>
    <div className="glow-orb glow-orb-2"></div>
    
    <div className="max-w-7xl mx-auto px-6 hero-content">
      <p className="text-sage-light mb-4 font-medium opacity-0 animate-fade-in-up" style={{color: 'var(--sage)'}}>
        {CONFIG.companyName} — {CONFIG.city}
      </p>
      <h1 className="hero-title opacity-0 animate-fade-in-up delay-100">
        Création de sites web<br />
        <span className="gradient-text">modernes, performants</span><br />
        et intelligents
      </h1>
      <p className="hero-subtitle opacity-0 animate-fade-in-up delay-200">
        Du site vitrine au CRM & ERP sur mesure, avec intégration de solutions 
        d'intelligence artificielle adaptées à votre business.
      </p>
      <div className="flex flex-wrap gap-4 opacity-0 animate-fade-in-up delay-300">
        <a href="#contact" className="btn-primary" data-testid="hero-cta-devis">
          Demander un devis
          <ChevronRight className="inline ml-2" size={18} />
        </a>
        <a href="#services" className="btn-secondary" data-testid="hero-cta-services">
          Voir nos solutions
        </a>
      </div>
    </div>
  </section>
);

// Services Section
const services = [
  {
    icon: Monitor,
    title: "Création de sites internet",
    description: "Sites vitrines modernes et responsives adaptés à votre image",
    features: [
      "Sites vitrines modernes et responsives",
      "Sites e-commerce",
      "Optimisation SEO",
      "Performance et sécurité"
    ]
  },
  {
    icon: Settings,
    title: "Développement CRM & ERP",
    description: "Outils sur mesure adaptés à votre métier",
    features: [
      "Gestion clients et ventes",
      "Stocks et facturation",
      "Connexion outils existants",
      "Solutions évolutives"
    ]
  },
  {
    icon: Bot,
    title: "Intégration IA",
    description: "Solutions d'intelligence artificielle pour automatiser et optimiser",
    features: [
      "Automatisation des processus",
      "Chatbots intelligents",
      "Analyse de données",
      "IA personnalisée"
    ]
  },
  {
    icon: Store,
    title: "Marketplace",
    description: "Création de places de marché multi-vendeurs performantes",
    features: [
      "Plateforme multi-vendeurs",
      "Gestion des commissions",
      "Paiements sécurisés",
      "Back-office complet"
    ]
  },
  {
    icon: Smartphone,
    title: "Applications mobiles",
    description: "Apps iOS & Android natives ou hybrides sur mesure",
    features: [
      "Applications iOS & Android",
      "Design UX/UI moderne",
      "Notifications push",
      "Publication stores"
    ]
  },
  {
    icon: Wrench,
    title: "Maintenance & Infogérance",
    description: "Support technique continu et gestion de votre infrastructure",
    features: [
      "Support technique réactif",
      "Mises à jour régulières",
      "Sécurité & sauvegardes",
      "Monitoring 24/7"
    ]
  }
];

const ServicesSection = () => (
  <section id="services" className="section" data-testid="services-section">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="section-title">Nos <span className="gradient-text">services</span></h2>
        <p className="section-subtitle">
          Des solutions digitales complètes pour accompagner votre croissance
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div 
            key={index} 
            className="service-card"
            data-testid={`service-card-${index}`}
          >
            <div className="icon-box">
              <service.icon size={32} color="white" />
            </div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <ul>
              {service.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Why Us Section
const whyUsItems = [
  "Double expertise technique & commerciale",
  "Solutions 100 % personnalisées",
  "Technologies modernes et évolutives",
  "Réactivité et rapidité d'exécution",
  "Accompagnement de A à Z",
  "Support et maintenance continue"
];

const WhyUsSection = () => (
  <section id="pourquoi" className="section" style={{background: 'var(--bg-section)'}} data-testid="why-section">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="section-title mb-8">
            Pourquoi <span className="gradient-text">nous choisir</span> ?
          </h2>
          <div>
            {whyUsItems.map((item, index) => (
              <div key={index} className="why-item" data-testid={`why-item-${index}`}>
                <div className="why-check">
                  <Check size={16} color="white" />
                </div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{background: 'linear-gradient(135deg, var(--bg-card), var(--bg-section))'}}>
          <blockquote className="text-xl italic" style={{color: 'var(--text-secondary)', lineHeight: 1.8}}>
            "Nous ne vendons pas juste un site, nous créons un <span className="gradient-text font-semibold">outil de croissance</span> pour votre entreprise."
          </blockquote>
          <p className="mt-6 font-semibold" style={{color: 'var(--sage)'}}>— {CONFIG.companyName}</p>
        </div>
      </div>
    </div>
  </section>
);

// Process Section
const processSteps = [
  { title: "Analyse de vos besoins", desc: "Nous comprenons votre activité, vos objectifs et vos contraintes." },
  { title: "Conception technique & UX", desc: "Design et architecture pensés pour l'expérience utilisateur." },
  { title: "Développement sur mesure", desc: "Code propre, performant et évolutif." },
  { title: "Tests & sécurité", desc: "Vérification complète avant mise en ligne." },
  { title: "Mise en ligne et accompagnement", desc: "Formation et support pour votre autonomie." }
];

const ProcessSection = () => (
  <section id="approche" className="section" data-testid="process-section">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="section-title">Notre <span className="gradient-text">approche</span></h2>
        <p className="section-subtitle">
          Une méthodologie éprouvée pour des résultats concrets
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        {processSteps.map((step, index) => (
          <div key={index} className="process-step" data-testid={`process-step-${index}`}>
            <div className="step-number">{index + 1}</div>
            <div className="process-content">
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Audience Section
const audiences = [
  "Entrepreneurs & startups",
  "PME & grandes entreprises",
  "Commerces & indépendants",
  "Sociétés cherchant à automatiser"
];

const AudienceSection = () => (
  <section className="section" style={{background: 'var(--bg-section)'}} data-testid="audience-section">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="section-title">À qui s'adresse <span className="gradient-text">nos solutions</span> ?</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {audiences.map((audience, index) => (
          <div key={index} className="audience-tag" data-testid={`audience-tag-${index}`}>
            {audience}
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Contact Section
const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await axios.post(`${API}/contact`, formData);
      setStatus({ type: "success", message: "Message envoyé avec succès ! Nous vous recontacterons rapidement." });
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: "Erreur lors de l'envoi. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section" data-testid="contact-section">
      <div className="glow-orb glow-orb-1"></div>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="section-title">Prêt à <span className="gradient-text">digitaliser</span> votre activité ?</h2>
          <p className="section-subtitle">
            Contactez-nous pour discuter de votre projet
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div className="contact-form" data-testid="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    data-testid="contact-name"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Votre email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="contact-email"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Votre téléphone"
                    value={formData.phone}
                    onChange={handleChange}
                    data-testid="contact-phone"
                  />
                </div>
                <div>
                  <textarea
                    name="message"
                    placeholder="Décrivez votre projet..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    data-testid="contact-message"
                  ></textarea>
                </div>
                
                {status.message && (
                  <div 
                    className={`p-4 rounded-lg ${status.type === "success" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
                    data-testid="contact-status"
                  >
                    {status.message}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={loading}
                  data-testid="contact-submit"
                >
                  {loading ? "Envoi en cours..." : "Obtenir un devis gratuit"}
                </button>
              </div>
            </form>
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="contact-info-item" data-testid="contact-phone-info">
              <div className="contact-icon">
                <Phone size={24} color="white" />
              </div>
              <div>
                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Téléphone</p>
                <p className="font-semibold text-lg">{CONFIG.phone}</p>
              </div>
            </div>
            
            <div className="contact-info-item" data-testid="contact-location-info">
              <div className="contact-icon">
                <MapPin size={24} color="white" />
              </div>
              <div>
                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Localisation</p>
                <p className="font-semibold text-lg">{CONFIG.city}, France</p>
              </div>
            </div>
            
            <div className="contact-info-item" data-testid="contact-email-info">
              <div className="contact-icon">
                <Mail size={24} color="white" />
              </div>
              <div>
                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Email</p>
                <p className="font-semibold text-lg">{CONFIG.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => (
  <footer className="footer" data-testid="footer">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <a href="#" className="logo">{CONFIG.companyName}</a>
        <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>
          © {new Date().getFullYear()} {CONFIG.companyName}. {CONFIG.slogan}
        </p>
      </div>
    </div>
  </footer>
);

// Main App
function App() {
  return (
    <div className="App">
      <Navigation />
      <HeroSection />
      <ServicesSection />
      <WhyUsSection />
      <ProcessSection />
      <AudienceSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

export default App;

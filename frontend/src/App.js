import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Monitor, Settings, Bot, Check, Phone, MapPin, Mail, Menu, X, ChevronRight, Store, Smartphone, Wrench, Paperclip, FileText } from "lucide-react";
import CGV from "@/pages/CGV";
import CGU from "@/pages/CGU";
import RGPD from "@/pages/RGPD";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Modal Context
const ModalContext = createContext();
const useModal = () => useContext(ModalContext);

// Configuration
const CONFIG = {
  companyName: "Le Syndicat du Code",
  slogan: "Notre loi, unis par le code.",
  phone: "0660420665",
  city: "Troyes",
  email: "atelier@syndicatducode.fr",
  logo: "https://customer-assets.emergentagent.com/job_simple-start-7/artifacts/xc73oib2_Logo%20le%20syndicat%20du%20code%20.png"
};

// Devis Modal Component
const DevisModal = () => {
  const { isModalOpen, closeModal } = useModal();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone || "");
      formDataToSend.append("message", formData.message);
      
      files.forEach((file) => {
        formDataToSend.append("files", file);
      });

      await axios.post(`${API}/contact`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setStatus({ type: "success", message: "Message envoyé avec succès ! Nous vous recontacterons rapidement." });
      setFormData({ name: "", email: "", phone: "", message: "" });
      setFiles([]);
      setTimeout(() => closeModal(), 3000);
    } catch (error) {
      setStatus({ type: "error", message: "Erreur lors de l'envoi. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Demander un devis</h2>
          <p style={{color: 'var(--text-muted)'}}>Pas de rançon. Un prix. Technologies actuelles incluses.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Votre nom"
              value={formData.name}
              onChange={handleChange}
              required
              data-testid="modal-contact-name"
            />
            <input
              type="email"
              name="email"
              placeholder="Votre email"
              value={formData.email}
              onChange={handleChange}
              required
              data-testid="modal-contact-email"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Votre téléphone"
              value={formData.phone}
              onChange={handleChange}
              data-testid="modal-contact-phone"
            />
            <textarea
              name="message"
              placeholder="Décrivez votre projet..."
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              data-testid="modal-contact-message"
            ></textarea>
            
            {/* File Upload */}
            <div>
              <label 
                className="flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[var(--sage)]"
                style={{borderColor: 'var(--border-color)', background: 'var(--bg-section)'}}
              >
                <Paperclip size={18} style={{color: 'var(--sage)'}} />
                <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                  Joindre des fichiers
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
              </label>
              <p className="mt-1 text-xs" style={{color: 'var(--text-muted)'}}>
                Présentez vos idées : maquettes, croquis, même un simple dessin !
              </p>
              
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 rounded-lg text-sm"
                      style={{background: 'var(--bg-section)'}}
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} style={{color: 'var(--sage)'}} />
                        <span style={{color: 'var(--text-secondary)'}}>{file.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(index)} className="text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {status.message && (
              <div className={`p-3 rounded-lg text-sm ${status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {status.message}
              </div>
            )}
            
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openModal } = useModal();

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
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <a href="/" className="logo" data-testid="logo">
            <img src={CONFIG.logo} alt={CONFIG.companyName} className="h-32 md:h-44" />
          </a>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="nav-link" data-testid={`nav-${link.label.toLowerCase()}`}>
                {link.label}
              </a>
            ))}
            <button onClick={openModal} className="btn-primary" data-testid="nav-cta">
              Devis gratuit
            </button>
          </div>

          <button 
            className={`hamburger md:hidden ${mobileOpen ? "open" : ""}`} 
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="mobile-menu-toggle"
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`} data-testid="mobile-menu">
        <button 
          className="absolute top-6 right-6"
          onClick={() => setMobileOpen(false)}
          data-testid="mobile-menu-close"
          style={{color: 'var(--text-primary)'}}
        >
          <X size={32} />
        </button>
        {navLinks.map((link) => (
          <a 
            key={link.href} 
            href={link.href} 
            className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <button onClick={() => { openModal(); setMobileOpen(false); }} className="btn-primary">
          Devis gratuit
        </button>
      </div>
    </>
  );
};

// Hero Section
const HeroSection = () => {
  const { openModal } = useModal();
  
  return (
    <section className="hero" data-testid="hero-section">
      <div className="grid-bg"></div>
      <div className="glow-orb glow-orb-1"></div>
      <div className="glow-orb glow-orb-2"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 hero-content">
        <p className="text-sage-light mb-3 md:mb-4 font-medium opacity-0 animate-fade-in-up text-sm md:text-base mt-8" style={{color: 'var(--sage)'}}>
          {CONFIG.slogan}
        </p>
        <h1 className="hero-title opacity-0 animate-fade-in-up delay-100">
          Création de sites web<br />
          <span className="gradient-text">modernes, performants</span><br />
          et intelligents
        </h1>
        <p className="hero-subtitle opacity-0 animate-fade-in-up delay-200">
          Du site vitrine au CRM & ERP sur mesure, avec intégration de solutions 
          IA sur mesure pour votre business.
        </p>
        <p className="mb-6 font-semibold opacity-0 animate-fade-in-up delay-200" style={{color: 'var(--sage-dark)', fontSize: '1.1rem'}}>
          Pas de rançon. Un prix. Technologies actuelles incluses.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 opacity-0 animate-fade-in-up delay-300">
          <button onClick={openModal} className="btn-primary" data-testid="hero-cta-devis">
            Demander un devis
            <ChevronRight className="inline ml-2" size={18} />
          </button>
          <a href="#services" className="btn-secondary" data-testid="hero-cta-services">
            Voir nos solutions
          </a>
        </div>
      </div>
    </section>
  );
};

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
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="section-title">Nos <span className="gradient-text">services</span></h2>
        <p className="section-subtitle px-4">
          Des solutions digitales complètes pour accompagner votre croissance
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {services.map((service, index) => (
          <div 
            key={index} 
            className="service-card"
            data-testid={`service-card-${index}`}
          >
            <div className="icon-box">
              <service.icon size={28} color="white" />
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
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <h2 className="section-title mb-6 md:mb-8">
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
          <blockquote className="text-lg md:text-xl italic" style={{color: 'var(--text-secondary)', lineHeight: 1.8}}>
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
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="section-title">Notre <span className="gradient-text">approche</span></h2>
        <p className="section-subtitle px-4">
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
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="text-center mb-10 md:mb-12">
        <h2 className="section-title">À qui s'adresse <span className="gradient-text">nos solutions</span> ?</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
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
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone || "");
      formDataToSend.append("message", formData.message);
      
      files.forEach((file) => {
        formDataToSend.append("files", file);
      });

      await axios.post(`${API}/contact`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setStatus({ type: "success", message: "Message envoyé avec succès ! Nous vous recontacterons rapidement." });
      setFormData({ name: "", email: "", phone: "", message: "" });
      setFiles([]);
    } catch (error) {
      setStatus({ type: "error", message: "Erreur lors de l'envoi. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section" data-testid="contact-section">
      <div className="glow-orb glow-orb-1"></div>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="section-title">Prêt à <span className="gradient-text">digitaliser</span> votre activité ?</h2>
          <p className="section-subtitle px-4">
            Contactez-nous pour discuter de votre projet
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="contact-form" data-testid="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5 md:space-y-6">
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
                
                {/* File Upload */}
                <div>
                  <label 
                    className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-[var(--sage)]"
                    style={{borderColor: 'var(--border-color)', background: 'var(--bg-section)'}}
                    data-testid="contact-file-upload"
                  >
                    <Paperclip size={20} style={{color: 'var(--sage)'}} />
                    <span style={{color: 'var(--text-secondary)'}}>
                      Joindre des fichiers (images, vidéos, documents...)
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />
                  </label>
                  <p className="mt-2 text-sm" style={{color: 'var(--text-muted)'}}>
                    Présentez vos idées : maquettes, croquis, même un simple dessin sur papier nous aide à comprendre votre vision !
                  </p>
                  
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{background: 'var(--bg-section)'}}
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={16} style={{color: 'var(--sage)'}} />
                            <span className="text-sm" style={{color: 'var(--text-secondary)'}}>
                              {file.name}
                            </span>
                            <span className="text-xs" style={{color: 'var(--text-muted)'}}>
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {status.message && (
                  <div 
                    className={`p-4 rounded-lg ${status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
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
          
          <div className="flex flex-col justify-center items-start">
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
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Logo & Slogan */}
        <div>
          <img src={CONFIG.logo} alt={CONFIG.companyName} style={{height: '80px'}} className="mb-4" />
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>{CONFIG.slogan}</p>
        </div>
        
        {/* Navigation */}
        <div>
          <h4 className="font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Navigation</h4>
          <ul className="space-y-2">
            <li><a href="#services" className="footer-link">Services</a></li>
            <li><a href="#pourquoi" className="footer-link">Pourquoi nous</a></li>
            <li><a href="#approche" className="footer-link">Notre approche</a></li>
            <li><a href="#contact" className="footer-link">Contact</a></li>
          </ul>
        </div>
        
        {/* Légal */}
        <div>
          <h4 className="font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Mentions légales</h4>
          <ul className="space-y-2">
            <li><a href="/cgv" className="footer-link">Conditions Générales de Vente</a></li>
            <li><a href="/cgu" className="footer-link">Conditions Générales d'Utilisation</a></li>
            <li><a href="/rgpd" className="footer-link">Politique de confidentialité (RGPD)</a></li>
          </ul>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="border-t pt-6" style={{borderColor: 'var(--border-color)'}}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>
            © {new Date().getFullYear()} {CONFIG.companyName}. Tous droits réservés.
          </p>
          <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>
            {CONFIG.email}
          </p>
        </div>
      </div>
    </div>
  </footer>
);

// Home Page
const HomePage = () => (
  <>
    <Navigation />
    <HeroSection />
    <ServicesSection />
    <WhyUsSection />
    <ProcessSection />
    <AudienceSection />
    <ContactSection />
    <Footer />
    <DevisModal />
  </>
);

// Modal Provider Wrapper
const ModalProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <ModalContext.Provider value={{ isModalOpen, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

// Main App
function App() {
  return (
    <ModalProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cgv" element={<><Navigation /><CGV /><Footer /><DevisModal /></>} />
            <Route path="/cgu" element={<><Navigation /><CGU /><Footer /><DevisModal /></>} />
            <Route path="/rgpd" element={<><Navigation /><RGPD /><Footer /><DevisModal /></>} />
          </Routes>
        </BrowserRouter>
      </div>
    </ModalProvider>
  );
}

export default App;

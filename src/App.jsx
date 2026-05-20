import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Video, AlignLeft, Clock, Mic, Palette, 
  Layers, Maximize, Link as LinkIcon, FileText, 
  Scale, DollarSign, HelpCircle, Check, ArrowRight, 
  ArrowLeft, RotateCcw, X, Plus, Trash2, Edit3 
} from 'lucide-react';

import { countriesList } from './utils/countries';
import { shareOnWhatsApp } from './utils/whatsappShare';
import { generatePDF } from './utils/pdfGenerator';

const INITIAL_STATE = {
  nom_complet: '',
  entreprise: '',
  indicatif: '+221',
  telephone_number: '',
  identifiant_whatsapp: '',
  pays: '',
  type_projet: '',
  autre_precision: '',
  description: '',
  objectif: '',
  duree: '',
  duree_personnalise: '',
  type_voix: '',
  fournisseur_voix_humaine: '',
  fournisseur_voix_ia: '',
  gestion_script: '',
  styles_visuels: [],
  niveau_complexite: '',
  formats: [],
  lien_reference: '',
  ce_qui_plait: '',
  documents: [],
  fichiers_sources: 'non',
  droits_diffusion: 'oui',
  delai_livraison: 'standard',
  conditions_acceptation: false,
  devise: 'FCFA',
  budget_bracket: '',
  budget_precis: '',
  liste_questions: []
};

const COUNTRY_CODES = [
  { code: '+221', label: '🇸🇳 Sénégal (+221)' },
  { code: '+33', label: '🇫🇷 France (+33)' },
  { code: '+225', label: '🇨🇮 Côte d\'Ivoire (+225)' },
  { code: '+226', label: '🇧🇫 Burkina Faso (+226)' },
  { code: '+223', label: '🇲🇱 Mali (+223)' },
  { code: '+227', label: '🇳🇪 Niger (+227)' },
  { code: '+228', label: '🇹🇬 Togo (+228)' },
  { code: '+229', label: '🇧🇯 Bénin (+229)' },
  { code: '+224', label: '🇬🇳 Guinée (+224)' },
  { code: '+222', label: '🇲🇷 Mauritanie (+222)' },
  { code: '+237', label: '🇨🇲 Cameroun (+237)' },
  { code: '+241', label: '🇬🇦 Gabon (+241)' },
  { code: '+212', label: '🇲🇦 Maroc (+212)' },
  { code: '+1', label: '🇨🇦 Canada / 🇺🇸 USA (+1)' },
  { code: '+32', label: '🇧🇪 Belgique (+32)' },
  { code: '+41', label: '🇨🇭 Suisse (+41)' }
];

const BUDGET_BRACKETS = [
  { id: 't1', min: 50000, max: 100000, label: '50 000 – 100 000' },
  { id: 't2', min: 100000, max: 200000, label: '100 000 – 200 000' },
  { id: 't3', min: 200000, max: 300000, label: '200 000 – 300 000' },
  { id: 't4', min: 300000, max: 400000, label: '300 000 – 400 000' },
  { id: 't5', min: 400000, max: 500000, label: '400 000 – 500 000' },
  { id: 't6', min: 500000, max: 750000, label: '500 000 – 750 000' },
  { id: 't7', min: 750000, max: 1000000, label: '750 000 – 1 000 000' },
  { id: 't8', min: 1000000, max: null, label: 'Plus de 1 000 000' }
];

function App() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('bsk_brief_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_STATE,
          ...parsed,
          styles_visuels: parsed.styles_visuels || [],
          formats: parsed.formats || [],
          documents: parsed.documents || [],
          liste_questions: parsed.liste_questions || []
        };
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_STATE;
  });

  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem('bsk_brief_step');
    if (savedStep) {
      const parsed = parseInt(savedStep, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 12) {
        return parsed;
      }
    }
    return 0;
  });

  const [usdRate, setUsdRate] = useState(1.08);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const countryDropdownRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bsk_brief_draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('bsk_brief_step', step.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowValidationErrors(false);
  }, [step]);

  // Fetch USD rate once at mount
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.USD) {
          setUsdRate(data.rates.USD);
        }
      })
      .catch(err => {
        console.warn("Échec du chargement du taux USD dynamique, utilisation de 1.08", err);
      });
  }, []);

  // Handle click outside country dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReset = () => {
    if (window.confirm("Voulez-vous réinitialiser toutes les données du formulaire et recommencer ?")) {
      setFormData(INITIAL_STATE);
      setStep(0);
      setCountrySearch('');
      localStorage.removeItem('bsk_brief_draft');
      localStorage.removeItem('bsk_brief_step');
    }
  };

  const isStepValid = (s) => {
    switch (s) {
      case 0:
        return (
          formData.nom_complet.trim().length > 0 &&
          formData.telephone_number.trim().length >= 7 &&
          formData.pays.trim().length > 0
        );
      case 1:
        if (formData.type_projet === '6') {
          return formData.autre_precision.trim().length > 0;
        }
        return formData.type_projet !== '';
      case 2:
        return formData.description.trim().length >= 10 && formData.objectif !== '';
      case 3:
        if (formData.duree === 'personnalise') {
          return formData.duree_personnalise && formData.duree_personnalise.trim().length > 0;
        }
        return formData.duree !== '';
      case 4:
        if (formData.type_voix === 'humaine') {
          if (!formData.fournisseur_voix_humaine) return false;
        } else if (formData.type_voix === 'ia') {
          if (!formData.fournisseur_voix_ia) return false;
        }
        return formData.type_voix !== '' && formData.gestion_script !== '';
      case 5:
        return formData.styles_visuels.length > 0;
      case 6:
        return formData.niveau_complexite !== '';
      case 7:
        return formData.formats.length > 0;
      case 8:
        return true;
      case 9: // Budget Estimatif
        return formData.budget_bracket !== '';
      case 10: // Conditions & Droits
        return (
          formData.fichiers_sources !== '' &&
          formData.droits_diffusion !== '' &&
          formData.delai_livraison !== '' &&
          formData.conditions_acceptation === true
        );
      case 11: // Questions
        return true;
      case 12: // Récapitulatif
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(step)) {
      if (step < 12) {
        setStep(step + 1);
      }
    } else {
      setShowValidationErrors(true);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      const updated = arr.includes(value) 
        ? arr.filter(item => item !== value)
        : [...arr, value];
      return { ...prev, [field]: updated };
    });
  };

  const addQuestion = () => {
    if (newQuestion.trim().length > 0) {
      setFormData(prev => ({
        ...prev,
        liste_questions: [...prev.liste_questions, newQuestion.trim()]
      }));
      setNewQuestion('');
    }
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      liste_questions: prev.liste_questions.filter((_, idx) => idx !== index)
    }));
  };

  const getBracketLabel = (bracket) => {
    if (formData.devise === 'FCFA') {
      return bracket.max 
        ? `${bracket.label} FCFA` 
        : `Plus de 1 000 000 FCFA`;
    } else if (formData.devise === 'EUR') {
      const minEur = Math.round(bracket.min / 655.957);
      const maxEur = bracket.max ? Math.round(bracket.max / 655.957) : null;
      return maxEur ? `${minEur} – ${maxEur} €` : `Plus de 1 524 €`;
    } else {
      const minUsd = Math.round((bracket.min / 655.957) * usdRate);
      const maxUsd = bracket.max ? Math.round((bracket.max / 655.957) * usdRate) : null;
      return maxUsd ? `~${minUsd} – ${maxUsd} $` : `Plus de ~1 700 $`;
    }
  };

  const handlePDFExport = () => {
    setIsExportingPDF(true);
    setTimeout(() => {
      generatePDF('recap-content', formData.nom_complet)
        .then(() => setIsExportingPDF(false))
        .catch(() => setIsExportingPDF(false));
    }, 500);
  };

  const progressPercentage = ((step + 1) / 13) * 100;

  const stepMeta = [
    { title: "VOS COORDONNÉES", desc: "Commençons par vous connaître pour faciliter nos échanges.", icon: User },
    { title: "TYPE DE PROJET", desc: "Sélectionnez la catégorie qui correspond le mieux à votre besoin.", icon: Video },
    { title: "DESCRIPTION DU PROJET", desc: "Partagez la vision globale et les objectifs de votre vidéo.", icon: AlignLeft },
    { title: "DURÉE DU SPOT", desc: "Définissez la longueur idéale pour transmettre votre message.", icon: Clock },
    { title: "VOIX OFF & SCRIPT", desc: "Comment souhaitez-vous gérer la narration ?", icon: Mic },
    { title: "DIRECTION ARTISTIQUE", desc: "Sélectionnez le ou les styles visuels qui vous inspirent.", icon: Palette },
    { title: "NIVEAU DE COMPLEXITÉ", desc: "Définissez le niveau de sophistication de l'animation.", icon: Layers },
    { title: "FORMAT & DIFFUSION", desc: "Sur quelles plateformes la vidéo sera-t-elle diffusée ?", icon: Maximize },
    { title: "RÉFÉRENCE & DOCUMENTS", desc: "Montrez-nous ce que vous aimez (optionnel).", icon: LinkIcon },
    { title: "BUDGET ESTIMATIF", desc: "Indiquez votre enveloppe budgétaire pour que nous puissions adapter notre proposition.", icon: DollarSign },
    { title: "CONDITIONS & DROITS", desc: "Définissez le cadre légal et les modalités de livraison de votre projet.", icon: Scale },
    { title: "AVEZ-VOUS DES QUESTIONS ?", desc: "Posez toutes vos questions, j'y répondrai dans le devis.", icon: HelpCircle },
    { title: "RÉCAPITULATIF & ENVOI", desc: "Vérifiez vos informations avant de transmettre le brief.", icon: FileText }
  ];

  const currentMeta = stepMeta[step];
  const StepIcon = currentMeta.icon;

  return (
    <div className="min-h-screen relative flex flex-col justify-between py-8 px-4 md:px-12 bg-bsk-bg">
      {/* Background ambient lighting for clean light layout */}
      <div className="absolute top-1/4 left-1/3 w-[35rem] h-[35rem] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] rounded-full bg-bsk-gold/10 blur-[110px] pointer-events-none"></div>

      {/* Global CSS noise texture overlay */}
      <div className="noise-overlay"></div>

      {/* Header section in light mode */}
      <header className="max-w-4xl w-full mx-auto mb-8 flex justify-between items-center border-b border-slate-200 pb-5 z-10">
        <div>
          <span className="font-title font-extrabold text-2xl tracking-tighter text-bsk-blue hover:text-bsk-blue-light transition-colors duration-300 cursor-default">
            BSK <span className="text-bsk-gold font-light">DEZIGNER</span>
          </span>
          <span className="hidden sm:inline-block ml-3 px-2.5 py-0.5 text-[10px] font-mono tracking-widest bg-slate-100 border border-slate-200 rounded text-bsk-muted uppercase">
            Brief Platform
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-title text-xs sm:text-sm font-bold tracking-tight text-bsk-blue bg-blue-50 border border-blue-200/60 px-3.5 py-1.5 rounded-full">
            ÉTAPE {String(step + 1).padStart(2, '0')} / 13
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-full border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all duration-300 cursor-pointer font-sans"
            title="Réinitialiser le formulaire"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        </div>
      </header>

      {/* Progress Bar (modern light mode glowing line) */}
      <div className="max-w-4xl w-full mx-auto mb-10 bg-slate-200 h-1.5 rounded-full overflow-hidden z-10 relative">
        <div 
          className="bg-gradient-to-r from-bsk-blue to-bsk-blue-light h-full transition-all duration-500 ease-out" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Main Form container */}
      <main className="flex-grow max-w-4xl w-full mx-auto flex flex-col justify-start z-10 mb-10">
        
        {/* Step Banner */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-bsk-blue hidden sm:block">
            <StepIcon size={24} />
          </div>
          <div>
            <h1 className="font-title text-2xl md:text-3.5xl font-extrabold text-bsk-text tracking-tight leading-tight">
              {currentMeta.title}
            </h1>
            <p className="text-sm md:text-base text-bsk-muted mt-1 font-sans">
              {currentMeta.desc}
            </p>
          </div>
        </div>

        {/* Form container - Clean dashboard light mode */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-xl min-h-[380px] flex flex-col justify-between relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full h-full flex-grow flex flex-col font-sans"
            >
              
              {/* --- STEP 01 : VOS COORDONNÉES --- */}
              {step === 0 && (
                <div className="space-y-6 flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom complet */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Nom complet <span className="text-bsk-blue-light font-black">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nom_complet}
                        onChange={e => setFormData(prev => ({ ...prev, nom_complet: e.target.value }))}
                        placeholder="Votre nom"
                        className={`w-full bg-slate-50 border rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300 ${
                          showValidationErrors && !formData.nom_complet.trim() ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                        }`}
                      />
                      {showValidationErrors && !formData.nom_complet.trim() && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium">Le nom complet est obligatoire.</p>
                      )}
                    </div>

                    {/* Entreprise */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Nom de l'entreprise
                      </label>
                      <input
                        type="text"
                        value={formData.entreprise}
                        onChange={e => setFormData(prev => ({ ...prev, entreprise: e.target.value }))}
                        placeholder="Votre société (optionnel)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Téléphone WhatsApp */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Téléphone (WhatsApp) <span className="text-bsk-blue-light font-black">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={formData.indicatif}
                          onChange={e => setFormData(prev => ({ ...prev, indicatif: e.target.value }))}
                          className="bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-3 text-bsk-text text-sm focus:outline-none focus:border-bsk-blue cursor-pointer"
                        >
                          {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code} className="bg-white text-bsk-text">
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          required
                          value={formData.telephone_number}
                          onChange={e => setFormData(prev => ({ ...prev, telephone_number: e.target.value.replace(/[^0-9\s]/g, '') }))}
                          placeholder="77 123 45 67"
                          className={`flex-grow bg-slate-50 border rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300 ${
                            showValidationErrors && formData.telephone_number.trim().length < 7 ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                          }`}
                        />
                      </div>
                      {showValidationErrors && formData.telephone_number.trim().length < 7 && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium">Veuillez renseigner un numéro valide.</p>
                      )}
                    </div>

                    {/* WhatsApp Username */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Identifiant WhatsApp (Handle / Pseudo)
                      </label>
                      <input
                        type="text"
                        value={formData.identifiant_whatsapp}
                        onChange={e => setFormData(prev => ({ ...prev, identifiant_whatsapp: e.target.value }))}
                        placeholder="@votre_pseudo (optionnel)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pays de résidence */}
                    <div className="relative" ref={countryDropdownRef}>
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Pays de résidence <span className="text-bsk-blue-light font-black">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pays}
                        onFocus={() => setShowCountryDropdown(true)}
                        onChange={e => {
                          setFormData(prev => ({ ...prev, pays: e.target.value }));
                          setCountrySearch(e.target.value);
                          setShowCountryDropdown(true);
                        }}
                        placeholder="Votre pays"
                        className={`w-full bg-slate-50 border rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300 ${
                          showValidationErrors && !formData.pays.trim() ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                        }`}
                      />
                      {showValidationErrors && !formData.pays.trim() && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium">Le pays est obligatoire.</p>
                      )}

                      {/* Autocomplete Dropdown - light mode glass */}
                      {showCountryDropdown && (
                        <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl max-h-48 overflow-y-auto z-20 shadow-2xl">
                          {countriesList
                            .filter(c => c.toLowerCase().includes(formData.pays.toLowerCase()))
                            .map((country, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, pays: country }));
                                  setShowCountryDropdown(false);
                                }}
                                className="w-full text-left px-5 py-3 text-sm text-bsk-text hover:bg-slate-50 hover:text-bsk-blue border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer"
                              >
                                {country}
                              </button>
                            ))}
                          {countriesList.filter(c => c.toLowerCase().includes(formData.pays.toLowerCase())).length === 0 && (
                            <div className="px-5 py-3 text-sm text-bsk-muted font-light">
                              Aucun pays correspondant. Saisie libre autorisée.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- STEP 02 : TYPE DE PROJET --- */}
              {step === 1 && (
                <div className="space-y-6 flex-grow">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { id: '1', title: 'Spot · App Mobile', desc: 'Promo application iOS/Android' },
                      { id: '2', title: 'Spot · App Web', desc: 'Présentation plateforme web' },
                      { id: '3', title: 'Spot · Plateforme SAAS', desc: 'Explication logiciel B2B' },
                      { id: '4', title: 'Spot Évènementiel', desc: 'Teaser ou récap événement' },
                      { id: '5', title: 'Motion Flyer', desc: 'Affiche animée réseaux sociaux' },
                      { id: '6', title: 'Autre besoin', desc: 'Précisez votre demande' }
                    ].map(proj => {
                      const isSelected = formData.type_projet === proj.id;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type_projet: proj.id }))}
                          className={`flex flex-col text-left p-6 border rounded-[1.5rem] transition-all duration-300 hover:scale-[1.03] cursor-pointer outline-none ${
                            isSelected 
                              ? 'border-bsk-blue bg-blue-50/50 shadow-md ring-1 ring-bsk-blue' 
                              : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                          }`}
                        >
                          <span className="font-title font-bold text-bsk-text text-base tracking-tight">{proj.title}</span>
                          <span className="text-xs text-bsk-muted mt-2.5 font-light leading-relaxed">{proj.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {formData.type_projet === '6' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Précisez votre besoin <span className="text-bsk-blue-light font-black">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.autre_precision}
                        onChange={e => setFormData(prev => ({ ...prev, autre_precision: e.target.value }))}
                        placeholder="Ex : Habillage TV, générique YouTube..."
                        className={`w-full bg-slate-50 border rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300 ${
                          showValidationErrors && !formData.autre_precision.trim() ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                        }`}
                      />
                      {showValidationErrors && !formData.autre_precision.trim() && (
                        <p className="text-red-500 text-xs mt-1.5">Veuillez préciser votre besoin.</p>
                      )}
                    </motion.div>
                  )}

                  {showValidationErrors && !formData.type_projet && (
                    <p className="text-red-500 text-sm font-medium">Veuillez choisir un type de projet.</p>
                  )}
                </div>
              )}

              {/* --- STEP 03 : DESCRIPTION DU PROJET --- */}
              {step === 2 && (
                <div className="space-y-6 flex-grow">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                      Décrivez votre projet en détail <span className="text-bsk-blue-light font-black">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Contexte, cible, message clé, ambiance générale..."
                      className={`w-full bg-slate-50 border rounded-[1.5rem] py-4 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300 resize-none font-sans ${
                        showValidationErrors && formData.description.trim().length < 10 ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                      }`}
                    />
                    {showValidationErrors && formData.description.trim().length < 10 && (
                      <p className="text-red-500 text-xs mt-1.5">La description doit faire au moins 10 caractères.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-3 font-bold font-title">
                      Objectif principal <span className="text-bsk-blue-light font-black">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { id: 'notoriete', label: 'Notoriété de marque' },
                        { id: 'conversion', label: 'Conversion & Ventes' },
                        { id: 'explication', label: 'Explication de service' },
                        { id: 'promo', label: 'Promotion Évènementielle' },
                        { id: 'croissance', label: 'Croissance Réseaux' }
                      ].map(obj => {
                        const isSelected = formData.objectif === obj.id;
                        return (
                          <button
                            key={obj.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, oex: obj.id, objectif: obj.id }))}
                            className={`flex items-center gap-3.5 p-4 border rounded-xl text-left transition-all duration-300 hover:scale-[1.02] cursor-pointer outline-none ${
                              isSelected
                                ? 'border-bsk-blue bg-blue-50/50 text-bsk-blue font-bold shadow-sm'
                                : 'border-slate-200 bg-white text-bsk-muted'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-bsk-blue bg-bsk-blue' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm font-sans font-medium">{obj.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {showValidationErrors && !formData.objectif && (
                      <p className="text-red-500 text-xs mt-2">Veuillez sélectionner un objectif principal.</p>
                    )}
                  </div>
                </div>
              )}

              {/* --- STEP 04 : DURÉE DU SPOT --- */}
              {step === 3 && (
                <div className="space-y-6 flex-grow">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'ultra-court', title: 'Moins de 30 secondes', desc: "Format ultra-court, impact rapide pour TikTok/Reels" },
                      { id: 'equilibre', title: '30s à 45 secondes', desc: "Format équilibré pour réseaux sociaux" },
                      { id: 'standard', title: '45s à 60 secondes', desc: "Format standard pour présentation complète" },
                      { id: 'storytelling', title: 'Plus de 60 secondes', desc: "Format long pour storytelling approfondi" },
                      { id: 'personnalise', title: 'Durée personnalisée...', desc: "Saisissez la durée spécifique dont vous avez besoin" }
                    ].map(dur => {
                      const isSelected = formData.duree === dur.id;
                      return (
                        <button
                          key={dur.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, duree: dur.id }))}
                          className={`flex flex-col text-left p-6 border rounded-[1.5rem] transition-all duration-300 hover:scale-[1.03] cursor-pointer outline-none ${
                            isSelected
                              ? 'border-bsk-blue bg-blue-50/50 shadow-md ring-1 ring-bsk-blue'
                              : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                          }`}
                        >
                          <span className="font-title font-bold text-bsk-text text-base tracking-tight">{dur.title}</span>
                          <span className="text-xs text-bsk-muted mt-2.5 font-light leading-relaxed">{dur.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {formData.duree === 'personnalise' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 max-w-md mx-auto"
                    >
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Précisez la durée personnalisée <span className="text-bsk-blue-light font-black">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.duree_personnalise || ''}
                        onChange={e => setFormData(prev => ({ ...prev, duree_personnalise: e.target.value }))}
                        placeholder="Ex : 2 minutes 30 secondes, 5 minutes..."
                        className={`w-full bg-slate-50 border rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300 ${
                          showValidationErrors && (!formData.duree_personnalise || !formData.duree_personnalise.trim()) ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
                        }`}
                      />
                      {showValidationErrors && (!formData.duree_personnalise || !formData.duree_personnalise.trim()) && (
                        <p className="text-red-500 text-xs mt-1.5">Veuillez renseigner votre durée spécifique.</p>
                      )}
                    </motion.div>
                  )}

                  {showValidationErrors && !formData.duree && (
                    <p className="text-red-500 text-sm font-medium">Veuillez sélectionner une durée.</p>
                  )}
                </div>
              )}

              {/* --- STEP 05 : VOIX OFF & SCRIPT --- */}
              {step === 4 && (
                <div className="space-y-6 flex-grow">
                  {/* Type de voix */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-3 font-bold font-title">
                      Type de voix <span className="text-bsk-blue-light font-black">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'humaine', title: 'Voix humaine naturelle', desc: 'Voix off professionnelle enregistrée en studio' },
                        { id: 'ia', title: 'Voix générée par IA', desc: 'Option économique et rapide' },
                        { id: 'aucune', title: 'Pas de voix off', desc: 'Musique & Textes seuls' }
                      ].map(voice => {
                        const isSelected = formData.type_voix === voice.id;
                        return (
                          <button
                            key={voice.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type_voix: voice.id }))}
                            className={`flex flex-col text-left p-5 border rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer outline-none ${
                              isSelected
                                ? 'border-bsk-blue bg-blue-50/50 shadow-md ring-1 ring-bsk-blue'
                                : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                            }`}
                          >
                            <span className="font-title font-bold text-sm text-bsk-text tracking-tight">{voice.title}</span>
                            <span className="text-xs text-bsk-muted mt-2 font-light leading-relaxed">{voice.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {showValidationErrors && !formData.type_voix && (
                      <p className="text-red-500 text-xs mt-1.5">Le choix de la voix off est obligatoire.</p>
                    )}
                  </div>

                  {/* Options complémentaires si Voix Humaine sélectionnée */}
                  {formData.type_voix === 'humaine' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-5 bg-slate-50 border border-slate-200 rounded-2xl"
                    >
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-3 font-bold font-title">
                        Qui fournit le fichier de voix humaine naturelle ? <span className="text-bsk-blue-light font-black">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 'client', title: 'Fourni par le client (vous)', desc: 'Vous nous transmettez le fichier audio propre de la voix off' },
                          { id: 'bsk', title: 'À produire par BSK Dezigner', desc: 'Nous recrutons le comédien voix off et gérons la production audio' }
                        ].map(prov => {
                          const isSel = formData.fournisseur_voix_humaine === prov.id;
                          return (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, fournisseur_voix_humaine: prov.id }))}
                              className={`flex flex-col text-left p-4 border rounded-xl transition-all duration-300 outline-none cursor-pointer ${
                                isSel ? 'border-bsk-blue bg-white text-bsk-blue font-bold shadow-sm' : 'border-slate-200 bg-white text-bsk-muted'
                              }`}
                            >
                              <span className="text-xs font-title font-bold">{prov.title}</span>
                              <span className="text-[11px] font-sans font-light mt-1 leading-normal">{prov.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                      {showValidationErrors && !formData.fournisseur_voix_humaine && (
                        <p className="text-red-500 text-xs mt-2 font-medium">Veuillez préciser le fournisseur de la voix off.</p>
                      )}
                    </motion.div>
                  )}

                  {/* Options complémentaires si Voix IA sélectionnée */}
                  {formData.type_voix === 'ia' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-5 bg-slate-50 border border-slate-200 rounded-2xl"
                    >
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-3 font-bold font-title">
                        Qui fournit le fichier de voix off IA ? <span className="text-bsk-blue-light font-black">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 'client', title: 'Fourni par le client (vous)', desc: 'Vous générez le fichier audio et nous le transmettez' },
                          { id: 'bsk', title: 'À produire par BSK Dezigner', desc: 'Nous gérons la génération de la voix IA selon le ton souhaité' }
                        ].map(prov => {
                          const isSel = formData.fournisseur_voix_ia === prov.id;
                          return (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, fournisseur_voix_ia: prov.id }))}
                              className={`flex flex-col text-left p-4 border rounded-xl transition-all duration-300 outline-none cursor-pointer ${
                                isSel ? 'border-bsk-blue bg-white text-bsk-blue font-bold shadow-sm' : 'border-slate-200 bg-white text-bsk-muted'
                              }`}
                            >
                              <span className="text-xs font-title font-bold">{prov.title}</span>
                              <span className="text-[11px] font-sans font-light mt-1 leading-normal">{prov.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                      {showValidationErrors && !formData.fournisseur_voix_ia && (
                        <p className="text-red-500 text-xs mt-2 font-medium">Veuillez préciser le fournisseur de la voix IA.</p>
                      )}
                    </motion.div>
                  )}

                  {/* Gestion du script */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-3 font-bold font-title">
                      Gestion du script <span className="text-bsk-blue-light font-black">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'client', title: 'Je fournis le script complet', desc: 'Vous fournissez le texte final de la narration' },
                        { id: 'bsk', title: 'Je confie la rédaction à BSK Dezigner', desc: 'Notre équipe rédige le script selon vos directives' }
                      ].map(script => {
                        const isSelected = formData.gestion_script === script.id;
                        return (
                          <button
                            key={script.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, gestion_script: script.id }))}
                            className={`flex flex-col text-left p-5 border rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer outline-none ${
                              isSelected
                                ? 'border-bsk-blue bg-blue-50/50 shadow-md ring-1 ring-bsk-blue'
                                : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                            }`}
                          >
                            <span className="font-title font-bold text-sm text-bsk-text tracking-tight">{script.title}</span>
                            <span className="text-xs text-bsk-muted mt-2 font-light leading-relaxed">{script.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {showValidationErrors && !formData.gestion_script && (
                      <p className="text-red-500 text-xs mt-1.5">Le choix de la gestion du script est obligatoire.</p>
                    )}
                  </div>
                </div>
              )}

              {/* --- STEP 06 : DIRECTION ARTISTIQUE --- */}
              {step === 5 && (
                <div className="space-y-6 flex-grow">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'minimaliste', title: 'Minimaliste & Épuré', desc: "Design moderne, beaucoup d'espace blanc, typo soignée" },
                      { id: 'futuriste', title: 'Futuriste & Sophistiqué', desc: "Néons, UI tech, ambiance sombre et pro" },
                      { id: 'chaleureux', title: 'Chaleureux & Humain', desc: "Couleurs douces, formes organiques, illustrations" },
                      { id: 'energique', title: 'Énergique & Urbain', desc: "Rythme rapide, glitch, couleurs vives, typographie forte" }
                    ].map(style => {
                      const isSelected = formData.styles_visuels.includes(style.id);
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => toggleArrayItem('styles_visuels', style.id)}
                          className={`flex items-start gap-4 text-left p-6 border rounded-[1.5rem] transition-all duration-300 hover:scale-[1.03] cursor-pointer outline-none ${
                            isSelected
                              ? 'border-bsk-blue bg-blue-50/50 shadow-md ring-1 ring-bsk-blue'
                              : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                          }`}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border text-white flex-shrink-0 ${
                            isSelected ? 'bg-bsk-blue border-bsk-blue' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check size={14} />}
                          </div>
                          <div>
                            <span className="font-title font-bold text-bsk-text text-base tracking-tight block">{style.title}</span>
                            <span className="text-xs text-bsk-muted mt-2 font-light leading-relaxed block">{style.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {showValidationErrors && formData.styles_visuels.length === 0 && (
                    <p className="text-red-500 text-sm font-medium">Veuillez sélectionner au moins un style visuel.</p>
                  )}
                </div>
              )}

              {/* --- STEP 07 : NIVEAU DE COMPLEXITÉ --- */}
              {step === 6 && (
                <div className="space-y-6 flex-grow">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { 
                        id: 'standard', 
                        title: 'STANDARD — Essentiel', 
                        desc: "Animation 2D épurée, transitions fluides. Efficace et direct.", 
                        badge: null 
                      },
                      { 
                        id: 'premium', 
                        title: 'PREMIUM — Avancé', 
                        desc: "Effets visuels poussés, particules, profondeur 2.5D. Rendu très professionnel.", 
                        badge: 'Recommandé' 
                      },
                      { 
                        id: 'signature', 
                        title: 'SIGNATURE — Sur Mesure', 
                        desc: "Animation haut de gamme avec direction artistique exclusive, effets 3D, illustrations originales et son design personnalisé. Le summum du savoir-faire BSK Dezigner.", 
                        badge: null 
                      }
                    ].map(lvl => {
                      const isSelected = formData.niveau_complexite === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, niveau_complexite: lvl.id }))}
                          className={`relative flex flex-col sm:flex-row sm:items-center sm:justify-between text-left p-6 border rounded-[1.5rem] transition-all duration-300 hover:scale-[1.01] cursor-pointer outline-none ${
                            isSelected
                              ? 'border-bsk-blue bg-blue-50/50 shadow-md ring-1 ring-bsk-blue'
                              : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                          }`}
                        >
                          <div className="pr-4">
                            <div className="flex items-center gap-3">
                              <span className="font-title font-bold text-lg text-bsk-text tracking-tight">{lvl.title}</span>
                              {lvl.badge && (
                                <span className="bg-bsk-gold text-black text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider font-title">
                                  {lvl.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-bsk-muted mt-2 font-light leading-relaxed max-w-xl">{lvl.desc}</p>
                          </div>
                          <div className={`mt-4 sm:mt-0 w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-bsk-blue bg-bsk-blue' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {showValidationErrors && !formData.niveau_complexite && (
                    <p className="text-red-500 text-sm font-medium">Veuillez choisir un niveau de complexité.</p>
                  )}
                </div>
              )}

              {/* --- STEP 08 : FORMAT & DIFFUSION --- */}
              {step === 7 && (
                <div className="space-y-6 flex-grow">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'horizontal', title: '16:9 Horizontal', desc: 'YouTube, Web, TV' },
                      { id: 'vertical', title: '9:16 Vertical', desc: 'TikTok, Reels, Shorts' },
                      { id: 'carre', title: '1:1 Carré', desc: 'Feed Instagram/FB' }
                    ].map(fmt => {
                      const isSelected = formData.formats.includes(fmt.id);
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => toggleArrayItem('formats', fmt.id)}
                          className={`flex flex-col text-left p-5 border rounded-[1.5rem] transition-all duration-300 hover:scale-[1.03] cursor-pointer outline-none ${
                            isSelected
                              ? 'border-bsk-blue bg-blue-50/50 shadow-md ring-1 ring-bsk-blue'
                              : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full mb-3">
                            <span className="font-title font-bold text-bsk-text text-base tracking-tight">{fmt.title}</span>
                            <div className={`w-5 h-5 rounded flex items-center justify-center border text-white flex-shrink-0 ${
                              isSelected ? 'bg-bsk-blue border-bsk-blue' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check size={14} />}
                            </div>
                          </div>
                          <span className="text-xs text-bsk-muted mt-auto font-light">{fmt.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-slate-50 border border-bsk-gold rounded-[1.5rem] p-5 mt-6 flex items-start gap-4">
                    <div className="text-bsk-gold-dark mt-1 flex-shrink-0">
                      <HelpCircle size={20} />
                    </div>
                    <p className="text-xs sm:text-sm text-bsk-muted leading-relaxed font-light">
                      <strong className="text-bsk-text font-bold">Note sur les formats multiples :</strong> La déclinaison d'une même vidéo en plusieurs formats (ex. 16:9 + 9:16) implique un travail de recomposition. Un supplément de <span className="text-bsk-blue font-bold">30% du tarif de base s'applique par format additionnel</span>.
                    </p>
                  </div>

                  {showValidationErrors && formData.formats.length === 0 && (
                    <p className="text-red-500 text-sm font-medium">Veuillez sélectionner au moins un format de diffusion.</p>
                  )}
                </div>
              )}

              {/* --- STEP 09 : RÉFÉRENCE & DOCUMENTS --- */}
              {step === 8 && (
                <div className="space-y-6 flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Lien de référence (inspiration)
                      </label>
                      <input
                        type="url"
                        value={formData.lien_reference}
                        onChange={e => setFormData(prev => ({ ...prev, lien_reference: e.target.value }))}
                        placeholder="URL YouTube, Vimeo, TikTok..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title">
                        Qu'est-ce qui vous plaît dans cette référence ?
                      </label>
                      <input
                        type="text"
                        value={formData.ce_qui_plait}
                        onChange={e => setFormData(prev => ({ ...prev, ce_qui_plait: e.target.value }))}
                        placeholder="L'énergie, les couleurs, la fluidité..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-3 font-bold font-title">
                      Documents disponibles
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'cahier_des_charges', title: "J'ai un cahier des charges détaillé à transmettre" },
                        { id: 'charte_graphique', title: "J'ai une charte graphique stricte à respecter" }
                      ].map(doc => {
                        const isSelected = formData.documents.includes(doc.id);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => toggleArrayItem('documents', doc.id)}
                            className={`flex items-center gap-4 text-left p-5 border rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer outline-none ${
                              isSelected
                                ? 'border-bsk-blue bg-blue-50/50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border text-white flex-shrink-0 ${
                              isSelected ? 'bg-bsk-blue border-bsk-blue' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check size={14} />}
                            </div>
                            <span className="text-sm text-bsk-text font-medium">{doc.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- STEP 10 (Nouveau): BUDGET ESTIMATIF (Déplacé après Références & Documents) --- */}
              {step === 9 && (
                <div className="space-y-6 flex-grow">
                  {/* Selecteur de devise */}
                  <div className="flex justify-center">
                    <div className="flex bg-slate-100 border border-slate-200 p-1.5 rounded-full">
                      {[
                        { id: 'FCFA', label: '🇸🇳 FCFA' },
                        { id: 'EUR', label: '🇪🇺 EUR' },
                        { id: 'USD', label: '🇺🇸 USD' }
                      ].map(dev => {
                        const isActive = formData.devise === dev.id;
                        return (
                          <button
                            key={dev.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, devise: dev.id }))}
                            className={`px-7 py-2.5 rounded-full text-xs sm:text-sm font-title font-bold tracking-tight transition-all duration-300 cursor-pointer ${
                              isActive 
                                ? 'bg-bsk-blue text-white shadow-md' 
                                : 'text-bsk-muted hover:text-bsk-text'
                            }`}
                          >
                            {dev.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fourchettes budgétaires */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {BUDGET_BRACKETS.map(bracket => {
                      const isSelected = formData.budget_bracket === bracket.id;
                      const label = getBracketLabel(bracket);
                      return (
                        <button
                          key={bracket.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, budget_bracket: bracket.id }))}
                          className={`flex flex-col items-center justify-center p-5 border rounded-[1.5rem] text-center transition-all duration-300 hover:scale-[1.03] cursor-pointer outline-none ${
                            isSelected
                              ? 'border-bsk-blue bg-blue-50/50 shadow-md ring-1 ring-bsk-blue'
                              : 'border-slate-200 bg-white hover:border-bsk-blue/40'
                          }`}
                        >
                          <span className="text-[10px] text-bsk-gold-dark uppercase tracking-widest mb-2 font-bold font-title">{bracket.id}</span>
                          <span className="font-title font-bold text-bsk-text text-sm sm:text-base tracking-tight">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {showValidationErrors && !formData.budget_bracket && (
                    <p className="text-red-500 text-sm font-medium">Veuillez sélectionner une fourchette budgétaire.</p>
                  )}

                  {/* Budget précis */}
                  <div className="max-w-md mx-auto pt-5 border-t border-slate-200">
                    <label className="block text-xs uppercase tracking-widest text-bsk-muted mb-2 font-bold font-title text-center">
                      Budget précis (facultatif)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={formData.budget_precis}
                        onChange={e => setFormData(prev => ({ ...prev, budget_precis: e.target.value.replace(/[^0-9]/g, '') }))}
                        placeholder="Saisissez un montant exact"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-5 pr-16 text-bsk-text text-center focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300"
                      />
                      <span className="absolute right-5 font-title font-extrabold text-bsk-blue text-sm tracking-wide">
                        {formData.devise}
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-bsk-muted italic max-w-lg mx-auto leading-relaxed font-light">
                    Cette fourchette nous aide à dimensionner la proposition. Un devis détaillé vous sera envoyé avant tout engagement.
                  </p>
                </div>
              )}

              {/* --- STEP 11 (Nouveau): CONDITIONS & DROITS (Déplacé après Budget) --- */}
              {step === 10 && (
                <div className="space-y-6 flex-grow">
                  
                  <div>
                    <span className="block text-xs uppercase tracking-widest text-bsk-blue-light mb-2 font-bold font-title">
                      A. FICHIERS SOURCES (Rachat de droits)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { 
                          id: 'non', 
                          title: 'Non — Vidéo finale uniquement (.mp4 / .mov)', 
                          desc: 'Inclus. Pas de fichiers de montage.' 
                        },
                        { 
                          id: 'oui', 
                          title: 'Oui — Acquérir les fichiers sources (.aep / .prproj)', 
                          desc: 'Savoir-faire et droit de propriété intellectuelle. Supplément +100%.' 
                        }
                      ].map(fs => {
                        const isSelected = formData.fichiers_sources === fs.id;
                        return (
                          <button
                            key={fs.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, fichiers_sources: fs.id }))}
                            className={`flex flex-col text-left p-4.5 border rounded-xl transition-all duration-300 outline-none cursor-pointer ${
                              isSelected ? 'border-bsk-blue bg-blue-50/50 text-bsk-text' : 'border-slate-200 bg-white text-bsk-muted'
                            }`}
                          >
                            <span className="font-title font-bold text-sm tracking-tight">{fs.title}</span>
                            <span className="text-xs mt-2 font-light opacity-80 leading-relaxed">{fs.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Droits de diffusion */}
                    <div>
                      <span className="block text-xs uppercase tracking-widest text-bsk-blue-light mb-2 font-bold font-title">
                        B. DROITS DE DIFFUSION (Portfolio)
                      </span>
                      <div className="space-y-2">
                        {[
                          { 
                            id: 'oui', 
                            title: 'Autorisation Portfolio', 
                            desc: 'BSK peut publier après que vous ayez diffusé le projet.' 
                          },
                          { 
                            id: 'non', 
                            title: 'Confidentiel — White Label', 
                            desc: 'Aucune publication de BSK. Supplément +50%.' 
                          }
                        ].map(diff => {
                          const isSelected = formData.droits_diffusion === diff.id;
                          return (
                            <button
                              key={diff.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, droits_diffusion: diff.id }))}
                              className={`w-full flex flex-col text-left p-4 border rounded-xl transition-all duration-300 outline-none cursor-pointer ${
                                isSelected ? 'border-bsk-blue bg-blue-50/50 text-bsk-text' : 'border-slate-200 bg-white text-bsk-muted'
                              }`}
                            >
                              <span className="font-title font-bold text-xs sm:text-sm tracking-tight">{diff.title}</span>
                              <span className="text-[11px] mt-1.5 font-light opacity-85 leading-relaxed">{diff.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conditions de livraison */}
                    <div>
                      <span className="block text-xs uppercase tracking-widest text-bsk-blue-light mb-2 font-bold font-title">
                        C. CONDITIONS DE LIVRAISON
                      </span>
                      <div className="space-y-2">
                        {[
                          { 
                            id: 'standard', 
                            title: 'Livraison Standard (3+ jours ouvrés)', 
                            desc: 'Délai standard. Validation par capture/watermark avant livraison.' 
                          },
                          { 
                            id: 'urgente', 
                            title: '⚡ Livraison Urgente (1 à 2 jours max)', 
                            desc: 'Production urgente prioritaire. Facturation majorée.' 
                          }
                        ].map(deliv => {
                          const isSelected = formData.delai_livraison === deliv.id;
                          return (
                            <button
                              key={deliv.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, delai_livraison: deliv.id }))}
                              className={`w-full flex flex-col text-left p-4 border rounded-xl transition-all duration-300 outline-none cursor-pointer ${
                                isSelected ? 'border-bsk-blue bg-blue-50/50 text-bsk-text' : 'border-slate-200 bg-white text-bsk-muted'
                              }`}
                            >
                              <span className="font-title font-bold text-xs sm:text-sm tracking-tight">{deliv.title}</span>
                              <span className="text-[11px] mt-1.5 font-light opacity-85 leading-relaxed">{deliv.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Acceptation checkbox */}
                  <div className="pt-5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, conditions_acceptation: !prev.conditions_acceptation }))}
                      className={`flex items-start gap-4 text-left w-full p-4 border rounded-xl transition-all duration-300 outline-none cursor-pointer ${
                        formData.conditions_acceptation 
                          ? 'border-bsk-blue bg-blue-50/50' 
                          : showValidationErrors ? 'border-red-500 bg-red-50/30' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 text-white ${
                        formData.conditions_acceptation ? 'bg-bsk-blue border-bsk-blue' : 'border-slate-300 bg-white'
                      }`}>
                        {formData.conditions_acceptation && <Check size={14} />}
                      </div>
                      <span className="text-xs sm:text-sm text-bsk-text font-medium leading-relaxed font-sans">
                        Je comprends que la version finale ne sera livrée qu'après réception du paiement intégral. Une capture d'écran ou une version avec watermark me sera présentée pour validation avant la livraison définitive. <span className="text-bsk-blue font-bold">*</span>
                      </span>
                    </button>
                    {showValidationErrors && !formData.conditions_acceptation && (
                      <p className="text-red-500 text-xs mt-2 font-medium">Vous devez obligatoirement accepter cette condition pour continuer.</p>
                    )}
                  </div>
                </div>
              )}

              {/* --- STEP 12 : AVEZ-VOUS DES QUESTIONS --- */}
              {step === 11 && (
                <div className="space-y-6 flex-grow">
                  <div className="max-w-xl mx-auto space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        placeholder="Ex : Quel est le format idéal pour Instagram ?"
                        className="flex-grow bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-bsk-text placeholder-slate-400 focus:outline-none focus:bg-white focus:border-bsk-blue focus:ring-2 focus:ring-bsk-blue/10 transition-all duration-300"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                      />
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="bg-bsk-blue hover:bg-bsk-blue/95 text-white font-title font-bold rounded-2xl px-6 py-3.5 flex items-center gap-1.5 transition-all duration-300 outline-none hover:scale-[1.03] cursor-pointer"
                      >
                        <Plus size={16} />
                        <span>Ajouter</span>
                      </button>
                    </div>

                    {formData.liste_questions.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 divide-y divide-slate-200">
                        {formData.liste_questions.map((q, idx) => (
                          <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                            <span className="text-sm text-bsk-text font-medium pl-2">{q}</span>
                            <button
                              type="button"
                              onClick={() => removeQuestion(idx)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                              title="Supprimer la question"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs text-bsk-muted italic mt-6 font-light">
                    Vous pouvez sauter cette étape si tout est clair.
                  </p>
                </div>
              )}

              {/* --- STEP 13 : RÉCAPITULATIF & ENVOI --- */}
              {step === 12 && (
                <div className="space-y-6 flex-grow">
                  
                  {/* Container for PDF Generation - Light Mode Recap */}
                  <div 
                    id="recap-content" 
                    className="p-6 md:p-10 rounded-[2rem] border border-slate-200 bg-slate-50 relative overflow-hidden shadow-inner text-bsk-text"
                  >
                    {/* Header block visible in PDF */}
                    <div className="border-b border-slate-200 pb-5 mb-8 flex justify-between items-end">
                      <div>
                        <span className="font-title font-extrabold text-2xl tracking-tighter text-bsk-blue">BSK DEZIGNER</span>
                        <h2 className="text-[10px] uppercase tracking-widest text-bsk-muted mt-1 font-bold font-title">BRIEF CRÉATIF DIGITAL</h2>
                      </div>
                      <span className="text-xs text-bsk-muted font-mono">
                        Généré le : {new Date().toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      
                      {/* Section 1: Client */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl relative group">
                        <button
                          type="button"
                          onClick={() => setStep(0)}
                          className="absolute top-4 right-4 text-bsk-blue hover:text-bsk-blue-light p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier les coordonnées"
                        >
                          <Edit3 size={14} />
                        </button>
                        <h3 className="font-title text-xs font-bold tracking-wider text-bsk-blue mb-4 flex items-center gap-1.5">
                          <span className="text-base">👤</span> CLIENT
                        </h3>
                        <div className="text-sm space-y-2 text-bsk-text font-light">
                          <p><strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Nom :</strong> {formData.nom_complet}</p>
                          {formData.entreprise && <p><strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Entreprise :</strong> {formData.entreprise}</p>}
                          <p><strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Tél :</strong> {formData.indicatif} {formData.telephone_number}</p>
                          {formData.identifiant_whatsapp && <p><strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">WhatsApp :</strong> {formData.identifiant_whatsapp}</p>}
                          <p><strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Pays :</strong> {formData.pays}</p>
                        </div>
                      </div>

                      {/* Section 2: Projet */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl relative group">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="absolute top-4 right-4 text-bsk-blue hover:text-bsk-blue-light p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier le type de projet"
                        >
                          <Edit3 size={14} />
                        </button>
                        <h3 className="font-title text-xs font-bold tracking-wider text-bsk-blue mb-4 flex items-center gap-1.5">
                          <span className="text-base">🎯</span> PROJET
                        </h3>
                        <div className="text-sm space-y-2 text-bsk-text font-light">
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Type :</strong>{' '}
                            {formData.type_projet === '1' && 'Spot · App Mobile'}
                            {formData.type_projet === '2' && 'Spot · App Web'}
                            {formData.type_projet === '3' && 'Spot · Plateforme SAAS'}
                            {formData.type_projet === '4' && 'Spot Évènementiel'}
                            {formData.type_projet === '5' && 'Motion Flyer'}
                            {formData.type_projet === '6' && `Autre besoin (${formData.autre_precision})`}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Objectif :</strong>{' '}
                            {formData.objectif === 'notoriete' && 'Notoriété de marque'}
                            {formData.objectif === 'conversion' && 'Conversion & Ventes'}
                            {formData.objectif === 'explication' && 'Explication de service'}
                            {formData.objectif === 'promo' && 'Promotion Évènementielle'}
                            {formData.objectif === 'croissance' && 'Croissance Réseaux'}
                          </p>
                          <p className="line-clamp-3">
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Description :</strong> {formData.description}
                          </p>
                        </div>
                      </div>

                      {/* Section 3: Technique */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl relative group">
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="absolute top-4 right-4 text-bsk-blue hover:text-bsk-blue-light p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier la technique"
                        >
                          <Edit3 size={14} />
                        </button>
                        <h3 className="font-title text-xs font-bold tracking-wider text-bsk-blue mb-4 flex items-center gap-1.5">
                          <span className="text-base">⚙️</span> TECHNIQUE
                        </h3>
                        <div className="text-sm space-y-2 text-bsk-text font-light">
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Durée :</strong>{' '}
                            {formData.duree === 'ultra-court' && 'Moins de 30 secondes'}
                            {formData.duree === 'equilibre' && '30s à 45 secondes'}
                            {formData.duree === 'standard' && '45s à 60 secondes'}
                            {formData.duree === 'storytelling' && 'Plus de 60 secondes'}
                            {formData.duree === 'personnalise' && `Personnalisée (${formData.duree_personnalise})`}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Voix :</strong>{' '}
                            {formData.type_voix === 'humaine' && `Voix humaine (${formData.fournisseur_voix_humaine === 'client' ? 'fournie par vous' : 'produite par BSK'})`}
                            {formData.type_voix === 'ia' && `Voix IA (${formData.fournisseur_voix_ia === 'client' ? 'fournie par vous' : 'produite par BSK'})`}
                            {formData.type_voix === 'aucune' && 'Pas de voix off'}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Script :</strong>{' '}
                            {formData.gestion_script === 'client' && 'Fourni par vous'}
                            {formData.gestion_script === 'bsk' && 'Rédigé par BSK'}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Style(s) :</strong>{' '}
                            {formData.styles_visuels.map(s => {
                              if (s === 'minimaliste') return 'Minimaliste';
                              if (s === 'futuriste') return 'Futuriste';
                              if (s === 'chaleureux') return 'Chaleureux';
                              if (s === 'energique') return 'Énergique';
                              return s;
                            }).join(', ') || 'Aucun'}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Complexité :</strong>{' '}
                            {formData.niveau_complexite === 'standard' && 'STANDARD — Essentiel'}
                            {formData.niveau_complexite === 'premium' && 'PREMIUM — Avancé'}
                            {formData.niveau_complexite === 'signature' && 'SIGNATURE — Sur Mesure'}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Format(s) :</strong>{' '}
                            {formData.formats.map(f => {
                              if (f === 'horizontal') return '16:9';
                              if (f === 'vertical') return '9:16';
                              if (f === 'carre') return '1:1';
                              return f;
                            }).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Section 4: Références */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl relative group">
                        <button
                          type="button"
                          onClick={() => setStep(8)}
                          className="absolute top-4 right-4 text-bsk-blue hover:text-bsk-blue-light p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier les références"
                        >
                          <Edit3 size={14} />
                        </button>
                        <h3 className="font-title text-xs font-bold tracking-wider text-bsk-blue mb-4 flex items-center gap-1.5">
                          <span className="text-base">📎</span> RÉFÉRENCES
                        </h3>
                        <div className="text-sm space-y-2 text-bsk-text font-light">
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Lien :</strong>{' '}
                            {formData.lien_reference ? (
                              <a href={formData.lien_reference} target="_blank" rel="noopener noreferrer" className="text-bsk-blue underline break-all font-normal">
                                {formData.lien_reference}
                              </a>
                            ) : 'Aucun'}
                          </p>
                          {formData.ce_qui_plait && (
                            <p><strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Aimé :</strong> {formData.ce_qui_plait}</p>
                          )}
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Documents :</strong>{' '}
                            {formData.documents.map(d => {
                              if (d === 'cahier_des_charges') return 'Cahier des charges';
                              if (d === 'charte_graphique') return 'Charte graphique';
                              return d;
                            }).join(', ') || 'Aucun'}
                          </p>
                        </div>
                      </div>

                      {/* Section 5: Budget */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl relative group">
                        <button
                          type="button"
                          onClick={() => setStep(9)}
                          className="absolute top-4 right-4 text-bsk-blue hover:text-bsk-blue-light p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier le budget"
                        >
                          <Edit3 size={14} />
                        </button>
                        <h3 className="font-title text-xs font-bold tracking-wider text-bsk-blue mb-4 flex items-center gap-1.5">
                          <span className="text-base">💰</span> BUDGET
                        </h3>
                        <div className="text-sm space-y-2 text-bsk-text font-light">
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Devise :</strong> {formData.devise}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Fourchette :</strong>{' '}
                            {(() => {
                              const bracket = BUDGET_BRACKETS.find(b => b.id === formData.budget_bracket);
                              return bracket ? getBracketLabel(bracket) : 'Non spécifié';
                            })()}
                          </p>
                          {formData.budget_precis && (
                            <p>
                              <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Budget précis :</strong>{' '}
                              {formData.budget_precis} {formData.devise}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Section 6: Légal & Livraison */}
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl relative group">
                        <button
                          type="button"
                          onClick={() => setStep(10)}
                          className="absolute top-4 right-4 text-bsk-blue hover:text-bsk-blue-light p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier le légal"
                        >
                          <Edit3 size={14} />
                        </button>
                        <h3 className="font-title text-xs font-bold tracking-wider text-bsk-blue mb-4 flex items-center gap-1.5">
                          <span className="text-base">⚖️</span> LÉGAL & LIVRAISON
                        </h3>
                        <div className="text-sm space-y-2 text-bsk-text font-light">
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Sources :</strong>{' '}
                            {formData.fichiers_sources === 'oui' ? 'Oui (+100% de frais)' : 'Non (Vidéo finale seule)'}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Diffusion :</strong>{' '}
                            {formData.droits_diffusion === 'non' ? 'Confidentiel White Label (+50%)' : 'Autorisation portfolio'}
                          </p>
                          <p>
                            <strong className="text-bsk-muted text-xs uppercase tracking-wider font-semibold font-title">Délai :</strong>{' '}
                            {formData.delai_livraison === 'urgente' ? '⚡ Urgente (1-2 jours)' : 'Standard (3+ jours)'}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Section 7: Questions */}
                    {formData.liste_questions.length > 0 && (
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl mt-6 relative group text-left">
                        <button
                          type="button"
                          onClick={() => setStep(11)}
                          className="absolute top-4 right-4 text-bsk-blue hover:text-bsk-blue-light p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier les questions"
                        >
                          <Edit3 size={14} />
                        </button>
                        <h3 className="font-title text-xs font-bold tracking-wider text-bsk-blue mb-4 flex items-center gap-1.5">
                          <span className="text-base">❓</span> QUESTIONS ({formData.liste_questions.length})
                        </h3>
                        <ol className="list-decimal list-inside text-sm text-bsk-text space-y-1.5 font-light">
                          {formData.liste_questions.map((q, idx) => (
                            <li key={idx} className="pl-1">{q}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-5 mt-8 text-center text-[10px] text-bsk-muted font-sans tracking-wide">
                      Brief généré via bskdezigner.com — Contact WhatsApp : +221 70 946 58 91
                    </div>

                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <button
                      type="button"
                      disabled={isExportingPDF}
                      onClick={handlePDFExport}
                      className="bg-transparent hover:bg-slate-100 text-bsk-text font-title font-bold border border-slate-300 rounded-full py-4 px-6 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:scale-[1.03] outline-none"
                    >
                      <FileText size={18} />
                      <span>{isExportingPDF ? 'Génération...' : 'Télécharger en PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => shareOnWhatsApp(formData, usdRate)}
                      className="bg-[#1E3A8A] hover:bg-[#111827] text-white font-title font-black tracking-tight rounded-full py-4 px-6 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:scale-[1.03] shadow-md outline-none"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.004 2.001c-5.51 0-9.99 4.479-9.99 9.99 0 2.006.592 3.868 1.614 5.434l-1.074 3.905 4.022-1.052a9.923 9.923 0 005.428 1.603c5.51 0 9.99-4.479 9.99-9.99.001-5.511-4.479-9.99-9.99-9.99zm0 1.8c4.516 0 8.19 3.674 8.19 8.19 0 4.516-3.674 8.19-8.19 8.19a8.136 8.136 0 01-4.428-1.309l-.317-.189-2.385.624.636-2.316-.207-.33a8.14 8.14 0 01-1.3-4.48c0-4.516 3.674-8.19 8.19-8.19zm-3.6 4.05c-.198 0-.468.072-.666.288-.198.216-.756.738-.756 1.799 0 1.062.774 2.088.882 2.232.108.144 1.503 2.295 3.654 3.222.51.22.909.351 1.218.449.513.163.98.14 1.349.085.414-.063 1.278-.522 1.458-1.026.18-.504.18-.936.126-1.026-.054-.09-.198-.144-.414-.252-.216-.108-1.278-.63-1.476-.702-.198-.072-.342-.108-.486.108-.144.216-.558.702-.684.846-.126.144-.252.162-.468.054-.216-.108-.912-.336-1.74-.707-.63-.561-1.056-1.254-1.182-1.47-.126-.216-.012-.333.096-.441.097-.099.216-.252.324-.378.108-.126.144-.216.216-.36.072-.144.036-.27-.018-.378-.054-.108-.486-1.17-.666-1.602-.175-.42-.351-.36-.486-.367l-.414-.009z" />
                      </svg>
                      <span>Partager sur WhatsApp</span>
                    </button>
                  </div>
                  
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Form Actions Footer */}
          {step < 12 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrev}
                className={`flex items-center gap-1.5 px-6 py-3 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 hover:scale-[1.03] outline-none cursor-pointer font-sans ${
                  step === 0 ? 'invisible pointer-events-none' : ''
                }`}
              >
                <ArrowLeft size={16} />
                <span>Précédent</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid(step)}
                className={`flex items-center gap-1.5 px-7 py-3 rounded-full font-title font-bold transition-all duration-300 outline-none cursor-pointer ${
                  isStepValid(step)
                    ? 'bg-[#1E3A8A] hover:bg-[#111827] text-white hover:scale-[1.03] shadow-md'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <span>Suivant</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer copyright in light mode */}
      <footer className="max-w-4xl w-full mx-auto mt-8 border-t border-slate-200 pt-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-bsk-muted z-10 font-sans">
        <div>
          <span>© {new Date().getFullYear()} </span>
          <span className="font-bold text-bsk-blue font-title">BSK DEZIGNER</span>. Tous droits réservés.
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="font-mono text-green-600/90 text-[11px] tracking-wide">Système Opérationnel · Dakar, Sénégal</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

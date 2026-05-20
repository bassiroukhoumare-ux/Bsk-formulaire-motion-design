export const buildWhatsAppMessage = (formData, usdRate = 1.08) => {
  const getProjectTypeName = (type) => {
    const types = {
      '1': 'Spot · App Mobile',
      '2': 'Spot · App Web',
      '3': 'Spot · Plateforme SAAS',
      '4': 'Spot Évènementiel',
      '5': 'Motion Flyer',
      '6': 'Autre besoin'
    };
    if (type === '6' && formData.autre_precision) {
      return `Autre besoin (${formData.autre_precision})`;
    }
    return types[type] || '';
  };

  const getObjectiveName = (obj) => {
    const objectives = {
      'notoriete': 'Notoriété de marque',
      'conversion': 'Conversion & Ventes',
      'explication': 'Explication de service',
      'promo': 'Promotion Évènementielle',
      'croissance': 'Croissance Réseaux'
    };
    return objectives[obj] || '';
  };

  const getDurationName = (dur) => {
    if (dur === 'personnalise') {
      return `Personnalisée : ${formData.duree_personnalise || 'Non précisée'}`;
    }
    const durations = {
      'ultra-court': 'Moins de 30 secondes (TikTok/Reels)',
      'equilibre': '30s à 45 secondes',
      'standard': '45s à 60 secondes',
      'storytelling': 'Plus de 60 secondes'
    };
    return durations[dur] || '';
  };

  const getVoiceName = (voice) => {
    if (voice === 'humaine') {
      const provider = formData.fournisseur_voix_humaine === 'client' 
        ? 'fournie par le client' 
        : 'produite par BSK Dezigner';
      return `Voix humaine naturelle (${provider})`;
    }
    if (voice === 'ia') {
      const provider = formData.fournisseur_voix_ia === 'client' 
        ? 'fournie par le client' 
        : 'produite par BSK Dezigner';
      return `Voix générée par IA (${provider})`;
    }
    const voices = {
      'aucune': 'Pas de voix off (Musique & Textes seuls)'
    };
    return voices[voice] || '';
  };

  const getScriptManagementName = (script) => {
    const scripts = {
      'client': 'Je fournis le script complet',
      'bsk': 'Je confie la rédaction à BSK Dezigner'
    };
    return scripts[script] || '';
  };

  const getStylesNames = (styles) => {
    const stylesMap = {
      'minimaliste': 'Minimaliste & Épuré',
      'futuriste': 'Futuriste & Sophistiqué',
      'chaleureux': 'Chaleureux & Humain',
      'energique': 'Énergique & Urbain'
    };
    return (styles || []).map(s => stylesMap[s]).filter(Boolean).join(', ');
  };

  const getComplexityName = (comp) => {
    const complexities = {
      'standard': 'STANDARD — Essentiel',
      'premium': 'PREMIUM — Avancé',
      'signature': 'SIGNATURE — Sur Mesure'
    };
    return complexities[comp] || '';
  };

  const getFormatsNames = (fmts) => {
    const formatsMap = {
      'horizontal': '16:9 Horizontal',
      'vertical': '9:16 Vertical',
      'carre': '1:1 Carré'
    };
    return (fmts || []).map(f => formatsMap[f]).filter(Boolean).join(', ');
  };

  const getFilesSourcesName = (fs) => {
    return fs === 'oui'
      ? 'Oui — Fichiers sources modifiables (.aep / .prproj)'
      : 'Non — Vidéo finale uniquement (.mp4 / .mov)';
  };

  const getPortfolioName = (p) => {
    return p === 'non'
      ? 'Confidentiel (Option White Label - +50% de frais)'
      : 'Autorisé pour le portfolio';
  };

  const getDeliveryName = (d) => {
    return d === 'urgente'
      ? '⚡ Livraison Urgente (1 à 2 jours)'
      : 'Livraison Standard (Délai min. 3 jours ouvrés)';
  };

  const getDocumentsNames = (docs) => {
    const docsMap = {
      'cahier_des_charges': 'Cahier des charges détaillé',
      'charte_graphique': 'Charte graphique stricte'
    };
    return (docs || []).map(d => docsMap[d]).filter(Boolean).join(', ');
  };

  // Convert budget brackets for WhatsApp representation
  const getBudgetText = () => {
    const fcfaRanges = {
      't1': { min: 50000, max: 100000, label: '50 000 – 100 000' },
      't2': { min: 100000, max: 200000, label: '100 000 – 200 000' },
      't3': { min: 200000, max: 300000, label: '200 000 – 300 000' },
      't4': { min: 300000, max: 400000, label: '300 000 – 400 000' },
      't5': { min: 400000, max: 500000, label: '400 000 – 500 000' },
      't6': { min: 500000, max: 750000, label: '500 000 – 750 000' },
      't7': { min: 750000, max: 1000000, label: '750 000 – 1 000 000' },
      't8': { min: 1000000, max: null, label: 'Plus de 1 000 000' }
    };

    const bracketObj = fcfaRanges[formData.budget_bracket];
    if (!bracketObj) return '';

    let rangeStr = '';
    const devise = formData.devise || 'FCFA';

    if (devise === 'FCFA') {
      rangeStr = bracketObj.max 
        ? `${bracketObj.label} FCFA` 
        : `Plus de 1 000 000 FCFA`;
    } else if (devise === 'EUR') {
      const minEur = Math.round(bracketObj.min / 655.957);
      const maxEur = bracketObj.max ? Math.round(bracketObj.max / 655.957) : null;
      rangeStr = maxEur ? `${minEur} – ${maxEur} €` : `Plus de 1 524 €`;
    } else { // USD
      const minUsd = Math.round((bracketObj.min / 655.957) * usdRate);
      const maxUsd = bracketObj.max ? Math.round((bracketObj.max / 655.957) * usdRate) : null;
      rangeStr = maxUsd ? `~${minUsd} – ${maxUsd} $` : `Plus de ~1 700 $`;
    }

    let result = rangeStr;
    if (formData.budget_precis) {
      result += ` (budget précis : ${formData.budget_precis} ${devise})`;
    }
    return result;
  };

  const lines = [];
  lines.push('🎬 *BRIEF CRÉATIF — BSK DEZIGNER*');
  lines.push('');
  
  lines.push('👤 *CLIENT*');
  lines.push(`Nom : ${formData.nom_complet}`);
  if (formData.entreprise) lines.push(`Entreprise : ${formData.entreprise}`);
  if (formData.email) lines.push(`Email : ${formData.email}`);
  const indicatif = formData.indicatif === 'autre' ? (formData.indicatif_custom || '') : formData.indicatif;
  lines.push(`WhatsApp : ${indicatif} ${formData.telephone_number}`);
  lines.push(`Pays : ${formData.pays}`);
  lines.push('');

  lines.push('🎯 *PROJET*');
  lines.push(`Type : ${getProjectTypeName(formData.type_projet)}`);
  lines.push(`Objectif : ${getObjectiveName(formData.objectif)}`);
  lines.push(`Description : ${formData.description}`);
  lines.push('');

  lines.push('⚙️ *TECHNIQUE*');
  lines.push(`Durée : ${getDurationName(formData.duree)}`);
  lines.push(`Voix : ${getVoiceName(formData.type_voix)}`);
  lines.push(`Script : ${getScriptManagementName(formData.gestion_script)}`);
  
  const styles = getStylesNames(formData.styles_visuels);
  if (styles) lines.push(`Style : ${styles}`);
  
  lines.push(`Complexité : ${getComplexityName(formData.niveau_complexite)}`);
  
  const formats = getFormatsNames(formData.formats);
  if (formats) lines.push(`Formats : ${formats}`);
  lines.push('');

  const docList = getDocumentsNames(formData.documents);
  const showReferences = formData.lien_reference || formData.ce_qui_plait || docList;
  if (showReferences) {
    lines.push('📎 *RÉFÉRENCES*');
    if (formData.lien_reference) lines.push(`Lien : ${formData.lien_reference}`);
    if (formData.ce_qui_plait) lines.push(`Aimé : ${formData.ce_qui_plait}`);
    if (docList) lines.push(`Documents : ${docList}`);
    lines.push('');
  }

  const budgetText = getBudgetText();
  if (budgetText) {
    lines.push('💰 *BUDGET*');
    lines.push(budgetText);
    lines.push('');
  }

  lines.push('⚖️ *LÉGAL & LIVRAISON*');
  lines.push(`Sources : ${getFilesSourcesName(formData.fichiers_sources)}`);
  lines.push(`Portfolio : ${getPortfolioName(formData.droits_diffusion)}`);
  lines.push(`Livraison : ${getDeliveryName(formData.delai_livraison)}`);
  lines.push('');

  if (formData.liste_questions && formData.liste_questions.length > 0) {
    lines.push('❓ *QUESTIONS*');
    formData.liste_questions.forEach((q, idx) => {
      lines.push(`${idx + 1}. ${q}`);
    });
    lines.push('');
  }

  lines.push('—');
  lines.push('Envoyé via bskdezigner.com');

  return lines.join('\n');
};

export const shareOnWhatsApp = (formData, usdRate = 1.08) => {
  const message = buildWhatsAppMessage(formData, usdRate);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/221709465891?text=${encoded}`;
  window.open(url, '_blank');
};

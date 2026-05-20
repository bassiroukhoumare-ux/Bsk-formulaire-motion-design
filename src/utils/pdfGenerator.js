import html2pdf from 'html2pdf.js';

export const generatePDF = (elementId, clientName) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const sanitizedName = (clientName || 'Client')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_{2,}/g, '_');

  const filename = `Brief_BSK_Dezigner_${sanitizedName}_${today}.pdf`;

  const opt = {
    margin:       10,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#FFFFFF', // Fond blanc pour correspondre au nouveau design
      logging: false 
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // html2pdf returns a promise that resolves when saving is complete
  return html2pdf().set(opt).from(element).save();
};

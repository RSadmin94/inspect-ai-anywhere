 import { jsPDF } from 'jspdf';
 import { PhotoRecord, InspectionRecord } from '@/lib/db';
 import { blobToDataUrl } from '@/lib/imageUtils';
 import { Language, translations } from '@/lib/i18n';
 
 type ReportLanguage = 'en' | 'es' | 'both';
 
 export async function generateInspectionPDF(
   inspection: InspectionRecord,
   photos: PhotoRecord[],
   reportLanguage: ReportLanguage = 'en'
 ): Promise<Blob> {
   const pdf = new jsPDF({
     orientation: 'portrait',
     unit: 'mm',
     format: 'a4'
   });
 
   const pageWidth = pdf.internal.pageSize.getWidth();
   const pageHeight = pdf.internal.pageSize.getHeight();
   const margin = 15;
   const contentWidth = pageWidth - (margin * 2);
   let yPos = margin;
 
   const t = (key: keyof typeof translations.en, lang: Language) => translations[lang][key];
 
   const addHeader = (lang: Language) => {
     // Title
     pdf.setFontSize(24);
     pdf.setFont('helvetica', 'bold');
     pdf.text('InspectAI', margin, yPos);
     yPos += 8;
     
     pdf.setFontSize(14);
     pdf.setFont('helvetica', 'normal');
     pdf.text(t('currentInspection', lang), margin, yPos);
     yPos += 12;
 
     // Property Info
     pdf.setFontSize(12);
     pdf.setFont('helvetica', 'bold');
     pdf.text(`${t('propertyAddress', lang)}:`, margin, yPos);
     yPos += 6;
     pdf.setFont('helvetica', 'normal');
     pdf.text(inspection.propertyAddress, margin, yPos);
     yPos += 8;
 
     if (inspection.inspectorName) {
       pdf.setFont('helvetica', 'bold');
       pdf.text(`${t('inspectorName', lang).replace(' (optional)', '')}:`, margin, yPos);
       yPos += 6;
       pdf.setFont('helvetica', 'normal');
       pdf.text(inspection.inspectorName, margin, yPos);
       yPos += 8;
     }
 
     // Date
     pdf.setFont('helvetica', 'bold');
     pdf.text(`${t('timestamp', lang)}:`, margin, yPos);
     yPos += 6;
     pdf.setFont('helvetica', 'normal');
     const dateStr = new Date(inspection.createdAt).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US');
     pdf.text(dateStr, margin, yPos);
     yPos += 8;
 
     // Photo count
     pdf.text(`${t('photos', lang)}: ${photos.length}`, margin, yPos);
     yPos += 15;
 
     // Divider
     pdf.setDrawColor(200);
     pdf.line(margin, yPos, pageWidth - margin, yPos);
     yPos += 10;
   };
 
   const addPhotoSection = async (photo: PhotoRecord, lang: Language) => {
     // Check if we need a new page
     if (yPos > pageHeight - 80) {
       pdf.addPage();
       yPos = margin;
     }
 
     // Photo image
     try {
       const imageUrl = await blobToDataUrl(photo.thumbnailBlob);
       pdf.addImage(imageUrl, 'JPEG', margin, yPos, 40, 30);
     } catch (e) {
       // If image fails, add placeholder
       pdf.setFillColor(240, 240, 240);
       pdf.rect(margin, yPos, 40, 30, 'F');
     }
 
     const textX = margin + 45;
     let textY = yPos + 5;
 
     // Room
     pdf.setFontSize(11);
     pdf.setFont('helvetica', 'bold');
     const roomKey = photo.room as keyof typeof translations.en;
     const roomName = translations[lang][roomKey] || photo.room;
     pdf.text(roomName, textX, textY);
     textY += 6;
 
     // Timestamp
     pdf.setFontSize(9);
     pdf.setFont('helvetica', 'normal');
     pdf.setTextColor(100);
     pdf.text(new Date(photo.timestamp).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US'), textX, textY);
     textY += 5;
     pdf.setTextColor(0);
 
     // AI Finding
     if (photo.aiStatus === 'complete' && photo.aiFindingTitle) {
       const title = lang === 'es' && photo.aiFindingTitleEs ? photo.aiFindingTitleEs : photo.aiFindingTitle;
       pdf.setFont('helvetica', 'bold');
       pdf.setFontSize(10);
       pdf.text(title || '', textX, textY);
       textY += 5;
 
       // Severity
       if (photo.aiSeverity) {
         const severityKey = photo.aiSeverity as keyof typeof translations.en;
         const severityText = translations[lang][severityKey] || photo.aiSeverity;
         pdf.setFont('helvetica', 'normal');
         pdf.text(`${t('severity', lang)}: ${severityText} (${photo.aiConfidence}%)`, textX, textY);
         textY += 5;
       }
 
       // Description
       const desc = lang === 'es' && photo.aiDescriptionEs ? photo.aiDescriptionEs : photo.aiDescription;
       if (desc) {
         pdf.setFontSize(9);
         const lines = pdf.splitTextToSize(desc, contentWidth - 50);
         pdf.text(lines.slice(0, 2), textX, textY);
         textY += lines.length > 2 ? 10 : (lines.length * 4);
       }
     } else if (photo.aiStatus === 'pending_offline') {
       pdf.setFont('helvetica', 'italic');
       pdf.setFontSize(9);
       pdf.setTextColor(150);
       pdf.text(t('aiPending', lang), textX, textY);
       pdf.setTextColor(0);
     }
 
     // Notes
     if (photo.notes) {
       textY += 3;
       pdf.setFont('helvetica', 'normal');
       pdf.setFontSize(9);
       const noteLines = pdf.splitTextToSize(`${t('notes', lang)}: ${photo.notes}`, contentWidth - 50);
       pdf.text(noteLines.slice(0, 2), textX, textY);
     }
 
     yPos += 40;
   };
 
   // Generate for selected language(s)
   if (reportLanguage === 'en' || reportLanguage === 'both') {
     addHeader('en');
     for (const photo of photos) {
       await addPhotoSection(photo, 'en');
     }
   }
 
   if (reportLanguage === 'both') {
     pdf.addPage();
     yPos = margin;
   }
 
   if (reportLanguage === 'es' || reportLanguage === 'both') {
     if (reportLanguage === 'both') {
       // Add Spanish header
       pdf.setFontSize(16);
       pdf.setFont('helvetica', 'bold');
       pdf.text('Versión en Español', margin, yPos);
       yPos += 15;
     }
     addHeader('es');
     for (const photo of photos) {
       await addPhotoSection(photo, 'es');
     }
   }
 
   return pdf.output('blob');
 }
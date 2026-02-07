 import { jsPDF } from 'jspdf';
 import { PhotoRecord, InspectionRecord, getAllCustomRooms } from '@/lib/db';
 import { blobToDataUrl } from '@/lib/imageUtils';
 import { Language, translations } from '@/lib/i18n';
 
 type ReportLanguage = 'en' | 'es' | 'both';
 
 export async function generateReportPDF(
   inspection: InspectionRecord,
   photos: PhotoRecord[],
   reportLanguage: ReportLanguage = 'en',
   disclaimers: string[] = [],
   roomOrder: string[] = []
 ): Promise<Blob> {
   const pdf = new jsPDF({
     orientation: 'portrait',
     unit: 'mm',
     format: 'a4'
   });
 
   const customRooms = await getAllCustomRooms();
   const customRoomMap = new Map(customRooms.map(r => [r.id, r]));
 
   const pageWidth = pdf.internal.pageSize.getWidth();
   const pageHeight = pdf.internal.pageSize.getHeight();
   const margin = 15;
   const contentWidth = pageWidth - (margin * 2);
   let yPos = margin;
 
   const t = (key: keyof typeof translations.en, lang: Language) => translations[lang][key];
 
   const getRoomName = (room: string, lang: Language): string => {
     if (room in translations[lang]) {
       return translations[lang][room as keyof typeof translations.en] || room;
     }
     const customRoom = customRoomMap.get(room);
     if (customRoom) {
       return lang === 'es' && customRoom.nameEs ? customRoom.nameEs : customRoom.name;
     }
     return room;
   };
 
   const addHeader = (lang: Language) => {
     // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('365 InspectAI', margin, yPos);
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
 
     // Client Name
     if (inspection.clientName) {
       pdf.setFont('helvetica', 'bold');
       pdf.text(`${lang === 'es' ? 'Cliente' : 'Client'}:`, margin, yPos);
       yPos += 6;
       pdf.setFont('helvetica', 'normal');
       pdf.text(inspection.clientName, margin, yPos);
       yPos += 8;
     }
 
     // Inspector Name
     if (inspection.inspectorName) {
       pdf.setFont('helvetica', 'bold');
       pdf.text(`${t('inspectorName', lang).replace(' (optional)', '').replace(' (opcional)', '')}:`, margin, yPos);
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
 
   const addRoomSection = async (room: string, roomPhotos: PhotoRecord[], lang: Language) => {
     // Check if we need a new page
     if (yPos > pageHeight - 60) {
       pdf.addPage();
       yPos = margin;
     }
 
     // Room header
     pdf.setFontSize(14);
     pdf.setFont('helvetica', 'bold');
     pdf.setFillColor(245, 245, 245);
     pdf.rect(margin, yPos - 5, contentWidth, 10, 'F');
     pdf.text(getRoomName(room, lang), margin + 3, yPos + 2);
     yPos += 12;
 
     for (const photo of roomPhotos) {
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
         pdf.setFillColor(240, 240, 240);
         pdf.rect(margin, yPos, 40, 30, 'F');
       }
 
       const textX = margin + 45;
       let textY = yPos + 5;
 
       // Finding title (from AI or manual)
       const title = lang === 'es'
         ? (photo.manualTitleEs || photo.aiFindingTitleEs || photo.manualTitle || photo.aiFindingTitle)
         : (photo.manualTitle || photo.aiFindingTitle || photo.manualTitleEs || photo.aiFindingTitleEs);
 
       if (title) {
         pdf.setFontSize(11);
         pdf.setFont('helvetica', 'bold');
         pdf.text(title, textX, textY);
         textY += 6;
       }
 
       // Timestamp
       pdf.setFontSize(9);
       pdf.setFont('helvetica', 'normal');
       pdf.setTextColor(100);
       pdf.text(new Date(photo.timestamp).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US'), textX, textY);
       textY += 5;
       pdf.setTextColor(0);
 
       // Severity (from AI or manual)
       const severity = photo.manualSeverity || photo.aiSeverity;
       const category = photo.manualCategory || photo.aiCategory;
       const confidence = photo.aiConfidence;
 
       if (severity) {
         const severityKey = severity as keyof typeof translations.en;
         const severityText = translations[lang][severityKey] || severity;
         const categoryKey = category as keyof typeof translations.en;
         const categoryText = category ? translations[lang][categoryKey] || category : '';
 
         pdf.setFont('helvetica', 'normal');
         let line = `${t('severity', lang)}: ${severityText}`;
         if (categoryText) line += ` | ${t('category', lang)}: ${categoryText}`;
         if (confidence) line += ` (${confidence}%)`;
         pdf.text(line, textX, textY);
         textY += 5;
       }
 
       // Description (from AI or manual)
       const desc = lang === 'es'
         ? (photo.manualDescriptionEs || photo.aiDescriptionEs || photo.manualDescription || photo.aiDescription)
         : (photo.manualDescription || photo.aiDescription);
 
       if (desc) {
         pdf.setFontSize(9);
         const lines = pdf.splitTextToSize(desc, contentWidth - 50);
         pdf.text(lines.slice(0, 2), textX, textY);
         textY += Math.min(lines.length, 2) * 4;
       }
 
       // Notes
       if (photo.notes) {
         textY += 2;
         pdf.setFont('helvetica', 'italic');
         pdf.setFontSize(8);
         const noteLines = pdf.splitTextToSize(`${t('notes', lang)}: ${photo.notes}`, contentWidth - 50);
         pdf.text(noteLines.slice(0, 2), textX, textY);
       }
 
       yPos += 40;
     }
 
     yPos += 5;
   };
 
   const addDisclaimers = (lang: Language) => {
     if (disclaimers.length === 0) return;
 
     // Check if we need a new page
     if (yPos > pageHeight - 60) {
       pdf.addPage();
       yPos = margin;
     }
 
     pdf.setDrawColor(200);
     pdf.line(margin, yPos, pageWidth - margin, yPos);
     yPos += 10;
 
     pdf.setFontSize(12);
     pdf.setFont('helvetica', 'bold');
     pdf.text(lang === 'es' ? 'Descargos de Responsabilidad' : 'Disclaimers', margin, yPos);
     yPos += 8;
 
     pdf.setFontSize(9);
     pdf.setFont('helvetica', 'normal');
 
     for (const disclaimer of disclaimers) {
       if (yPos > pageHeight - 20) {
         pdf.addPage();
         yPos = margin;
       }
       const lines = pdf.splitTextToSize(`• ${disclaimer}`, contentWidth);
       pdf.text(lines, margin, yPos);
       yPos += lines.length * 4 + 3;
     }
   };
 
   // Group photos by room respecting order
   const groupedByRoom = new Map<string, PhotoRecord[]>();
   for (const room of roomOrder) {
     groupedByRoom.set(room, []);
   }
   for (const photo of photos) {
     const existing = groupedByRoom.get(photo.room) || [];
     existing.push(photo);
     groupedByRoom.set(photo.room, existing);
   }
 
   // Generate for selected language(s)
   const generateForLang = async (lang: Language) => {
     addHeader(lang);
 
     for (const [room, roomPhotos] of groupedByRoom) {
       if (roomPhotos.length > 0) {
         await addRoomSection(room, roomPhotos, lang);
       }
     }
 
     addDisclaimers(lang);
   };
 
   if (reportLanguage === 'en' || reportLanguage === 'both') {
     await generateForLang('en');
   }
 
   if (reportLanguage === 'both') {
     pdf.addPage();
     yPos = margin;
     pdf.setFontSize(16);
     pdf.setFont('helvetica', 'bold');
     pdf.text('Versión en Español', margin, yPos);
     yPos += 15;
   }
 
   if (reportLanguage === 'es' || reportLanguage === 'both') {
     await generateForLang('es');
   }
 
   return pdf.output('blob');
 }
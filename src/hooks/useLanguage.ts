 import { useState, useEffect, useCallback } from 'react';
 import { Language, translations, TranslationKey } from '@/lib/i18n';
 import { getSetting, setSetting } from '@/lib/db';
 
 const LANGUAGE_KEY = 'app-language';
 
 function getDeviceLanguage(): Language {
   const lang = navigator.language.toLowerCase();
   return lang.startsWith('es') ? 'es' : 'en';
 }
 
 export function useLanguage() {
   const [language, setLanguageState] = useState<Language>('en');
   const [isLoaded, setIsLoaded] = useState(false);
 
   useEffect(() => {
     async function loadLanguage() {
       try {
         const saved = await getSetting(LANGUAGE_KEY);
         if (saved === 'en' || saved === 'es') {
           setLanguageState(saved);
         } else {
           const deviceLang = getDeviceLanguage();
           setLanguageState(deviceLang);
           await setSetting(LANGUAGE_KEY, deviceLang);
         }
       } catch {
         setLanguageState(getDeviceLanguage());
       }
       setIsLoaded(true);
     }
     loadLanguage();
   }, []);
 
   const setLanguage = useCallback(async (lang: Language) => {
     setLanguageState(lang);
     try {
       await setSetting(LANGUAGE_KEY, lang);
     } catch (e) {
       console.error('Failed to save language setting:', e);
     }
   }, []);
 
   const toggleLanguage = useCallback(() => {
     const newLang = language === 'en' ? 'es' : 'en';
     setLanguage(newLang);
   }, [language, setLanguage]);
 
   const t = useCallback((key: TranslationKey): string => {
     return translations[language][key];
   }, [language]);
 
   return { language, setLanguage, toggleLanguage, t, isLoaded };
 }
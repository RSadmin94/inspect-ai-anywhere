 import { useState, useCallback, useRef, useEffect } from 'react';
 
 interface SpeechRecognitionEvent extends Event {
   results: SpeechRecognitionResultList;
   resultIndex: number;
 }
 
 interface SpeechRecognitionErrorEvent extends Event {
   error: string;
 }
 
 interface SpeechRecognition extends EventTarget {
   continuous: boolean;
   interimResults: boolean;
   lang: string;
   start(): void;
   stop(): void;
   abort(): void;
   onresult: ((event: SpeechRecognitionEvent) => void) | null;
   onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
   onend: (() => void) | null;
   onstart: (() => void) | null;
 }
 
 declare global {
   interface Window {
     SpeechRecognition: new () => SpeechRecognition;
     webkitSpeechRecognition: new () => SpeechRecognition;
   }
 }
 
 export function useVoiceDictation(language: 'en' | 'es' = 'en') {
   const [isListening, setIsListening] = useState(false);
   const [transcript, setTranscript] = useState('');
   const [interimTranscript, setInterimTranscript] = useState('');
   const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
   const recognitionRef = useRef<SpeechRecognition | null>(null);
 
  // Check for speech recognition support on mount
  useEffect(() => {
    const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setIsSupported(supported);
  }, []);

   const startListening = useCallback(() => {
     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     if (!SpeechRecognition) {
       setError('Speech recognition not supported');
       return;
     }
 
     const recognition = new SpeechRecognition();
     recognition.continuous = true;
     recognition.interimResults = true;
     recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
 
     recognition.onstart = () => {
       setIsListening(true);
       setError(null);
     };
 
     recognition.onresult = (event: SpeechRecognitionEvent) => {
       let interim = '';
       let final = '';
 
       for (let i = event.resultIndex; i < event.results.length; i++) {
         const result = event.results[i];
         if (result.isFinal) {
           final += result[0].transcript + ' ';
         } else {
           interim += result[0].transcript;
         }
       }
 
       if (final) {
         setTranscript(prev => prev + final);
       }
       setInterimTranscript(interim);
     };
 
     recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
       if (event.error !== 'aborted') {
         setError(event.error);
       }
       setIsListening(false);
     };
 
     recognition.onend = () => {
       setIsListening(false);
       setInterimTranscript('');
     };
 
     recognitionRef.current = recognition;
     recognition.start();
   }, [language]);
 
   const stopListening = useCallback(() => {
     if (recognitionRef.current) {
       recognitionRef.current.stop();
       recognitionRef.current = null;
     }
     setIsListening(false);
   }, []);
 
   const toggleListening = useCallback(() => {
     if (isListening) {
       stopListening();
     } else {
       startListening();
     }
   }, [isListening, startListening, stopListening]);
 
   const resetTranscript = useCallback(() => {
     setTranscript('');
     setInterimTranscript('');
   }, []);
 
   return {
     isListening,
     transcript,
     interimTranscript,
     fullTranscript: transcript + interimTranscript,
     error,
     isSupported,
     startListening,
     stopListening,
     toggleListening,
     resetTranscript,
   };
 }
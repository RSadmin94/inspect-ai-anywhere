import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface DropZoneProps {
   onFilesSelected: (files: File[]) => void;
   accept?: string;
   multiple?: boolean;
   className?: string;
   t?: (key: string) => string;
 }
 
 export function DropZone({
   onFilesSelected,
   accept = 'image/*',
   multiple = true,
   className,
   t: tProp,
 }: DropZoneProps) {
   const { t: tHook } = useLanguage();
   const t = tProp ?? tHook;
   const [isDragging, setIsDragging] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const handleDragEnter = (e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
     setIsDragging(true);
   };
 
   const handleDragLeave = (e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
     if (e.currentTarget === e.target) {
       setIsDragging(false);
     }
   };
 
   const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
   };
 
   const handleDrop = (e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
     setIsDragging(false);
 
     const files = Array.from(e.dataTransfer.files);
     if (files.length > 0) {
       onFilesSelected(files);
     }
   };
 
   const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = Array.from(e.target.files || []);
     if (files.length > 0) {
       onFilesSelected(files);
     }
   };
 
   const handleClick = () => {
     fileInputRef.current?.click();
   };
 
   return (
     <motion.div
       onDragEnter={handleDragEnter}
       onDragLeave={handleDragLeave}
       onDragOver={handleDragOver}
       onDrop={handleDrop}
       onClick={handleClick}
       animate={{
         boxShadow: isDragging
           ? '0 0 30px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.2)'
           : 'none',
       }}
       transition={{ duration: 0.2 }}
       className={cn(
         'relative w-full p-12 rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden group',
         isDragging ? 'border-primary' : 'border-primary/40',
         className
       )}
     >
       {/* Background gradient */}
       <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br from-primary to-primary/60" />
 
       {/* Animated glow effect on drag */}
       {isDragging && (
         <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.8 }}
           className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle,hsl(var(--primary)/0.1)_0%,transparent_70%)]"
         />
       )}
 
       {/* Content */}
       <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center">
         {/* Icon */}
         <motion.div
           animate={{
             scale: isDragging ? 1.1 : 1,
             y: isDragging ? -10 : 0,
           }}
           transition={{ duration: 0.2 }}
           className="relative"
         >
           <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/20 border-2 border-primary/30">
             <motion.div
               animate={{
                 rotate: isDragging ? 360 : 0,
               }}
               transition={{ duration: 0.6, repeat: isDragging ? Infinity : 0 }}
             >
               <Upload size={32} className="text-primary" />
             </motion.div>
           </div>
 
           {/* Glow ring */}
           {isDragging && (
             <motion.div
               animate={{
                 scale: [1, 1.2, 1],
                 opacity: [0.5, 0, 0.5],
               }}
               transition={{ duration: 1.5, repeat: Infinity }}
               className="absolute inset-0 rounded-2xl border-2 border-primary"
             />
           )}
         </motion.div>
 
         {/* Text */}
         <div>
           <p className="text-lg font-semibold text-foreground">
             {isDragging ? t('dropImagesHere') : t('dragImagesHere')}
           </p>
           <p className="text-sm text-muted-foreground mt-1">
             {t('orClickToBrowse')}
           </p>
         </div>

         {/* File info */}
         <div className="flex items-center gap-2 text-xs text-muted-foreground">
           <ImageIcon size={14} />
           <span>{t('imageFormatInfo')}</span>
         </div>
       </div>
 
       {/* Hidden file input */}
       <input
         ref={fileInputRef}
         type="file"
         accept={accept}
         multiple={multiple}
         onChange={handleFileInputChange}
         className="hidden"
       />
     </motion.div>
   );
 }
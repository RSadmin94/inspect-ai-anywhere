 import React from 'react';
 import { motion } from 'framer-motion';
 import {
   FileText,
   Zap,
   BarChart3,
   Plus,
   Camera,
 } from 'lucide-react';
 import { DropZone } from './DropZone';
 import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';
 
 interface DashboardHubProps {
   photoCount: number;
   onCreateInspection: () => void;
   onFilesSelected: (files: File[]) => void;
  onViewPhotos?: () => void;
   t: (key: string) => string;
 }
 
 export function DashboardHub({
   photoCount,
   onCreateInspection,
   onFilesSelected,
  onViewPhotos,
   t,
 }: DashboardHubProps) {
   const stats = [
     {
       label: 'Photos Captured',
       value: photoCount,
       icon: Camera,
       colorClass: 'text-primary',
       bgClass: 'bg-primary/10 border-primary/30',
     },
     {
       label: 'AI Analyses',
       value: photoCount,
       icon: Zap,
       colorClass: 'text-accent',
       bgClass: 'bg-accent/10 border-accent/30',
     },
     {
       label: 'Reports Ready',
       value: photoCount > 0 ? '1' : '0',
       icon: BarChart3,
       colorClass: 'text-primary',
       bgClass: 'bg-primary/10 border-primary/30',
     },
     {
       label: 'Status',
       value: 'Active',
       icon: FileText,
       colorClass: 'text-accent',
       bgClass: 'bg-accent/10 border-accent/30',
     },
   ];
 
   const containerVariants = {
     hidden: { opacity: 0 },
     visible: {
       opacity: 1,
       transition: {
         staggerChildren: 0.1,
         delayChildren: 0.2,
       },
     },
   };
 
   const itemVariants = {
     hidden: { opacity: 0, y: 20 },
     visible: {
       opacity: 1,
       y: 0,
       transition: { duration: 0.4 },
     },
   };
 
   return (
     <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
       {/* Header */}
       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
         className="mb-12"
       >
         <div className="flex items-center gap-3 mb-2">
          <img src={logoImage} alt="InspectAI" className="w-20 h-20 object-contain" />
           <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
         </div>
         <p className="text-muted-foreground">Welcome to InspectAI Pro</p>
       </motion.div>
 
       {/* Stats Grid */}
       <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
       >
         {stats.map((stat, index) => {
           const Icon = stat.icon;
          const isClickable = stat.label === 'Photos Captured' && photoCount > 0 && onViewPhotos;
           return (
             <motion.div
               key={index}
               variants={itemVariants}
              onClick={isClickable ? onViewPhotos : undefined}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-lg card-gradient border border-border/10",
                isClickable && "cursor-pointer"
              )}
             >
               {/* Hover glow */}
               <div className={cn(
                 "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                 stat.colorClass === 'text-primary' 
                   ? 'bg-gradient-to-br from-primary to-transparent'
                   : 'bg-gradient-to-br from-accent to-transparent'
               )} />
 
               {/* Content */}
               <div className="relative z-10">
                 <div className="flex items-start justify-between mb-4">
                   <div className={cn(
                     "w-12 h-12 rounded-xl flex items-center justify-center border",
                     stat.bgClass
                   )}>
                     <Icon size={24} className={stat.colorClass} />
                   </div>
                 </div>
                 <p className="text-muted-foreground text-sm mb-2">{stat.label}</p>
                 <p className="text-3xl font-bold text-foreground">{stat.value}</p>
               </div>
             </motion.div>
           );
         })}
       </motion.div>
 
       {/* Main Actions Section */}
       <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
       >
         {/* Create Inspection Card */}
         <motion.div
           variants={itemVariants}
           onClick={onCreateInspection}
           className="lg:col-span-1 group cursor-pointer relative overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl bg-primary/20 border-2 border-primary/30"
         >
           {/* Animated background */}
           <motion.div
             animate={{
               opacity: [0.3, 0.6, 0.3],
             }}
             transition={{ duration: 3, repeat: Infinity }}
             className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.2)_0%,transparent_70%)]"
           />
 
           <div className="relative z-10 flex flex-col items-center justify-center text-center h-full gap-4">
             <motion.div
               whileHover={{ scale: 1.1, rotate: 90 }}
               transition={{ duration: 0.3 }}
             >
               <div className="w-16 h-16 rounded-2xl flex items-center justify-center btn-gradient">
                 <Plus size={32} className="text-primary-foreground" />
               </div>
             </motion.div>
             <div>
               <p className="text-lg font-semibold text-foreground">{t('newInspection')}</p>
               <p className="text-sm text-muted-foreground mt-1">Start a new property audit</p>
             </div>
           </div>
         </motion.div>
 
         {/* Drop Zone */}
         <motion.div
           variants={itemVariants}
           className="lg:col-span-2"
         >
           <DropZone onFilesSelected={onFilesSelected} />
         </motion.div>
       </motion.div>
 
       {/* Features Section */}
       <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="grid grid-cols-1 md:grid-cols-3 gap-6"
       >
         {[
           {
             title: 'AI-Powered Analysis',
             description: 'AI detects defects and issues from photos automatically',
             icon: Zap,
           },
           {
             title: 'Offline-First Design',
             description: 'Work without internet, sync when connected',
             icon: FileText,
           },
           {
             title: 'Professional Reports',
             description: 'Generate PDF reports with findings and recommendations',
             icon: BarChart3,
           },
         ].map((feature, index) => {
           const Icon = feature.icon;
           return (
             <motion.div
               key={index}
               variants={itemVariants}
               className="relative overflow-hidden rounded-2xl p-6 card-gradient border border-border/10"
             >
               <div className="relative z-10">
                 <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/15">
                   <Icon size={24} className="text-primary" />
                 </div>
                 <h3 className="text-lg font-semibold text-foreground mb-2">
                   {feature.title}
                 </h3>
                 <p className="text-sm text-muted-foreground">{feature.description}</p>
               </div>
             </motion.div>
           );
         })}
       </motion.div>
     </div>
   );
 }
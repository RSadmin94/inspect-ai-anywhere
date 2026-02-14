import React, { useState, useEffect } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import {
   LayoutDashboard,
   FileText,
   Camera,
   Settings,
   LogOut,
   Menu,
   X,
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';
import { InspectionRecord } from '@/lib/db';
import { useIsMobile } from '@/hooks/use-mobile';
 
 type Page = 'dashboard' | 'inspection' | 'reports' | 'settings';
 
 interface AppSidebarProps {
   currentPage: Page;
   onPageChange: (page: Page) => void;
   onNewInspection: () => void;
   inspectionActive: boolean;
  inspection?: InspectionRecord | null;
   t: (key: string) => string;
 }
 
 export function AppSidebar({
   currentPage,
   onPageChange,
   onNewInspection,
   inspectionActive,
  inspection,
   t,
 }: AppSidebarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  // Initialize sidebar state based on device type
  useEffect(() => {
    // Only set initial state once we know the device type
    if (isOpen === null) {
      setIsOpen(!isMobile);
    }
  }, [isMobile, isOpen]);

  // Auto-close sidebar on mobile when page changes (from any source)
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [currentPage, isMobile]);

  // Close sidebar when navigating on mobile
  const handlePageChangeWithClose = (page: Page) => {
    onPageChange(page);
    if (isMobile) {
      setIsOpen(false);
    }
  };
 
   const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
     { id: 'dashboard', label: t('overview'), icon: LayoutDashboard },
     { id: 'inspection', label: t('inspection'), icon: Camera },
     { id: 'reports', label: t('generateReport'), icon: FileText },
     { id: 'settings', label: t('settings'), icon: Settings },
   ];
 
   return (
     <>
       {/* Mobile Toggle Button */}
       <button
         onClick={() => setIsOpen(!isOpen)}
         className="fixed top-4 left-4 z-50 p-2 rounded-lg glass md:hidden"
       >
         {isOpen ? (
           <X size={20} className="text-primary" />
         ) : (
           <Menu size={20} className="text-primary" />
         )}
       </button>
 
       {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen w-72 z-40 flex flex-col transition-transform duration-300 ease-in-out",
          "md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
         {/* Glassmorphism Background */}
         <div className="absolute inset-0 glass border-r border-border/20" />
 
         {/* Mesh Gradient Overlay */}
         <div
           className="absolute inset-0 opacity-30"
           style={{
             background: 'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)',
           }}
         />
 
         {/* Content */}
         <div className="relative h-full flex flex-col p-6 overflow-y-auto">
           {/* Logo Section */}
           <motion.div
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="mb-8 flex items-center gap-3"
           >
            <img 
              src={logoImage} 
              alt="365 InspectAI Logo" 
              className="w-20 h-20 rounded-lg object-contain"
            />
             <div>
               <h1 className="text-lg font-bold text-foreground">365 InspectAI</h1>
               <p className="text-xs text-muted-foreground">{t('pro')}</p>
             </div>
           </motion.div>
 
           {/* Navigation */}
           <nav className="flex-1 flex flex-col gap-2">
             {navItems.map((item, index) => {
               const Icon = item.icon;
               const isActive = currentPage === item.id;
               const isDisabled = item.id === 'inspection' && !inspectionActive;
 
               return (
                 <motion.button
                   key={item.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => !isDisabled && handlePageChangeWithClose(item.id)}
                   disabled={isDisabled}
                   className={cn(
                     'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200',
                     isActive
                       ? 'bg-primary/20 border-primary/50'
                       : 'bg-transparent border-transparent hover:bg-secondary/30',
                     isDisabled && 'opacity-50 cursor-not-allowed'
                   )}
                 >
                   <Icon
                     size={20}
                     className={cn(
                       isActive ? 'text-primary' : 'text-muted-foreground'
                     )}
                   />
                   <span
                     className={cn(
                       'text-sm font-medium',
                       isActive ? 'text-primary' : 'text-muted-foreground'
                     )}
                   >
                     {item.label}
                   </span>
                 </motion.button>
               );
             })}
           </nav>
 
           {/* Divider */}
           <div className="my-6 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
 
           {/* Status Badge */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30"
           >
             <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
               <span className="text-xs font-semibold text-accent">
                  {inspectionActive ? t('inspection') + ' ' + t('online') : t('ready')}
               </span>
             </div>
             <p className="text-xs text-accent/80">
                {inspectionActive && inspection?.propertyAddress 
                  ? inspection.propertyAddress 
                  : inspectionActive 
                    ? t('currentInspection')
                    : t('newInspection')}
             </p>
           </motion.div>
 
           {/* New Inspection Button */}
           <motion.button
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.5 }}
             onClick={onNewInspection}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg btn-gradient text-primary-foreground text-sm font-medium transition-all duration-200 hover:shadow-glow"
           >
             <Camera size={16} />
             {t('newInspection')}
           </motion.button>
         </div>
       </div>
 
       {/* Mobile Overlay */}
       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setIsOpen(false)}
             className="fixed inset-0 bg-background/50 backdrop-blur-sm z-30 md:hidden"
           />
         )}
       </AnimatePresence>
     </>
   );
 }
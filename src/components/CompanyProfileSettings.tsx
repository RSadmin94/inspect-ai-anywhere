import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Upload, X, Plus, Save, FileText, Shield } from 'lucide-react';
import { CompanyProfile, getCompanyProfile, saveCompanyProfile, getDefaultCompanyProfile } from '@/lib/companyProfile';
import { useLanguage } from '@/hooks/useLanguage';
import { StorageMeter } from './StorageMeter';
import { LicenseSettings } from './LicenseSettings';
import { TermsOfService } from './TermsOfService';
import { PrivacyPolicy } from './PrivacyPolicy';

export function CompanyProfileSettings() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<CompanyProfile>(getDefaultCompanyProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCertification, setNewCertification] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const saved = await getCompanyProfile();
      if (saved) {
        setProfile(saved);
      }
    } catch (e) {
      console.error('Failed to load company profile:', e);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCompanyProfile(profile);
      toast.success(language === 'es' ? 'Perfil guardado' : 'Profile saved');
    } catch (e) {
      toast.error(language === 'es' ? 'Error al guardar' : 'Failed to save');
    }
    setIsSaving(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(language === 'es' ? 'Por favor seleccione una imagen' : 'Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      setProfile(prev => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const addCertification = () => {
    if (!newCertification.trim()) return;
    setProfile(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCertification.trim()]
    }));
    setNewCertification('');
  };

  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || []
    }));
  };

  const updateField = (field: keyof CompanyProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {language === 'es' ? 'Perfil de la Empresa' : 'Company Profile'}
        </CardTitle>
        <CardDescription>
          {language === 'es' 
            ? 'Configure la información de su empresa para los informes de inspección'
            : 'Configure your company information for inspection reports'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>{language === 'es' ? 'Logo de la Empresa' : 'Company Logo'}</Label>
          <div className="flex items-center gap-4">
            {(logoPreview || profile.logoUrl) && (
              <img 
                src={logoPreview || profile.logoUrl} 
                alt="Company logo" 
                className="h-16 w-auto object-contain border rounded"
              />
            )}
            <label className="cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                className="hidden" 
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Subir Logo' : 'Upload Logo'}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Company Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === 'es' ? 'Nombre de la Empresa' : 'Company Name'}</Label>
            <Input
              value={profile.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="365 InspectAI"
            />
          </div>
          <div className="space-y-2">
            <Label>{language === 'es' ? 'Nombre en Español' : 'Spanish Name'}</Label>
            <Input
              value={profile.companyNameEs || ''}
              onChange={(e) => updateField('companyNameEs', e.target.value)}
              placeholder="365 InspectAI"
            />
          </div>
        </div>

        {/* Inspector Name */}
        <div className="space-y-2">
          <Label>{language === 'es' ? 'Nombre del Inspector Principal' : 'Primary Inspector Name'}</Label>
          <Input
            value={profile.inspectorName || ''}
            onChange={(e) => updateField('inspectorName', e.target.value)}
            placeholder="John Smith"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === 'es' ? 'Teléfono' : 'Phone'}</Label>
            <Input
              value={profile.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={profile.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="contact@company.com"
            />
          </div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label>{language === 'es' ? 'Sitio Web' : 'Website'}</Label>
          <Input
            value={profile.website || ''}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="www.company.com"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label>{language === 'es' ? 'Dirección' : 'Address'}</Label>
          <Input
            value={profile.address || ''}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>{language === 'es' ? 'Ciudad' : 'City'}</Label>
            <Input
              value={profile.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Atlanta"
            />
          </div>
          <div className="space-y-2">
            <Label>{language === 'es' ? 'Estado' : 'State'}</Label>
            <Input
              value={profile.state || ''}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="GA"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>{language === 'es' ? 'Código Postal' : 'ZIP Code'}</Label>
            <Input
              value={profile.zip || ''}
              onChange={(e) => updateField('zip', e.target.value)}
              placeholder="30301"
            />
          </div>
        </div>

        {/* License Number */}
        <div className="space-y-2">
          <Label>{language === 'es' ? 'Número de Licencia' : 'License Number'}</Label>
          <Input
            value={profile.licenseNumber || ''}
            onChange={(e) => updateField('licenseNumber', e.target.value)}
            placeholder="HI-12345"
          />
        </div>

        {/* Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === 'es' ? 'Eslogan' : 'Tagline'}</Label>
            <Textarea
              value={profile.tagline || ''}
              onChange={(e) => updateField('tagline', e.target.value)}
              placeholder="Your trusted inspection partner"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === 'es' ? 'Eslogan en Español' : 'Spanish Tagline'}</Label>
            <Textarea
              value={profile.taglineEs || ''}
              onChange={(e) => updateField('taglineEs', e.target.value)}
              placeholder="Su socio de confianza en inspecciones"
              rows={2}
            />
          </div>
        </div>

        {/* Certifications */}
        <div className="space-y-2">
          <Label>{language === 'es' ? 'Certificaciones y Afiliaciones' : 'Certifications & Affiliations'}</Label>
          <div className="flex gap-2">
            <Input
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder={language === 'es' ? 'Ej: InterNACHI Certified' : 'e.g., InterNACHI Certified'}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addCertification}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.certifications?.map((cert, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {cert}
                <button onClick={() => removeCertification(index)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom Legalese Section */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">
            {language === 'es' ? 'Textos Legales Personalizados' : 'Custom Legal Text'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {language === 'es' 
              ? 'Agregue sus propios términos legales, exenciones de responsabilidad y limitaciones que aparecerán en los informes de inspección.'
              : 'Add your own legal terms, disclaimers, and limitations that will appear in inspection reports.'}
          </p>

          {/* Scope and Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Alcance y Limitaciones' : 'Scope & Limitations'}</Label>
              <Textarea
                value={profile.scopeAndLimitations || ''}
                onChange={(e) => updateField('scopeAndLimitations', e.target.value)}
                placeholder={language === 'es' 
                  ? 'Describa el alcance y las limitaciones de sus inspecciones...'
                  : 'Describe the scope and limitations of your inspections...'}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Alcance y Limitaciones (Español)' : 'Scope & Limitations (Spanish)'}</Label>
              <Textarea
                value={profile.scopeAndLimitationsEs || ''}
                onChange={(e) => updateField('scopeAndLimitationsEs', e.target.value)}
                placeholder="Describa el alcance y las limitaciones de sus inspecciones..."
                rows={5}
              />
            </div>
          </div>

          {/* Custom Disclaimer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Exención de Responsabilidad' : 'Disclaimer'}</Label>
              <Textarea
                value={profile.customDisclaimer || ''}
                onChange={(e) => updateField('customDisclaimer', e.target.value)}
                placeholder={language === 'es' 
                  ? 'Agregue sus exenciones de responsabilidad personalizadas...'
                  : 'Add your custom disclaimers...'}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Exención de Responsabilidad (Español)' : 'Disclaimer (Spanish)'}</Label>
              <Textarea
                value={profile.customDisclaimerEs || ''}
                onChange={(e) => updateField('customDisclaimerEs', e.target.value)}
                placeholder="Agregue sus exenciones de responsabilidad personalizadas..."
                rows={5}
              />
            </div>
          </div>

          {/* Liability Statement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Declaración de Responsabilidad' : 'Liability Statement'}</Label>
              <Textarea
                value={profile.liabilityStatement || ''}
                onChange={(e) => updateField('liabilityStatement', e.target.value)}
                placeholder={language === 'es' 
                  ? 'Agregue su declaración de responsabilidad...'
                  : 'Add your liability statement...'}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Declaración de Responsabilidad (Español)' : 'Liability Statement (Spanish)'}</Label>
              <Textarea
                value={profile.liabilityStatementEs || ''}
                onChange={(e) => updateField('liabilityStatementEs', e.target.value)}
                placeholder="Agregue su declaración de responsabilidad..."
                rows={5}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isSaving 
            ? (language === 'es' ? 'Guardando...' : 'Saving...') 
            : (language === 'es' ? 'Guardar Perfil' : 'Save Profile')}
        </Button>

        {/* Storage Meter */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">
            {language === 'es' ? 'Almacenamiento' : 'Storage'}
          </h3>
          <StorageMeter />
        </div>

        {/* License Settings */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">
            {language === 'es' ? 'Licencia' : 'License'}
          </h3>
          <LicenseSettings />
        </div>

        {/* Legal Links */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">
            {language === 'es' ? 'Legal' : 'Legal'}
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setShowTerms(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium">{language === 'es' ? 'Términos de Servicio' : 'Terms of Service'}</span>
            </button>
            <button
              onClick={() => setShowPrivacy(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-medium">{language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}</span>
            </button>
          </div>
        </div>
      </CardContent>

      {/* Legal Modals */}
      <TermsOfService isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </Card>
  );
}

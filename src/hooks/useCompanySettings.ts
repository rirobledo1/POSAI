import { useState, useEffect } from 'react';

interface CompanySettings {
  id: string;
  name: string;
  businessName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  currency: string;
  timezone: string;
  fiscalYear: string;
  taxPercentage: number;
  invoicePrefix: string;
  quotePrefix: string;
  receiptPrefix: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function useCompanySettings() {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/company');
      
      if (!response.ok) {
        console.warn('⚠️ No se pudo cargar la configuración de empresa, usando valores por defecto');
        // En lugar de lanzar error, usar configuración por defecto
        setCompanySettings({
          id: 'default',
          name: 'Mi Empresa',
          businessName: 'Mi Empresa S.A.',
          taxId: 'XAXX010101000',
          email: 'contacto@miempresa.com',
          phone: '+1234567890',
          address: 'Dirección de la empresa',
          city: 'Ciudad',
          state: 'Estado',
          country: 'País',
          postalCode: '12345',
          currency: 'MXN',
          timezone: 'America/Mexico_City',
          fiscalYear: 'enero',
          taxPercentage: 16,
          invoicePrefix: 'FAC-',
          quotePrefix: 'COT-',
          receiptPrefix: 'REC-',
          logo: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setError(null); // No mostrar error, usar valores por defecto
        return;
      }
      
      const data = await response.json();
      setCompanySettings(data);
      setError(null);
    } catch (err) {
      console.warn('⚠️ Error cargando configuración de empresa, usando valores por defecto:', err);
      // Usar configuración por defecto en caso de error
      setCompanySettings({
        id: 'default',
        name: 'Mi Empresa',
        businessName: 'Mi Empresa S.A.',
        taxId: 'XAXX010101000',
        email: 'contacto@miempresa.com',
        phone: '+1234567890',
        address: 'Dirección de la empresa',
        city: 'Ciudad',
        state: 'Estado',
        country: 'País',
        postalCode: '12345',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
        fiscalYear: 'enero',
        taxPercentage: 16,
        invoicePrefix: 'FAC-',
        quotePrefix: 'COT-',
        receiptPrefix: 'REC-',
        logo: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setError(null); // No mostrar error al usuario final
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔥 PRIORIDAD BAJA: Esperar 1 segundo antes de cargar configuración de empresa
    // Esto da prioridad a productos y clientes
    const timer = setTimeout(() => {
      console.log('🏢 Cargando configuración de empresa (prioridad baja)...');
      fetchCompanySettings();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const refetch = () => {
    fetchCompanySettings();
  };

  return {
    companySettings,
    loading,
    error,
    refetch,
    // Valores por defecto para evitar errores
    taxRate: companySettings?.taxPercentage ? companySettings.taxPercentage / 100 : 0.16,
    currency: companySettings?.currency || 'MXN'
  };
}

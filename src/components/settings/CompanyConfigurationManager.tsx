'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { 
  BuildingOfficeIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  businessType: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  taxRate: number;
  currency: string;
}

const BUSINESS_TYPES = [
  { value: 'GENERAL', label: '🏪 General / Otro', description: 'Negocio general o no especificado' },
  { value: 'FERRETERIA', label: '🔧 Ferretería', description: 'Herramientas, tornillería, construcción' },
  { value: 'ABARROTES', label: '🛒 Abarrotes', description: 'Tienda de conveniencia, alimentos' },
  { value: 'PAPELERIA', label: '📝 Papelería', description: 'Artículos de oficina, escolar' },
  { value: 'FARMACIA', label: '💊 Farmacia', description: 'Medicamentos, productos de salud' },
  { value: 'RESTAURANTE', label: '🍽️ Restaurante', description: 'Comida, bebidas, servicio alimentario' },
  { value: 'ROPA', label: '👕 Ropa y Textiles', description: 'Vestimenta, calzado, accesorios' },
  { value: 'ELECTRONICA', label: '📱 Electrónicos', description: 'Dispositivos, componentes electrónicos' },
  { value: 'AUTOMOTRIZ', label: '🚗 Automotriz', description: 'Repuestos, accesorios para autos' },
  { value: 'BELLEZA', label: '💄 Belleza y Cuidado', description: 'Cosméticos, cuidado personal' },
  { value: 'DEPORTES', label: '⚽ Deportes', description: 'Equipamiento deportivo, fitness' },
  { value: 'JUGUETERIA', label: '🧸 Juguetería', description: 'Juguetes, entretenimiento infantil' },
  { value: 'LIBRERIA', label: '📚 Librería', description: 'Libros, material educativo' }
];

export default function CompanyConfigurationManager() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('/api/company');
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      } else {
        // Si no existe, crear una configuración por defecto
        setCompany({
          id: '',
          name: 'Mi Empresa',
          businessType: 'GENERAL',
          phone: '',
          email: '',
          address: '',
          taxId: '',
          taxRate: 16.00,
          currency: 'MXN'
        });
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración de empresa' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/company', {
        method: company.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(company),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Error al guardar la configuración' });
      }
    } catch (error) {
      console.error('Error saving company:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setSaving(false);
    }
  };

  const updateCompany = (field: keyof Company, value: string | number) => {
    if (!company) return;
    setCompany({ ...company, [field]: value });
  };

  const selectedBusinessType = BUSINESS_TYPES.find(bt => bt.value === company?.businessType);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BuildingOfficeIcon className="h-5 w-5" />
          Configuración de Empresa
        </CardTitle>
        <CardDescription>
          Configura la información básica de tu empresa y selecciona el tipo de negocio para optimizar las categorías predeterminadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert className={`mb-4 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            )}
            <div>
              <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {message.text}
              </p>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre de la Empresa *</Label>
              <Input
                id="name"
                value={company?.name || ''}
                onChange={(e) => updateCompany('name', e.target.value)}
                placeholder="Nombre de tu empresa"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={company?.phone || ''}
                onChange={(e) => updateCompany('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={company?.email || ''}
                onChange={(e) => updateCompany('email', e.target.value)}
                placeholder="contacto@miempresa.com"
              />
            </div>
            <div>
              <Label htmlFor="taxId">RFC / ID Fiscal</Label>
              <Input
                id="taxId"
                value={company?.taxId || ''}
                onChange={(e) => updateCompany('taxId', e.target.value)}
                placeholder="RFC123456789"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={company?.address || ''}
              onChange={(e) => updateCompany('address', e.target.value)}
              placeholder="Calle, colonia, ciudad, estado"
            />
          </div>

          {/* Tipo de Negocio */}
          <div>
            <Label htmlFor="businessType">Tipo de Negocio *</Label>
            <select
              id="businessType"
              value={company?.businessType || 'GENERAL'}
              onChange={(e) => updateCompany('businessType', e.target.value)}
              className="w-full mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              required
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {selectedBusinessType && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedBusinessType.description}
              </p>
            )}
          </div>

          {/* Configuración Fiscal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={company?.taxRate || 16}
                onChange={(e) => updateCompany('taxRate', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="currency">Moneda</Label>
              <select
                id="currency"
                value={company?.currency || 'MXN'}
                onChange={(e) => updateCompany('currency', e.target.value)}
                className="w-full mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
                <option value="COP">COP - Peso Colombiano</option>
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="CLP">CLP - Peso Chileno</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


"use client";

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import RouteProtector from '@/components/layout/RouteProtector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartBarIcon, DocumentChartBarIcon, CurrencyDollarIcon, CubeIcon, UsersIcon, EyeIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function ReportsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annual, setAnnual] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [monthRange, setMonthRange] = useState<{ start: number; end: number }>({ start: 1, end: 12 });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const statsRes = await fetch('/api/dashboard/stats', { credentials: 'include' });
        if (!statsRes.ok) throw new Error('No se pudo cargar stats');
        const statsData = await statsRes.json();
        setStats(statsData);
        const year = selectedYear || new Date().getFullYear();
        const annualRes = await fetch(`/api/reports/sales-annual?year=${year}`);
        if (!annualRes.ok) throw new Error('No se pudo cargar reportes anuales');
        const annualRaw = await annualRes.json();
        const months: any[] = [];
        const monthNames = [ '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre' ];
        const data = annualRaw.data || {};
        const y = String(year);
        for (let m = 1; m <= 12; m++) {
          const row = data[y]?.[m] || { totalVentas: 0, totalEnvio: 0, totalProductos: 0 };
          months.push({ month: m, monthName: monthNames[m], total: row.totalVentas, delivery: row.totalEnvio, products: row.totalProductos });
        }
        const years = Object.keys(data).map(Number);
        setAnnual({ months, years });
        if (!selectedYear) setSelectedYear(year);
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [selectedYear]);

  const availableYears = annual?.years || [new Date().getFullYear()];
  const filteredData = (annual?.months || []).filter((m: any) => m.month >= monthRange.start && m.month <= monthRange.end);

  function exportToCSV() {
    if (!filteredData.length) return;
    const header = ['Mes', 'Ventas Totales', 'Delivery', 'Productos'];
    const rows = filteredData.map((m: any) => [m.monthName, m.total, m.delivery, m.products]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ventas-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <RouteProtector allowedRoles={['ADMIN', 'SOLO_LECTURA', 'VENDEDOR', 'ALMACEN']}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-600">Cargando reportes...</p>
            </div>
          </div>
        </MainLayout>
      </RouteProtector>
    );
  }

  if (error) {
    return (
      <RouteProtector allowedRoles={['ADMIN', 'SOLO_LECTURA', 'VENDEDOR', 'ALMACEN']}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600">Error al cargar reportes: {error}</p>
              <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Reintentar</button>
            </div>
          </div>
        </MainLayout>
      </RouteProtector>
    );
  }

  return (
    <RouteProtector allowedRoles={['ADMIN', 'SOLO_LECTURA', 'VENDEDOR', 'ALMACEN']}>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between flex-col md:flex-row">
            <div className="mb-4 w-full">
              <div className="flex flex-wrap gap-4 items-center mb-2">
                <div className="flex items-center text-sm text-gray-500">
                  <EyeIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                  Vista de solo lectura
                </div>
                {session?.user?.name && (
                  <div className="flex items-center text-sm text-gray-500">
                    <UsersIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                    {session.user.name}
                  </div>
                )}
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {session?.user?.role || 'Usuario'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href="/reports" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">General</a>
                <a href="/reports/products" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Por Producto</a>
                <a href="/reports/categories" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Por Categoría</a>
                <a href="/reports/users" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Por Vendedor</a>
                <a href="/reports/customers" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Por Cliente</a>
                <a href="/reports/payments" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Métodos de Pago</a>
                <a href="/reports/inventory" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Inventario</a>
                <a href="/reports/returns" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Devoluciones</a>
                <a href="/reports/profit" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Utilidades</a>
                <a href="/reports/times" className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200">Por Hora/Día/Semana</a>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <DocumentChartBarIcon className="h-8 w-8 text-indigo-600" />
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Reportes y Analytics</h2>
              </div>
            </div>
          </div>
          {/* Filtros y exportación */}
          <div className="flex flex-wrap items-end gap-4 py-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">Año</label>
              <select className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" value={selectedYear || ''} onChange={e => setSelectedYear(Number(e.target.value))}>
                {availableYears.map((y: number) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Mes inicio</label>
              <input type="number" min={1} max={12} value={monthRange.start} onChange={e => setMonthRange(r => ({ ...r, start: Number(e.target.value) }))} className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Mes fin</label>
              <input type="number" min={monthRange.start} max={12} value={monthRange.end} onChange={e => setMonthRange(r => ({ ...r, end: Number(e.target.value) }))} className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <button onClick={exportToCSV} className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700" disabled={!filteredData.length}>Exportar CSV</button>
          </div>
          {/* Gráfica anual */}
          <div className="bg-white rounded-lg shadow p-4">
            {filteredData.length ? (
              <>
                {/* @ts-ignore: recharts may not have types */}
                <BarChart width={600} height={300} data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#6366f1" />
                  <Bar dataKey="delivery" name="Delivery" fill="#f59e42" />
                  <Bar dataKey="products" name="Productos" fill="#10b981" />
                </BarChart>
              </>
            ) : (
              <div className="text-center text-gray-400">No hay datos para el rango seleccionado.</div>
            )}
          </div>
          {/* Tabla de datos */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((m: any) => (
                  <tr key={m.month}>
                    <td className="px-4 py-2 whitespace-nowrap">{m.monthName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">${m.total?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 whitespace-nowrap">${m.delivery?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 whitespace-nowrap">${m.products?.toLocaleString() || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Reporte por Producto */}
          <div className="mt-10">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Ventas por Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductsReportSection />
              </CardContent>
            </Card>
          </div>
          {/* Reporte por Categoría */}
          <div className="mt-10">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Ventas por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoriesReportSection />
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </RouteProtector>
  );
}

function ProductsReportSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthStart, setMonthStart] = useState<number>(1);
  const [monthEnd, setMonthEnd] = useState<number>(12);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reports/sales-by-product?year=${year}&monthStart=${monthStart}&monthEnd=${monthEnd}`);
        if (!res.ok) throw new Error('No se pudo cargar el reporte');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, monthStart, monthEnd]);

  function exportToCSV() {
    if (!products.length) return;
    const header = ['Producto', 'Cantidad Vendida', 'Ingresos'];
    const rows = products.map((p) => [p.product_name, p.total_quantity, p.total_revenue]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-productos-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 py-2">
        <div>
          <label className="block text-xs font-medium text-gray-700">Año</label>
          <input type="number" min={2020} max={new Date().getFullYear()} value={year} onChange={e => setYear(Number(e.target.value))} className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Mes inicio</label>
          <input type="number" min={1} max={12} value={monthStart} onChange={e => setMonthStart(Number(e.target.value))} className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Mes fin</label>
          <input type="number" min={monthStart} max={12} value={monthEnd} onChange={e => setMonthEnd(Number(e.target.value))} className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <button onClick={exportToCSV} className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700" disabled={!products.length}>Exportar CSV</button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400">Cargando...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad Vendida</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((p) => (
                <tr key={p.product_id}>
                  <td className="px-4 py-2 whitespace-nowrap">{p.product_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{p.total_quantity}</td>
                  <td className="px-4 py-2 whitespace-nowrap">${Number(p.total_revenue).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length && <div className="text-center text-gray-400 py-4">No hay datos para el periodo seleccionado.</div>}
        </div>
      )}
    </div>
  );
}

function CategoriesReportSection() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthStart, setMonthStart] = useState<number>(1);
  const [monthEnd, setMonthEnd] = useState<number>(12);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reports/sales-by-category?year=${year}&monthStart=${monthStart}&monthEnd=${monthEnd}`);
        if (!res.ok) throw new Error('No se pudo cargar el reporte');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, monthStart, monthEnd]);

  function exportToCSV() {
    if (!categories.length) return;
    const header = ['Categoría', 'Cantidad Vendida', 'Ingresos'];
    const rows = categories.map((c) => [c.category_name, c.total_quantity, c.total_revenue]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-categorias-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 py-2">
        <div>
          <label className="block text-xs font-medium text-gray-700">Año</label>
          <input type="number" min={2020} max={new Date().getFullYear()} value={year} onChange={e => setYear(Number(e.target.value))} className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Mes inicio</label>
          <input type="number" min={1} max={12} value={monthStart} onChange={e => setMonthStart(Number(e.target.value))} className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Mes fin</label>
          <input type="number" min={monthStart} max={12} value={monthEnd} onChange={e => setMonthEnd(Number(e.target.value))} className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <button onClick={exportToCSV} className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700" disabled={!categories.length}>Exportar CSV</button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400">Cargando...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad Vendida</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((c) => (
                <tr key={c.category_id}>
                  <td className="px-4 py-2 whitespace-nowrap">{c.category_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{c.total_quantity}</td>
                  <td className="px-4 py-2 whitespace-nowrap">${Number(c.total_revenue).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!categories.length && <div className="text-center text-gray-400 py-4">No hay datos para el periodo seleccionado.</div>}
        </div>
      )}
    </div>
  );
}

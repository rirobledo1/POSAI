"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import RouteProtector from "@/components/layout/RouteProtector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentChartBarIcon } from "@heroicons/react/24/outline";

export default function SalesByProductReport() {
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
        if (!res.ok) throw new Error("No se pudo cargar el reporte");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, monthStart, monthEnd]);

  function exportToCSV() {
    if (!products.length) return;
    const header = ["Producto", "Cantidad Vendida", "Ingresos"];
    const rows = products.map((p) => [p.product_name, p.total_quantity, p.total_revenue]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-productos-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <RouteProtector allowedRoles={["ADMIN"]}>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <DocumentChartBarIcon className="h-8 w-8 text-indigo-600" />
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Reporte de Ventas por Producto
            </h2>
          </div>
          <div className="flex flex-wrap items-end gap-4 py-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">Año</label>
              <input
                type="number"
                min={2020}
                max={new Date().getFullYear()}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Mes inicio</label>
              <input
                type="number"
                min={1}
                max={12}
                value={monthStart}
                onChange={(e) => setMonthStart(Number(e.target.value))}
                className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Mes fin</label>
              <input
                type="number"
                min={monthStart}
                max={12}
                value={monthEnd}
                onChange={(e) => setMonthEnd(Number(e.target.value))}
                className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={exportToCSV}
              className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              disabled={!products.length}
            >
              Exportar CSV
            </button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Productos más vendidos</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteProtector>
  );
}

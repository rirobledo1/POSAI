// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook para hacer debouncing de valores
 * Útil para búsquedas y filtros que no deben ejecutarse en cada tecla
 * 
 * @param value - Valor a hacer debounce
 * @param delay - Tiempo de espera en milisegundos (default: 300ms)
 * @returns Valor con debounce aplicado
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * // debouncedSearch solo se actualiza 300ms después de que el usuario deje de escribir
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si el valor cambia antes de que se complete el delay
    // Esto previene actualizaciones innecesarias
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;

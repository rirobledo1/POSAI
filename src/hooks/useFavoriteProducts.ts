// src/hooks/useFavoriteProducts.ts
import { useState, useEffect } from 'react';

export interface FavoriteProductSettings {
  featuredProductIds: string[];
  lastUpdated: Date;
}

const STORAGE_KEY = 'ferreai_favorite_products';

export default function useFavoriteProducts() {
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);

  // Cargar favoritos del localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings: FavoriteProductSettings = JSON.parse(stored);
        setFavoriteProducts(settings.featuredProductIds || []);
      }
    } catch (error) {
      console.warn('Error loading favorite products:', error);
    }
  }, []);

  // Guardar favoritos en localStorage
  const saveFavorites = (productIds: string[]) => {
    try {
      const settings: FavoriteProductSettings = {
        featuredProductIds: productIds,
        lastUpdated: new Date()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setFavoriteProducts(productIds);
    } catch (error) {
      console.error('Error saving favorite products:', error);
    }
  };

  // Agregar producto a favoritos
  const addToFavorites = (productId: string) => {
    const newFavorites = [...favoriteProducts];
    if (!newFavorites.includes(productId)) {
      newFavorites.push(productId);
      saveFavorites(newFavorites);
    }
  };

  // Remover producto de favoritos
  const removeFromFavorites = (productId: string) => {
    const newFavorites = favoriteProducts.filter(id => id !== productId);
    saveFavorites(newFavorites);
  };

  // Toggle favorite status
  const toggleFavorite = (productId: string) => {
    if (favoriteProducts.includes(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(productId);
    }
  };

  // Verificar si un producto es favorito
  const isFavorite = (productId: string) => favoriteProducts.includes(productId);

  return {
    favoriteProducts,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    saveFavorites
  };
}

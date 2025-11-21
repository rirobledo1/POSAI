'use client';

import { useState, useEffect, memo } from 'react';
import type { NavItem } from '@/hooks/useRoleBasedNavigation';
import { Badge } from '@/components/ui/badge';
import { useAlertCount } from '@/hooks/useAlertCount';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface SubscriptionInfo {
  planType: string;
  isInTrial: boolean;
  daysRemaining: number;
}

interface SubscriptionAwareNavigationProps {
  navigation: NavItem[];
  onNavigate: (href: string) => void;
  isNavigating?: boolean;
  navigatingTo?: string | null;
}

const SubscriptionAwareNavigation = memo(({ 
  navigation, 
  onNavigate,
  isNavigating = false,
  navigatingTo = null
}: SubscriptionAwareNavigationProps) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    planType: 'FREE',
    isInTrial: false,
    daysRemaining: 0
  });
  
  // Hook para el contador de alertas
  const { count: alertCount } = useAlertCount();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/subscriptions/status');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo({
            planType: data.planType || 'FREE',
            isInTrial: data.isInTrial || false,
            daysRemaining: data.daysRemaining || 0
          });
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  const isSubscriptionItem = (name: string) => name === 'Suscripción';
  const isFreeOrTrial = subscriptionInfo.planType === 'FREE';

  // Handler para links externos (abrir en nueva ventana)
  const handleClick = (item: NavItem) => {
    if (item.external) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(item.href);
    }
  };

  return (
    <nav className="mt-5 flex-1 px-2 space-y-1">
      {navigation.map((item) => {
        const isSubscription = isSubscriptionItem(item.name);
        const isThisItemNavigating = isNavigating && navigatingTo === item.href;
        
        return (
          <button
            key={item.name}
            onClick={() => handleClick(item)}
            disabled={isNavigating}
            className={`
              ${
                item.current
                  ? isSubscription && isFreeOrTrial
                    ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-900 border-2 border-orange-400'
                    : 'bg-gray-100 text-gray-900'
                  : isSubscription && isFreeOrTrial
                    ? 'text-orange-700 hover:bg-orange-50 hover:text-orange-900 border-2 border-orange-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } 
              group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-all duration-200
              ${
                isSubscription && isFreeOrTrial ? 'animate-pulse shadow-md' : ''
              }
              ${
                isThisItemNavigating ? 'bg-blue-100 border-2 border-blue-500' : ''
              }
              ${
                isNavigating && !isThisItemNavigating ? 'opacity-50 cursor-not-allowed' : ''
              }
            `}
            title={item.description}
          >
            <div className="flex items-center flex-1 min-w-0">
              {isThisItemNavigating ? (
                // Spinner mientras navega
                <div className="h-6 w-6 mr-3 flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <item.icon
                  className={`
                    ${
                      item.current 
                        ? isSubscription && isFreeOrTrial 
                          ? 'text-orange-600' 
                          : 'text-gray-500'
                        : isSubscription && isFreeOrTrial
                          ? 'text-orange-500 group-hover:text-orange-600'
                          : 'text-gray-400 group-hover:text-gray-500'
                    } 
                    h-6 w-6 mr-3 transition-colors flex-shrink-0
                  `}
                />
              )}
              <span className="truncate">
                {item.name}
                {isThisItemNavigating && (
                  <span className="ml-2 text-xs text-blue-600">Cargando...</span>
                )}
              </span>
            </div>

            {/* Badge solo para Suscripción FREE */}
            {isSubscription && isFreeOrTrial && (
              <Badge 
                className="ml-2 bg-orange-600 hover:bg-orange-700 text-white text-xs animate-bounce flex-shrink-0"
              >
                {subscriptionInfo.isInTrial ? `${subscriptionInfo.daysRemaining}d` : '⚡'}
              </Badge>
            )}

            {/* Badge para planes activos */}
            {isSubscription && !isFreeOrTrial && (
              <Badge 
                className="ml-2 bg-green-600 text-white text-xs flex-shrink-0"
              >
                ✔
              </Badge>
            )}
            
            {/* Badge para Alertas */}
            {item.name === 'Alertas' && alertCount > 0 && (
              <Badge 
                className="ml-2 bg-red-600 hover:bg-red-700 text-white text-xs flex-shrink-0 animate-pulse"
              >
                {alertCount}
              </Badge>
            )}
            
            {/* Indicador de enlace externo */}
            {item.external && (
              <ArrowTopRightOnSquareIcon 
                className="ml-2 h-4 w-4 text-gray-400 flex-shrink-0" 
                title="Abre en nueva ventana"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
});

SubscriptionAwareNavigation.displayName = 'SubscriptionAwareNavigation';

export default SubscriptionAwareNavigation;

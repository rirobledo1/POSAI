import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  change?: {
    value: string
    type: 'increase' | 'decrease' | 'neutral'
  }
  subtitle?: string
  loading?: boolean
}

export function StatCard({ title, value, icon, change, subtitle, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </CardTitle>
          {icon && <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>}
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {change && (
            <Badge
              variant={
                change.type === 'increase' 
                  ? 'success' 
                  : change.type === 'decrease' 
                  ? 'error' 
                  : 'secondary'
              }
            >
              {change.value}
            </Badge>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
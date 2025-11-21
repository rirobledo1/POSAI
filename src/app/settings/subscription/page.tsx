import { PlansComparison } from '@/components/subscriptions/PlansComparison'
import MainLayout from '@/components/layout/MainLayout'

export default function SubscriptionPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <PlansComparison />
      </div>
    </MainLayout>
  )
}

// src/types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    // 🆕 MULTI-TENANT
    companyId: string
    companyName: string
    companyPlan: string
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      // 🆕 MULTI-TENANT
      companyId: string
      companyName: string
      companyPlan: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
    // 🆕 MULTI-TENANT
    companyId: string
    companyName: string
    companyPlan: string
  }
}

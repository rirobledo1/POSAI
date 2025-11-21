// src/lib/auth.ts - ACTUALIZADO PARA MULTI-TENANT
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Email o Celular', type: 'text', placeholder: 'email@ejemplo.com o +1234567890' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null
        }

        const login = credentials.login.toLowerCase()
        const password = credentials.password

        try {
          // Importar Prisma y bcrypt dinámicamente
          const { prisma } = await import('@/lib/prisma')
          const bcrypt = await import('bcryptjs')
          
          console.log(`🔍 Intentando autenticación para: ${login}`)
          
          // Función para verificar si es email o teléfono
          const isEmail = login.includes('@')
          console.log(`📧 Es email: ${isEmail}`)
          
          // 🆕 MULTI-TENANT: Buscar usuario CON datos de compañía
          const user = await prisma.user.findFirst({
            where: {
              AND: [
                { isActive: true }, // Solo usuarios activos
                {
                  OR: isEmail 
                    ? [{ email: login }]
                    : [{ phone: login }]
                }
              ]
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              password: true,
              role: true,
              isActive: true,
              // 🆕 MULTI-TENANT: Incluir datos de la compañía
              companyId: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  plan: true,
                  status: true
                }
              }
            }
          })

          // Si no se encuentra el usuario
          if (!user) {
            console.log(`❌ Usuario no encontrado: ${login}`)
            console.log(`🔍 Buscando con criterio: ${isEmail ? 'email' : 'phone'} = ${login}`)
            return null
          }

          console.log(`✅ Usuario encontrado: ${user.name} (${user.email})`)
          console.log(`🏢 Compañía: ${user.company.name}`)
          console.log(`🔐 Hash en BD: ${user.password?.substring(0, 20)}...`)

          // Verificar contraseña
          const isValidPassword = await bcrypt.compare(password, user.password || '')
          console.log(`🔑 Contraseña válida: ${isValidPassword}`)
          
          if (!isValidPassword) {
            console.log(`❌ Contraseña incorrecta para: ${login}`)
            return null
          }

          console.log(`✅ Login exitoso: ${user.name} (${user.email})`)

          // 🆕 MULTI-TENANT: Retornar datos del usuario CON información de compañía
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company.name,
            companyPlan: user.company.plan
          }

        } catch (error) {
          console.error('❌ Error en autenticación:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // 🆕 MULTI-TENANT: Incluir datos de compañía en JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.companyId = user.companyId
        token.companyName = user.companyName
        token.companyPlan = user.companyPlan
      }
      return token
    },
    // 🆕 MULTI-TENANT: Incluir datos de compañía en session
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
        session.user.companyName = token.companyName as string
        session.user.companyPlan = token.companyPlan as string
      }
      return session
    }
  }
}

// Extender tipos de NextAuth
declare module 'next-auth' {
  interface User {
    role: string
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
    companyId: string
    companyName: string
    companyPlan: string
  }
}

import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 API Test - Funcionando!')
  return NextResponse.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  })
}
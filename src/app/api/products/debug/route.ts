// src/app/api/products/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    // Simple debug query without authentication
    const query = `SELECT id, name, price, stock FROM products LIMIT 5`;
    
    console.log('🔍 Debug query:', query);
    
    const result = await pool.query(query);
    console.log('✅ Debug result rows:', result.rows.length);
    
    return NextResponse.json({
      success: true,
      count: result.rows.length,
      products: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

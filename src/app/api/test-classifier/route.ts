/**
 * Endpoint temporal de test sin autenticación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClassifier } from '@/lib/intelligent-classifier';

export async function POST(request: NextRequest) {
  try {
    const { productName, description } = await request.json();
    
    console.log(`🧪 TEST: Clasificando producto "${productName}"`);
    
    const classifier = await getClassifier();
    const result = await classifier.classifyProduct({
      name: productName,
      description: description || '',
      cost: 10.0
    });
    
    console.log(`✅ TEST: Resultado de clasificación:`, result);
    
    return NextResponse.json({ 
      success: true, 
      result,
      message: `Producto "${productName}" clasificado como "${result.categoryName}"` 
    });
    
  } catch (error) {
    console.error('❌ TEST: Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
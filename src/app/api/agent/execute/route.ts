/**
 * Code Execution API
 * Executes Al-Marjaa code through the terminal controller service
 */

import { NextRequest, NextResponse } from 'next/server';

const TERMINAL_SERVICE_URL = 'http://localhost:3030';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'الكود مطلوب' },
        { status: 400 }
      );
    }

    // Try to execute via terminal controller service
    try {
      const response = await fetch(`${TERMINAL_SERVICE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          language: language || 'almarjaa' 
        })
      });

      if (response.ok) {
        const result = await response.json();
        return NextResponse.json(result);
      }
    } catch (serviceError) {
      console.log('Terminal service not available, using simulation');
    }

    // Simulation mode when terminal service is not available
    const lines = code.split('\n');
    let output = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Handle print statements
      const printMatch = trimmedLine.match(/اطبع\s*\(\s*["'](.+?)["']\s*\)/);
      if (printMatch) {
        output += printMatch[1] + '\n';
      }
      
      // Handle print with variable
      const printVarMatch = trimmedLine.match(/اطبع\s*\(\s*(.+?)\s*\)/);
      if (printVarMatch && !printMatch) {
        output += `[${printVarMatch[1]}]\n`;
      }
      
      // Handle variable declarations
      const varMatch = trimmedLine.match(/متغير\s+(\w+)\s*=\s*(.+)/);
      if (varMatch) {
        output += `← تم تعريف المتغير ${varMatch[1]}\n`;
      }
      
      // Handle function declarations
      const funcMatch = trimmedLine.match(/دالة\s+(\w+)\s*\(/);
      if (funcMatch) {
        output += `← تم تعريف الدالة ${funcMatch[1]}\n`;
      }
    }
    
    if (!output) {
      output = '✓ تم تنفيذ الكود بنجاح\n(وضع المحاكاة - الخدمة غير متصلة)';
    }

    return NextResponse.json({
      success: true,
      output,
      mode: 'simulation',
      message: 'تم التنفيذ في وضع المحاكاة'
    });

  } catch (error: any) {
    console.error('Execute API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ في التنفيذ' },
      { status: 500 }
    );
  }
}

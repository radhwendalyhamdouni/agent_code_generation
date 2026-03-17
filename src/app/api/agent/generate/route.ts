/**
 * Code Generation API
 * Generates Al-Marjaa code from natural language description
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDeepAgent } from '@/lib/deep-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, description, context, provider, model, apiKey } = body;

    const inputText = description || prompt;

    if (!inputText) {
      return NextResponse.json(
        { success: false, error: 'الوصف مطلوب' },
        { status: 400 }
      );
    }

    const agent = createDeepAgent(provider || 'zai', model, apiKey);
    const result = await agent.generateCode(inputText, context);

    return NextResponse.json({
      success: true,
      code: result.code,
      explanation: result.explanation
    });

  } catch (error: any) {
    console.error('Generate API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ في التوليد' },
      { status: 500 }
    );
  }
}

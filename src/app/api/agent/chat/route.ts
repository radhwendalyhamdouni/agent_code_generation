/**
 * Agent Chat API
 * Handles conversation with the AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDeepAgent } from '@/lib/deep-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, provider, model, apiKey, history } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'الرسالة مطلوبة' },
        { status: 400 }
      );
    }

    const agent = createDeepAgent(provider || 'zai', model, apiKey);
    
    // If there's history, we need to handle it
    if (history && Array.isArray(history)) {
      // For now, just process the current message
      // History is managed internally by the agent
    }
    
    const response = await agent.chat(message);
    
    // Extract code blocks from response
    const codeBlocks: Array<{ language: string; code: string }> = [];
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = codeRegex.exec(response)) !== null) {
      codeBlocks.push({
        language: match[1] || 'almarjaa',
        code: match[2].trim()
      });
    }

    return NextResponse.json({
      success: true,
      content: response,
      codeBlocks
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ في المعالجة' },
      { status: 500 }
    );
  }
}

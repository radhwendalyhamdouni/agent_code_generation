/**
 * AI Code Generation API
 * واجهة برمجة لتوليد الأكواد بلغة المرجع باستخدام الذكاء الاصطناعي
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiEngine } from '@/lib/ai-engine';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

function ensureSandbox() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
}

async function executeAlmarjaa(code: string): Promise<{ success: boolean; output: string; error?: string }> {
  ensureSandbox();
  
  const tempFile = path.join(SANDBOX_DIR, `_ai_exec_${Date.now()}.mrj`);
  
  try {
    fs.writeFileSync(tempFile, code, 'utf-8');
    
    const almarjaaPath = path.join(process.env.HOME || '/root', '.cargo', 'bin', 'almarjaa');
    
    try {
      const { stdout, stderr } = await execAsync(`"${almarjaaPath}" "${tempFile}"`, {
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      
      if (stderr && stderr.includes('خطأ')) {
        return { success: false, output: stderr, error: stderr };
      }
      
      return { success: true, output: stdout || stderr || 'تم التنفيذ بنجاح' };
    } catch (error: any) {
      const output = error.stderr || error.stdout || '';
      return { success: false, output, error: output || error.message };
    }
  } finally {
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

export async function POST(request: NextRequest) {
  ensureSandbox();
  
  try {
    const body = await request.json();
    const { action, prompt, code, error: codeError } = body;

    switch (action) {
      case 'generate': {
        if (!prompt) {
          return NextResponse.json({ 
            success: false, 
            error: 'الوصف مطلوب لتوليد الكود' 
          }, { status: 400 });
        }

        const result = await aiEngine.generateCode(prompt);
        
        if (result.success && result.code) {
          // التحقق من صحة الكود
          const validation = aiEngine.validateSyntax(result.code);
          
          // محاولة تنفيذ الكود
          const execution = await executeAlmarjaa(result.code);
          
          // حفظ الكود إذا نجح
          if (execution.success) {
            const fileName = `generated_${Date.now()}.mrj`;
            fs.writeFileSync(path.join(SANDBOX_DIR, fileName), result.code, 'utf-8');
          }
          
          return NextResponse.json({
            success: true,
            code: result.code,
            explanation: result.explanation,
            validation,
            execution: {
              success: execution.success,
              output: execution.output,
              error: execution.error
            }
          });
        }
        
        return NextResponse.json(result);
      }

      case 'fix': {
        if (!code || !codeError) {
          return NextResponse.json({ 
            success: false, 
            error: 'الكود والخطأ مطلوبان للإصلاح' 
          }, { status: 400 });
        }

        const result = await aiEngine.fixCode(code, codeError);
        
        if (result.success && result.fixedCode) {
          const execution = await executeAlmarjaa(result.fixedCode);
          
          return NextResponse.json({
            success: true,
            code: result.fixedCode,
            explanation: result.explanation,
            execution: {
              success: execution.success,
              output: execution.output,
              error: execution.error
            }
          });
        }
        
        return NextResponse.json(result);
      }

      case 'explain': {
        if (!code) {
          return NextResponse.json({ 
            success: false, 
            error: 'الكود مطلوب للشرح' 
          }, { status: 400 });
        }

        const explanation = await aiEngine.explainCode(code);
        
        return NextResponse.json({
          success: true,
          explanation
        });
      }

      case 'optimize': {
        if (!code) {
          return NextResponse.json({ 
            success: false, 
            error: 'الكود مطلوب للتحسين' 
          }, { status: 400 });
        }

        const result = await aiEngine.optimizeCode(code);
        
        if (result.success && result.code) {
          const execution = await executeAlmarjaa(result.code);
          
          return NextResponse.json({
            success: true,
            code: result.code,
            explanation: result.explanation,
            execution: {
              success: execution.success,
              output: execution.output
            }
          });
        }
        
        return NextResponse.json(result);
      }

      case 'addComments': {
        if (!code) {
          return NextResponse.json({ 
            success: false, 
            error: 'الكود مطلوب' 
          }, { status: 400 });
        }

        const result = await aiEngine.addComments(code);
        return NextResponse.json(result);
      }

      case 'generateTests': {
        if (!code) {
          return NextResponse.json({ 
            success: false, 
            error: 'الكود مطلوب لتوليد الاختبارات' 
          }, { status: 400 });
        }

        const result = await aiEngine.generateTests(code);
        
        if (result.success && result.code) {
          const execution = await executeAlmarjaa(result.code);
          
          return NextResponse.json({
            success: true,
            code: result.code,
            explanation: result.explanation,
            execution: {
              success: execution.success,
              output: execution.output
            }
          });
        }
        
        return NextResponse.json(result);
      }

      case 'validate': {
        if (!code) {
          return NextResponse.json({ 
            success: false, 
            error: 'الكود مطلوب للتحقق' 
          }, { status: 400 });
        }

        const validation = aiEngine.validateSyntax(code);
        
        return NextResponse.json({
          success: true,
          validation
        });
      }

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'إجراء غير معروف' 
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI Generate API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'حدث خطأ في المعالجة' 
    }, { status: 500 });
  }
}

// GET - Check AI engine status
export async function GET() {
  try {
    await aiEngine.initialize();
    
    return NextResponse.json({
      success: true,
      status: 'ready',
      message: 'محرك الذكاء الاصطناعي جاهز'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
}

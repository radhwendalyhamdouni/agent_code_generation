/**
 * Agentic Task API - Real Implementation
 * Creates files, executes with Al-Marjaa, fixes errors automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

// Multi-provider configuration
const PROVIDERS = [
  { name: 'zai', type: 'free', priority: 1 },
];

// Ensure sandbox exists
function ensureSandbox() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
}

// Execute Al-Marjaa code
async function executeAlmarjaa(code: string): Promise<{ success: boolean; output: string; error?: string }> {
  ensureSandbox();
  
  const tempFile = path.join(SANDBOX_DIR, `_exec_${Date.now()}.mrj`);
  
  try {
    fs.writeFileSync(tempFile, code, 'utf-8');
    
    // Try with almarjaa command
    try {
      const { stdout, stderr } = await execAsync(`almarjaa "${tempFile}"`, {
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      
      return { success: true, output: stdout || stderr };
    } catch (error: any) {
      // Try with full path
      const almarjaaPath = path.join(process.env.HOME || '/root', '.cargo', 'bin', 'almarjaa');
      
      try {
        const { stdout, stderr } = await execAsync(`"${almarjaaPath}" "${tempFile}"`, {
          timeout: 30000,
          maxBuffer: 1024 * 1024
        });
        
        return { success: true, output: stdout || stderr };
      } catch (fallbackError: any) {
        return { 
          success: false, 
          output: fallbackError.stderr || fallbackError.stdout || '',
          error: fallbackError.message 
        };
      }
    }
  } finally {
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

// Generate code using AI
async function generateCode(description: string): Promise<{ files: Array<{ path: string; content: string; language: string }> }> {
  try {
    const zai = await ZAI.create();
    
    const systemPrompt = `أنت خبير في لغة المرجع البرمجية العربية. مهمتك إنشاء ملفات مشروع كاملة.

قواعد لغة المرجع:
- الكلمات المفتاحية: متغير، ثابت، دالة، صنف، إذا، وإلا، طالما، لكل، في، أرجع، اطبع
- الفاصلة المنقوطة (؛) ضرورية في نهاية كل سطر
- التعليقات تبدأ بـ //
- الدوال: دالة اسم(معاملات) { ... }
- المتغيرات: متغير اسم = قيمة؛
- الشرط: إذا شرط { ... } وإلا { ... }
- الحلقات: لكل عنصر في قائمة { ... }

أرجع JSON فقط بالتنسيق:
{
  "files": [
    {
      "path": "main.mrj",
      "content": "الكود الكامل هنا",
      "language": "almarjaa"
    }
  ]
}`;

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `أنشئ: ${description}` }
      ],
      temperature: 0.3,
      max_tokens: 4096
    });

    const content = response.choices?.[0]?.message?.content || '';
    
    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {}
    }

    // Fallback
    return {
      files: [{
        path: 'main.mrj',
        content: `// المشروع\nاطبع("مرحباً بالعالم!")؛`,
        language: 'almarjaa'
      }]
    };
  } catch (error) {
    console.error('Generate error:', error);
    return {
      files: [{
        path: 'main.mrj',
        content: `// مشروع جديد\nاطبع("مرحباً!")؛`,
        language: 'almarjaa'
      }]
    };
  }
}

// Fix errors using AI
async function fixErrors(code: string, error: string): Promise<string> {
  try {
    const zai = await ZAI.create();
    
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `أنت خبير في تصحيح أخطار لغة المرجع. أصلح الكود وأرجع الكود المصحح فقط.

قواعد:
- الفاصلة المنقوطة (؛) ضرورية
- الأقواس { } للكتل، ( ) للدوال
- الكلمات: متغير، ثابت، دالة، إذا، طالما، لكل، اطبع`
        },
        {
          role: 'user',
          content: `الكود:
\`\`\`
${code}
\`\`\`

الخطأ:
${error}

أرجع الكود المصحح فقط.`
        }
      ],
      temperature: 0.2,
      max_tokens: 2048
    });

    const content = response.choices?.[0]?.message?.content || '';
    
    // Extract code
    const codeMatch = content.match(/```[\s\S]*?\n([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    return code;
  } catch {
    return code;
  }
}

// POST handler
export async function POST(request: NextRequest) {
  ensureSandbox();
  
  const body = await request.json();
  const { description, maxIterations = 5, stream = false } = body;

  if (!description) {
    return NextResponse.json({ success: false, error: 'الوصف مطلوب' }, { status: 400 });
  }

  // Streaming response
  if (stream) {
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
          } catch {}
        };

        try {
          // Step 1: Think
          send({
            type: 'step',
            step: {
              id: `step_${Date.now()}`,
              type: 'think',
              title: '🧠 تحليل المطلوب',
              content: `تحليل: ${description}`,
              timestamp: new Date().toISOString()
            }
          });

          // Step 2: Generate code
          send({
            type: 'step',
            step: {
              id: `step_${Date.now() + 1}`,
              type: 'think',
              title: '✨ توليد الكود',
              content: 'جاري إنشاء الكود...',
              timestamp: new Date().toISOString()
            }
          });

          const project = await generateCode(description);

          // Step 3: Create files
          for (const file of project.files) {
            const filePath = path.join(SANDBOX_DIR, file.path);
            const dir = path.dirname(filePath);
            
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, file.content, 'utf-8');
            
            send({
              type: 'step',
              step: {
                id: `step_${Date.now()}`,
                type: 'create',
                title: '📄 إنشاء ملف',
                content: `تم إنشاء ${file.path}`,
                code: file.content,
                filePath: file.path,
                timestamp: new Date().toISOString()
              }
            });
          }

          // Step 4: Execute and fix loop
          let iteration = 0;
          let success = false;
          let currentCode = project.files[0]?.content || '';
          let lastOutput = '';
          let lastError = '';

          while (iteration < maxIterations && !success) {
            iteration++;
            
            send({
              type: 'step',
              step: {
                id: `step_${Date.now()}`,
                type: 'execute',
                title: `⚡ تنفيذ المحاولة ${iteration}/${maxIterations}`,
                content: 'جاري التنفيذ...',
                timestamp: new Date().toISOString()
              }
            });

            const result = await executeAlmarjaa(currentCode);
            lastOutput = result.output;

            if (result.success) {
              success = true;
              send({
                type: 'step',
                step: {
                  id: `step_${Date.now()}`,
                  type: 'success',
                  title: '✅ نجح التنفيذ!',
                  content: result.output,
                  output: result.output,
                  timestamp: new Date().toISOString()
                }
              });
            } else {
              lastError = result.error || 'خطأ غير معروف';
              
              send({
                type: 'step',
                step: {
                  id: `step_${Date.now()}`,
                  type: 'error',
                  title: `❌ خطأ في المحاولة ${iteration}`,
                  content: result.error || 'خطأ',
                  error: result.error,
                  output: result.output,
                  timestamp: new Date().toISOString()
                }
              });

              if (iteration < maxIterations) {
                send({
                  type: 'step',
                  step: {
                    id: `step_${Date.now()}`,
                    type: 'fix',
                    title: '🔧 إصلاح الخطأ',
                    content: 'جاري الإصلاح...',
                    timestamp: new Date().toISOString()
                  }
                });

                const fixedCode = await fixErrors(currentCode, lastError);
                
                if (fixedCode !== currentCode) {
                  currentCode = fixedCode;
                  
                  // Update file
                  const mainFile = project.files[0];
                  if (mainFile) {
                    mainFile.content = currentCode;
                    const filePath = path.join(SANDBOX_DIR, mainFile.path);
                    fs.writeFileSync(filePath, currentCode, 'utf-8');
                    
                    send({
                      type: 'step',
                      step: {
                        id: `step_${Date.now()}`,
                        type: 'create',
                        title: '📝 تحديث الملف',
                        content: 'تم تحديث الكود',
                        code: currentCode,
                        filePath: mainFile.path,
                        timestamp: new Date().toISOString()
                      }
                    });
                  }
                }
              }
            }
          }

          // Final result
          send({
            type: 'complete',
            result: {
              success,
              iterations: iteration,
              files: project.files,
              output: lastOutput
            }
          });

        } catch (error: any) {
          send({
            type: 'error',
            error: error.message
          });
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  }

  // Non-streaming response
  try {
    const project = await generateCode(description);
    
    for (const file of project.files) {
      const filePath = path.join(SANDBOX_DIR, file.path);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    const result = await executeAlmarjaa(project.files[0]?.content || '');

    return NextResponse.json({
      success: result.success,
      files: project.files,
      output: result.output,
      error: result.error
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET - List files
export async function GET() {
  ensureSandbox();
  
  const files: Array<{ path: string; content: string; language: string }> = [];
  
  const scanDir = (dir: string, base: string = dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(base, fullPath);
      
      if (entry.isDirectory()) {
        scanDir(fullPath, base);
      } else {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const ext = path.extname(entry.name);
        const langMap: Record<string, string> = {
          '.mrj': 'almarjaa',
          '.js': 'javascript',
          '.ts': 'typescript',
          '.json': 'json',
          '.md': 'markdown'
        };
        
        files.push({
          path: relativePath,
          content,
          language: langMap[ext] || 'text'
        });
      }
    }
  };
  
  scanDir(SANDBOX_DIR);
  
  return NextResponse.json({ success: true, files });
}

// DELETE - Clear sandbox
export async function DELETE() {
  ensureSandbox();
  
  const entries = fs.readdirSync(SANDBOX_DIR);
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    
    const fullPath = path.join(SANDBOX_DIR, entry);
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    } catch {}
  }
  
  return NextResponse.json({ success: true, message: 'تم المسح' });
}

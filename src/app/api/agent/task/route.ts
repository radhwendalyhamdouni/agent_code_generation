/**
 * Agentic Task API - Real AI + Tested Programs
 * نظام هجين: برامج مختبرة + توليد AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { aiEngine } from '@/lib/ai-engine';

const execAsync = promisify(exec);
const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

function ensureSandbox() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
}

async function executeAlmarjaa(code: string): Promise<{ success: boolean; output: string; error?: string }> {
  ensureSandbox();
  
  const tempFile = path.join(SANDBOX_DIR, `_exec_${Date.now()}.mrj`);
  
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

// ═══════════════════════════════════════════════════════════════
// البرامج المختبرة 100% - مجربة ومضمونة
// ═══════════════════════════════════════════════════════════════
const TESTED_PROGRAMS: Record<string, { code: string; description: string; keywords: string[] }> = {
  
  // تطبيق المنبه الذكي الكامل
  alarm_app: {
    description: 'تطبيق منبه ذكي متكامل للهاتف',
    keywords: ['منبه', 'alarm', 'ساعة', 'استيقاظ', 'غفوة', 'هاتف', 'تطبيق', 'ذكي'],
    code: `// ═══════════════════════════════════════════════════════════════
//                    ⏰ تطبيق المنبه الذكي
//                   Alarm Application v2.0
// ═══════════════════════════════════════════════════════════════

متغير قائمة_المنبهات = []؛
متغير معرف_التالي = 1؛

// تنسيق الوقت
دالة تنسيق_الوقت(ساعة، دقيقة) {
    متغير س = ساعة؛
    متغير د = دقيقة؛
    إذا ساعة < 10 {
        س = "0" + ساعة؛
    }
    إذا دقيقة < 10 {
        د = "0" + دقيقة؛
    }
    أرجع س + ":" + د؛
}

// التحقق من صحة الوقت
دالة وقت_صحيح(ساعة، دقيقة) {
    إذا ساعة < 0 أو ساعة > 23 {
        أرجع false؛
    }
    إذا دقيقة < 0 أو دقيقة > 59 {
        أرجع false؛
    }
    أرجع true؛
}

// إضافة منبه جديد
دالة إضافة_منبه(ساعة، دقيقة، عنوان) {
    إذا !وقت_صحيح(ساعة، دقيقة) {
        اطبع("❌ خطأ: وقت غير صالح!")؛
        أرجع -1؛
    }
    
    متغير منبه_جديد = {}؛
    منبه_جديد["معرف"] = معرف_التالي؛
    منبه_جديد["ساعة"] = ساعة؛
    منبه_جديد["دقيقة"] = دقيقة؛
    منبه_جديد["عنوان"] = عنوان؛
    منبه_جديد["نشط"] = true؛
    منبه_جديد["غفوات"] = 0؛
    
    قائمة_المنبهات = قائمة_المنبهات + [منبه_جديد]؛
    معرف_التالي = معرف_التالي + 1؛
    
    اطبع("✅ تم إضافة المنبه: " + عنوان)؛
    اطبع("   الوقت: " + تنسيق_الوقت(ساعة، دقيقة))؛
    أرجع معرف_التالي - 1؛
}

// تفعيل/تعطيل منبه
دالة تبديل_منبه(المعرف) {
    لكل منبه في قائمة_المنبهات {
        إذا منبه["معرف"] == المعرف {
            منبه["نشط"] = !منبه["نشط"]؛
            إذا منبه["نشط"] {
                اطبع("🔔 تم تفعيل المنبه: " + منبه["عنوان"])؛
            } وإلا {
                اطبع("🔕 تم تعطيل المنبه: " + منبه["عنوان"])؛
            }
            أرجع true؛
        }
    }
    أرجع false؛
}

// غفوة - تأخير 5 دقائق
دالة غفوة(المعرف) {
    لكل منبه في قائمة_المنبهات {
        إذا منبه["معرف"] == المعرف {
            متغير دقائق_جديدة = منبه["دقيقة"] + 5؛
            متغير ساعات_إضافية = 0؛
            
            إذا دقائق_جديدة >= 60 {
                دقائق_جديدة = دقائق_جديدة - 60؛
                ساعات_إضافية = 1؛
            }
            
            منبه["دقيقة"] = دقائق_جديدة؛
            منبه["ساعة"] = منبه["ساعة"] + ساعات_إضافية؛
            
            إذا منبه["ساعة"] >= 24 {
                منبه["ساعة"] = منبه["ساعة"] - 24؛
            }
            
            منبه["غفوات"] = منبه["غفوات"] + 1؛
            
            اطبع("💤 غفوة 5 دقائق...")؛
            اطبع("   الوقت الجديد: " + تنسيق_الوقت(منبه["ساعة"]، منبه["دقيقة"]))؛
            أرجع true؛
        }
    }
    أرجع false؛
}

// عرض قائمة المنبهات
دالة عرض_المنبهات() {
    اطبع("")؛
    اطبع("╔════════════════════════════════════════════════╗")؛
    اطبع("║              ⏰ قائمة المنبهات                  ║")؛
    اطبع("╠════════════════════════════════════════════════╣")؛
    
    إذا طول(قائمة_المنبهات) == 0 {
        اطبع("║         لا توجد منبهات مضافة حالياً            ║")؛
    } وإلا {
        لكل منبه في قائمة_المنبهات {
            متغير رمز = "🔴"؛
            إذا منبه["نشط"] {
                رمز = "🟢"؛
            }
            
            اطبع("║ " + رمز + " #" + منبه["معرف"] + " | " + تنسيق_الوقت(منبه["ساعة"]، منبه["دقيقة"]) + " | " + منبه["عنوان"])؛
        }
    }
    
    اطبع("╚════════════════════════════════════════════════╝")؛
    اطبع("")؛
}

// عرض الواجهة الرئيسية
دالة عرض_الواجهة() {
    اطبع("")؛
    اطبع("╔══════════════════════════════════════════════════════════╗")؛
    اطبع("║                                                          ║")؛
    اطبع("║        ⏰  تـطـبـيـق الـمـنـبـه الـذهـي  ⏰              ║")؛
    اطبع("║                                                          ║")؛
    اطبع("║    [1] ➕ إضافة منبه جديد                               ║")؛
    اطبع("║    [2] 📋 عرض جميع المنبهات                             ║")؛
    اطبع("║    [3] 🔄 تفعيل/تعطيل منبه                              ║")؛
    اطبع("║    [4] 💤 غفوة (تأخير 5 دقائق)                          ║")؛
    اطبع("║    [0] 🚪 خروج                                          ║")؛
    اطبع("║                                                          ║")؛
    اطبع("╚══════════════════════════════════════════════════════════╝")؛
    اطبع("")؛
}

// تشغيل التطبيق
عرض_الواجهة()؛

اطبع("📝 إضافة منبهات تجريبية...")؛
اطبع("")؛

إضافة_منبه(6، 30، "الاستيقاظ للعمل")؛
إضافة_منبه(7، 0، "الرياضة الصباحية")؛
إضافة_منبه(5، 45، "صلاة الفجر")؛

عرض_المنبهات()؛

اطبع("🧪 اختبار ميزة الغفوة...")؛
غفوة(1)؛
اطبع("")؛

اطبع("🧪 اختبار التبديل...")؛
تبديل_منبه(2)؛
اطبع("")؛

عرض_المنبهات()؛

اطبع("✅ تم تشغيل التطبيق بنجاح!")؛`
  },
  
  // الحاسبة
  calculator: {
    description: 'حاسبة بسيطة',
    keywords: ['حاسب', 'جمع', 'طرح', 'ضرب', 'قسم', 'آلة حاسبة', 'calculator'],
    code: `// برنامج الحاسبة البسيطة
دالة جمع(أ، ب) {
    أرجع أ + ب؛
}

دالة طرح(أ، ب) {
    أرجع أ - ب؛
}

دالة ضرب(أ، ب) {
    أرجع أ * ب؛
}

دالة قسمة(أ، ب) {
    إذا ب == 0 {
        أرجع "خطأ: القسمة على صفر"؛
    }
    أرجع أ / ب؛
}

اطبع("═══════════════════════════")؛
اطبع("    الحاسبة البسيطة")؛
اطبع("═══════════════════════════")؛

متغير ن1 = 10؛
متغير ن2 = 5؛

اطبع("العدد الأول: " + ن1)؛
اطبع("العدد الثاني: " + ن2)؛
اطبع("")؛
اطبع("الجمع: " + جمع(ن1، ن2))؛
اطبع("الطرح: " + طرح(ن1، ن2))؛
اطبع("الضرب: " + ضرب(ن1، ن2))؛
اطبع("القسمة: " + قسمة(ن1، ن2))؛`
  },
  
  // جدول الضرب
  multiplication_table: {
    description: 'جدول الضرب',
    keywords: ['جدول', 'ضرب', 'multiplication', 'table'],
    code: `// برنامج جدول الضرب
اطبع("═══════════════════════════")؛
اطبع("    جدول الضرب")؛
اطبع("═══════════════════════════")؛

متغير جدول = 5؛
اطبع("جدول ضرب العدد " + جدول + ":")؛
اطبع("")؛

لكل رقم في [1، 2، 3، 4، 5، 6، 7، 8، 9، 10] {
    متغير نتيجة = جدول * رقم؛
    اطبع(جدول + " × " + رقم + " = " + نتيجة)؛
}`
  },
  
  // المضروب
  factorial: {
    description: 'حساب المضروب',
    keywords: ['مضروب', 'factorial', 'فاكتوريال'],
    code: `// برنامج حساب المضروب
دالة مضروب(ن) {
    إذا ن <= 1 {
        أرجع 1؛
    }
    أرجع ن * مضروب(ن - 1)؛
}

اطبع("═══════════════════════════")؛
اطبع("    حساب المضروب")؛
اطبع("═══════════════════════════")؛
اطبع("")؛

متغير رقم = 5؛
متغير نتيجة = مضروب(رقم)؛
اطبع("مضروب " + رقم + " = " + نتيجة)؛`
  },
  
  // فيبوناتشي
  fibonacci: {
    description: 'متتالية فيبوناتشي',
    keywords: ['فيبوناتشي', 'fibonacci'],
    code: `// برنامج متتالية فيبوناتشي
دالة فيبوناتشي(ن) {
    إذا ن <= 1 {
        أرجع ن؛
    }
    أرجع فيبوناتشي(ن - 1) + فيبوناتشي(ن - 2)؛
}

اطبع("═══════════════════════════")؛
اطبع("    متتالية فيبوناتشي")؛
اطبع("═══════════════════════════")؛
اطبع("")؛

اطبع("أول 10 أعداد في المتتالية:")؛
لكل رقم في [0، 1، 2، 3، 4، 5، 6، 7، 8، 9] {
    متغير قيمة = فيبوناتشي(رقم)؛
    اطبع("F(" + رقم + ") = " + قيمة)؛
}`
  },
  
  // مقارنة رقمين
  comparison: {
    description: 'مقارنة رقمين',
    keywords: ['مقارن', 'أكبر', 'أصغر', 'compare'],
    code: `// برنامج مقارنة رقمين
اطبع("═══════════════════════════")؛
اطبع("    مقارنة رقمين")؛
اطبع("═══════════════════════════")؛

متغير أ = 15؛
متغير ب = 8؛

اطبع("العدد أ = " + أ)؛
اطبع("العدد ب = " + ب)؛
اطبع("")؛

إذا أ > ب {
    اطبع("أ أكبر من ب")؛
} وإلا إذا أ < ب {
    اطبع("ب أكبر من أ")؛
} وإلا {
    اطبع("أ يساوي ب")؛
}`
  },

  // برنامج الترحيب
  greeting: {
    description: 'برنامج ترحيب',
    keywords: ['ترحيب', 'مرحب', 'سلام', 'greeting', 'hello'],
    code: `// برنامج الترحيب
دالة ترحيب(اسم) {
    اطبع("مرحباً " + اسم + "!")؛
    اطبع("أهلاً بك في برنامج المرجع")؛
}

اطبع("═══════════════════════════")؛
ترحيب("المستخدم")؛
اطبع("═══════════════════════════")؛`
  },

  // جمع الأرقام
  sum_numbers: {
    description: 'جمع مجموعة أرقام',
    keywords: ['مجموع', 'جمع', 'sum', 'total'],
    code: `// برنامج جمع الأرقام
اطبع("═══════════════════════════")؛
اطبع("    جمع الأرقام")؛
اطبع("═══════════════════════════")؛

متغير مجموع = 0؛
لكل رقم في [10، 20، 30، 40، 50] {
    مجموع = مجموع + رقم؛
    اطبع("أضيف " + رقم + " -> المجموع = " + مجموع)؛
}

اطبع("")؛
اطبع("المجموع النهائي = " + مجموع)؛`
  },

  // الأرقام الزوجية والفردية
  even_odd: {
    description: 'تحديد الأرقام الزوجية والفردية',
    keywords: ['زوجي', 'فردي', 'زوج', 'even', 'odd'],
    code: `// برنامج الأرقام الزوجية والفردية
دالة زوجي_أو_فردي(رقم) {
    متغير الباقي = رقم % 2؛
    إذا الباقي == 0 {
        أرجع "زوجي"؛
    }
    أرجع "فردي"؛
}

اطبع("═══════════════════════════")؛
اطبع("    زوجي أم فردي؟")؛
اطبع("═══════════════════════════")؛
اطبع("")؛

لكل ن في [1، 2، 3، 4، 5، 6، 7، 8، 9، 10] {
    متغير نتيجة = زوجي_أو_فردي(ن)؛
    اطبع(ن + " -> " + نتيجة)؛
}`
  }
};

// البحث عن برنامج مناسب
function findMatchingProgram(description: string): { key: string; program: typeof TESTED_PROGRAMS[string] } | null {
  const lower = description.toLowerCase();
  
  for (const [key, program] of Object.entries(TESTED_PROGRAMS)) {
    for (const keyword of program.keywords) {
      if (lower.includes(keyword)) {
        return { key, program };
      }
    }
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// نظام الإصلاح التلقائي - يصحح الكود الفاشل تلقائياً
// ═══════════════════════════════════════════════════════════════
async function generateAndTestCode(
  description: string,
  maxIterations: number,
  onStep: (step: any) => void
): Promise<{ success: boolean; code: string; output: string; iterations: number; error?: string }> {
  
  await aiEngine.initialize();
  
  let code = '';
  let iteration = 0;
  let lastError = '';
  
  // الخطوة 1: توليد الكود الأولي
  onStep({
    id: `step_${Date.now()}`,
    type: 'think',
    title: '🤖 توليد الكود',
    content: 'جاري توليد الكود بالذكاء الاصطناعي...',
    timestamp: new Date().toISOString()
  });
  
  const genResult = await aiEngine.generateCode(description);
  if (!genResult.success || !genResult.code) {
    return { success: false, code: '', output: '', iterations: 0, error: genResult.error || 'فشل توليد الكود' };
  }
  code = genResult.code;
  
  // حلقة الاختبار والإصلاح
  while (iteration < maxIterations) {
    iteration++;
    
    onStep({
      id: `step_${Date.now()}`,
      type: 'execute',
      title: `⚡ اختبار المحاولة ${iteration}/${maxIterations}`,
      content: 'جاري تنفيذ الكود في مترجم المرجع...',
      timestamp: new Date().toISOString()
    });
    
    const result = await executeAlmarjaa(code);
    
    if (result.success) {
      onStep({
        id: `step_${Date.now()}`,
        type: 'success',
        title: '✅ نجح التنفيذ!',
        content: `الكود يعمل بشكل صحيح بعد ${iteration} محاولة`,
        output: result.output,
        timestamp: new Date().toISOString()
      });
      
      return { success: true, code, output: result.output, iterations: iteration };
    }
    
    lastError = result.error || 'خطأ غير معروف';
    
    onStep({
      id: `step_${Date.now()}`,
      type: 'error',
      title: `❌ فشل المحاولة ${iteration}`,
      content: `خطأ: ${lastError.substring(0, 200)}...`,
      error: lastError,
      timestamp: new Date().toISOString()
    });
    
    // إذا لم نصل للحد الأقصى، حاول الإصلاح
    if (iteration < maxIterations) {
      onStep({
        id: `step_${Date.now()}`,
        type: 'think',
        title: '🔧 إصلاح الكود',
        content: 'جاري إصلاح الكود بالذكاء الاصطناعي...',
        timestamp: new Date().toISOString()
      });
      
      const fixResult = await aiEngine.fixCode(code, lastError);
      if (fixResult.success && fixResult.fixedCode) {
        code = fixResult.fixedCode;
        onStep({
          id: `step_${Date.now()}`,
          type: 'think',
          title: '📝 كود مصحح',
          content: 'تم توليد نسخة مصححة، جاري التجربة...',
          timestamp: new Date().toISOString()
        });
      } else {
        // إذا فشل الإصلاح، أعد التوليد من جديد
        onStep({
          id: `step_${Date.now()}`,
          type: 'think',
          title: '🔄 إعادة التوليد',
          content: 'فشل الإصلاح، جاري توليد كود جديد...',
          timestamp: new Date().toISOString()
        });
        const newGen = await aiEngine.generateCode(description + '\nملاحظة: الكود السابق فشل بهذا الخطأ: ' + lastError);
        if (newGen.success && newGen.code) {
          code = newGen.code;
        }
      }
    }
  }
  
  return { success: false, code, output: '', iterations: iteration, error: lastError };
}

// POST handler
export async function POST(request: NextRequest) {
  ensureSandbox();
  
  const body = await request.json();
  const { description, stream = false, maxIterations = 5 } = body;

  if (!description) {
    return NextResponse.json({ success: false, error: 'الوصف مطلوب' }, { status: 400 });
  }

  // البحث عن برنامج مختبر
  const match = findMatchingProgram(description);
  
  // Streaming response
  if (stream) {
    const encoder = new TextEncoder();
    
    const streamResponse = new ReadableStream({
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
              content: match 
                ? `تم العثور على برنامج مختبر: ${match.program.description}`
                : `استخدام الذكاء الاصطناعي لتوليد كود جديد مع اختبار تلقائي`,
              timestamp: new Date().toISOString()
            }
          });

          let code = '';
          let finalOutput = '';
          let iterations = 1;
          let success = false;
          
          if (match) {
            // استخدام برنامج مختبر مسبقاً
            code = match.program.code;
            
            // حتى البرامج المختبرة نختبرها مرة أخرى للتأكد
            send({
              type: 'step',
              step: {
                id: `step_${Date.now()}`,
                type: 'execute',
                title: '⚡ التحقق من البرنامج المختبر',
                content: 'جاري التحقق من عمل البرنامج...',
                timestamp: new Date().toISOString()
              }
            });
            
            const result = await executeAlmarjaa(code);
            success = result.success;
            finalOutput = result.output;
            
            if (success) {
              send({
                type: 'step',
                step: {
                  id: `step_${Date.now()}`,
                  type: 'success',
                  title: '✅ البرنامج المختبر يعمل!',
                  content: result.output,
                  output: result.output,
                  timestamp: new Date().toISOString()
                }
              });
            } else {
              send({
                type: 'step',
                step: {
                  id: `step_${Date.now()}`,
                  type: 'error',
                  title: '⚠️ البرنامج المختبر فشل!',
                  content: 'جاري توليد كود جديد...',
                  error: result.error,
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
          
          // إذا لم يكن هناك برنامج مختبر أو فشل، استخدم نظام الإصلاح التلقائي
          if (!match || !success) {
            const result = await generateAndTestCode(description, maxIterations, (step) => {
              send({ type: 'step', step });
            });
            
            code = result.code;
            success = result.success;
            finalOutput = result.output;
            iterations = result.iterations;
            
            if (!success) {
              send({
                type: 'step',
                step: {
                  id: `step_${Date.now()}`,
                  type: 'error',
                  title: '❌ فشل بعد كل المحاولات',
                  content: `فشل توليد كود صالح بعد ${iterations} محاولات`,
                  error: result.error,
                  timestamp: new Date().toISOString()
                }
              });
            }
          }

          // إنشاء الملف النهائي
          const filePath = 'main.mrj';
          const fullPath = path.join(SANDBOX_DIR, filePath);
          fs.writeFileSync(fullPath, code, 'utf-8');
          
          send({
            type: 'step',
            step: {
              id: `step_${Date.now()}`,
              type: 'create',
              title: '📄 حفظ الملف',
              content: `تم حفظ ${filePath} (${code.length} بايت)`,
              code: code,
              filePath: filePath,
              timestamp: new Date().toISOString()
            }
          });

          // Final result
          send({
            type: 'complete',
            result: {
              success,
              iterations,
              files: [{ path: filePath, content: code, language: 'almarjaa' }],
              output: finalOutput,
              tested: true,
              guaranteed: success
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

    return new NextResponse(streamResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  }

  // Non-streaming response
  try {
    let code = '';
    let success = false;
    let output = '';
    let iterations = 1;
    
    if (match) {
      code = match.program.code;
      const result = await executeAlmarjaa(code);
      success = result.success;
      output = result.output;
    }
    
    if (!match || !success) {
      const steps: any[] = [];
      const genResult = await generateAndTestCode(description, maxIterations, (step) => {
        steps.push(step);
      });
      code = genResult.code;
      success = genResult.success;
      output = genResult.output;
      iterations = genResult.iterations;
    }

    const filePath = path.join(SANDBOX_DIR, 'main.mrj');
    fs.writeFileSync(filePath, code, 'utf-8');

    return NextResponse.json({
      success,
      files: [{ path: 'main.mrj', content: code, language: 'almarjaa' }],
      output,
      iterations,
      tested: true,
      guaranteed: success
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
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name.startsWith('_exec')) continue;
        
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
    } catch {}
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

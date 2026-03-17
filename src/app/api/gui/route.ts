/**
 * GUI Preview API
 * واجهة برمجة لمعاينة تطبيقات لغة المرجع
 */

import { NextRequest, NextResponse } from 'next/server';
import { guiParser, guiRenderer, generateGUICSS, GUI_COMPONENTS } from '@/lib/gui-lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, code, title } = body;

    switch (action) {
      case 'preview': {
        if (!code) {
          return NextResponse.json({
            success: false,
            error: 'الكود مطلوب للمعاينة'
          }, { status: 400 });
        }

        // تحليل الكود
        const components = guiParser.parse(code);
        
        // تحويل إلى HTML
        const html = guiRenderer.render(components);
        
        // إنشاء صفحة كاملة
        const fullHtml = generatePreviewPage(html, title || 'معاينة التطبيق');
        
        return NextResponse.json({
          success: true,
          html: fullHtml,
          components: components.length,
          preview: `/api/gui?action=view&html=${encodeURIComponent(fullHtml)}`
        });
      }

      case 'components': {
        // إرجاع قائمة المكونات المتاحة
        return NextResponse.json({
          success: true,
          components: Object.entries(GUI_COMPONENTS).map(([key, value]) => ({
            key,
            arabicName: value.arabicName,
            type: value.type,
            properties: Object.keys(value.properties),
            events: value.events || []
          }))
        });
      }

      case 'template': {
        // إنشاء قالب تطبيق
        const template = generateTemplate(body.templateType || 'basic');
        return NextResponse.json({
          success: true,
          code: template
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'إجراء غير معروف'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('GUI Preview API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'حدث خطأ في المعالجة'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const html = searchParams.get('html');

  if (action === 'view' && html) {
    return new NextResponse(decodeURIComponent(html), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    });
  }

  // إرجاع المكونات
  return NextResponse.json({
    success: true,
    components: Object.entries(GUI_COMPONENTS).map(([key, value]) => ({
      key,
      arabicName: value.arabicName,
      type: value.type,
      properties: Object.keys(value.properties),
      events: value.events || []
    }))
  });
}

/**
 * توليد صفحة معاينة كاملة
 */
function generatePreviewPage(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Tajawal', sans-serif;
      background: #111827;
      color: #f3f4f6;
      min-height: 100vh;
      padding: 20px;
    }
    
    ${generateGUICSS()}
  </style>
</head>
<body>
  <div class="app-container">
    ${content}
  </div>
</body>
</html>`;
}

/**
 * توليد قالب تطبيق
 */
function generateTemplate(type: string): string {
  const templates: Record<string, string> = {
    basic: `// تطبيق أساسي
نافذة.جديد({
    عنوان: "تطبيقي الأول"،
    عرض: 400،
    ارتفاع: 300
})؛

نص.جديد({
    محتوى: "مرحباً بك في تطبيق المرجع!"،
    حجم: 20،
    لون: "#10b981"
})؛

زر.جديد({
    نص: "اضغط هنا"،
    خلفية: "#10b981"،
    عند_الضغط: دالة() {
        تنبيه.اعرض("تم الضغط على الزر!")؛
    }
})؛`,

    calculator: `// تطبيق الحاسبة
نافذة.جديد({
    عنوان: "الحاسبة"،
    عرض: 350،
    ارتفاع: 500
})؛

نص.جديد({
    محتوى: "الحاسبة البسيطة"،
    حجم: 24،
    ثخانة: "bold"
})؛

حاوية.جديد({
    اتجاه: "row"
}) {
    مدخل.جديد({
        نص: "العدد الأول"،
        معرف: "رقم1"
    })؛
    
    مدخل.جديد({
        نص: "العدد الثاني"،
        معرف: "رقم2"
    })؛
}

حاوية.جديد({
    اتجاه: "row"،
    محاذاة: "center"
}) {
    زر.جديد({ نص: "+"، عند_الضغط: دالة() { احسب("جمع")؛ } })؛
    زر.جديد({ نص: "-"، عند_الضغط: دالة() { احسب("طرح")؛ } })؛
    زر.جديد({ نص: "×"، عند_الضغط: دالة() { احسب("ضرب")؛ } })؛
    زر.جديد({ نص: "÷"، عند_الضغط: دالة() { احسب("قسمة")؛ } })؛
}

نص.جديد({
    معرف: "نتيجة"،
    محتوى: "النتيجة: "،
    حجم: 18
})؛`,

    todo: `// تطبيق قائمة المهام
نافذة.جديد({
    عنوان: "قائمة المهام"،
    عرض: 400،
    ارتفاع: 600
})؛

نص.جديد({
    محتوى: "📋 قائمة المهام"،
    حجم: 22،
    ثخانة: "bold"
})؛

حاوية.جديد({
    اتجاه: "row"
}) {
    مدخل.جديد({
        نص: "أضف مهمة جديدة..."،
        معرف: "مهمة_جديدة"،
        عرض: "70%"
    })؛
    
    زر.جديد({
        نص: "إضافة"،
        خلفية: "#10b981"،
        عند_الضغط: دالة() {
            أضف_مهمة(مهمة_جديدة.قيمة)؛
        }
    })؛
}

قائمة.جديد({
    معرف: "قائمة_المهام"،
    عناصر: []
})؛`,

    dashboard: `// لوحة تحكم
نافذة.جديد({
    عنوان: "لوحة التحكم"،
    عرض: 800،
    ارتفاع: 600
})؛

حاوية.جديد({
    اتجاه: "row"
}) {
    بطاقة.جديد({
        عنوان: "المستخدمين"،
        محتوى: "1,234"،
        ظل: "0 4px 12px rgba(0,0,0,0.1)"
    })؛
    
    بطاقة.جديد({
        عنوان: "المبيعات"،
        محتوى: "45,678 ر.س"،
        ظل: "0 4px 12px rgba(0,0,0,0.1)"
    })؛
    
    بطاقة.جديد({
        عنوان: "الطلبات"،
        محتوى: "567"،
        ظل: "0 4px 12px rgba(0,0,0,0.1)"
    })؛
}

تبويبات.جديد({
    تبويبات: ["نظرة عامة"، "التقارير"، "الإعدادات"]،
    نشط: 0
})؛

جدول.جديد({
    رؤوس: ["الاسم"، "الحالة"، "التاريخ"]،
    صفوف: [
        ["أحمد محمد"، "مكتمل"، "2024/01/15"]،
        ["سارة علي"، "قيد التنفيذ"، "2024/01/16"]،
        ["خالد عبدالله"، "جديد"، "2024/01/17"]
    ]
})؛`
  };

  return templates[type] || templates.basic;
}

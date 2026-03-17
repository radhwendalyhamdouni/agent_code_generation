/**
 * Projects API
 * Manages project creation and management
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

// Project templates
const PROJECT_TEMPLATES: Record<string, {
  name: string;
  description: string;
  files: Array<{ path: string; content: string }>;
}> = {
  console: {
    name: 'تطبيق طرفية',
    description: 'تطبيق سطر أوامر بسيط',
    files: [
      {
        path: 'main.mrj',
        content: `// المشروع الجديد - تطبيق طرفية
// © ${new Date().getFullYear()}

// الدالة الرئيسية
دالة رئيسي() {
    اطبع("═══════════════════════════════════")؛
    اطبع("  مرحباً بك!")؛
    اطبع("═══════════════════════════════════")؛
    اطبع("")؛
    
    // الكود الرئيسي هنا
    متغير الاسم = "المستخدم"؛
    اطبع("أهلاً " + الاسم + "!")؛
}

// تشغيل البرنامج
رئيسي()؛`
      },
      {
        path: 'config.mrj',
        content: `// ملف الإعدادات

ثابت الإعدادات = {
    الاسم: "مشروعي"،
    الإصدار: "1.0.0"،
    التصحيح: صح
}؛`
      },
      {
        path: 'README.md',
        content: `# مشروع جديد

تم إنشاؤه بواسطة وكيل المرجع الذكي

## التشغيل

\`\`\`bash
almarjaa main.mrj
\`\`\`
`
      }
    ]
  },
  web: {
    name: 'تطبيق ويب',
    description: 'تطبيق ويب مع واجهة مستخدم',
    files: [
      {
        path: 'main.mrj',
        content: `// تطبيق ويب
استيراد "http" كـ http؛

ثابت المنفذ = 8080؛

متغير الخادم = http.خادم(المنفذ)؛

الخادم.عند_الطلب(دالة(طلب، استجابة) {
    استجابة.أرسل("مرحباً بالعالم!")؛
})؛

الخادم.شغل()؛
اطبع("الخادم يعمل على المنفذ " + نص(المنفذ))؛`
      }
    ]
  },
  api: {
    name: 'خادم API',
    description: 'واجهة برمجة تطبيقات REST',
    files: [
      {
        path: 'server.mrj',
        content: `// خادم API
استيراد "http" كـ http؛
استيراد "json" كـ json؛

ثابت المنفذ = 3000؛
ثابت API_VERSION = "v1"؛

متغير الخادم = http.خادم(المنفذ)؛

// نقطة النهاية الرئيسية
الخادم.احصل("/api/" + API_VERSION + "/status"، دالة(طلب، استجابة) {
    استجابة.json({
        الحالة: "يعمل"،
        الإصدار: API_VERSION
    })؛
})؛

الخادم.شغل()؛
اطبع("API يعمل على المنفذ " + نص(المنفذ))؛`
      }
    ]
  },
  cli: {
    name: 'أداة سطر أوامر',
    description: 'أداة CLI',
    files: [
      {
        path: 'cli.mrj',
        content: `// أداة سطر أوامر
استيراد "args" كـ args؛

ثابت الاسم = "my-cli"؛
ثابت الإصدار = "1.0.0"؛

متغير المعاملات = args.حلل()؛

إذا المعاملات.مساعدة {
    اطبع(الاسم + " v" + الإصدار)؛
    اطبع("الاستخدام: " + الاسم + " [أمر]")؛
    أرجع؛
}

اطبع("مرحباً من " + الاسم + "!")؛`
      }
    ]
  },
  neural: {
    name: 'شبكة عصبية',
    description: 'شبكة عصبية للتعلم الآلي',
    files: [
      {
        path: 'model.mrj',
        content: `// شبكة عصبية
استيراد "ai" كـ ai؛

// إنشاء النموذج
متغير النموذج = ai.نموذج_عصبي()؛

// إضافة الطبقات
النموذج.أضف_طبقة(ai.كثيفة(128، "relu"))؛
النموذج.أضف_طبقة(ai.إسقاط(0.2))؛
النموذج.أضف_طبقة(ai.كثيفة(10، "softmax"))؛

// تجميع النموذج
النموذج.جمع(
    المحسن: "adam"،
    الخسارة: "categorical_crossentropy"
)؛

اطبع(النموذج.ملخص())؛`
      }
    ]
  }
};

// GET - List projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'templates') {
      return NextResponse.json({
        success: true,
        templates: Object.entries(PROJECT_TEMPLATES).map(([key, value]) => ({
          id: key,
          name: value.name,
          description: value.description
        }))
      });
    }

    // List existing projects
    const projects: Array<{
      name: string;
      path: string;
      created: Date;
    }> = [];

    if (fs.existsSync(SANDBOX_DIR)) {
      const entries = fs.readdirSync(SANDBOX_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const stat = fs.statSync(path.join(SANDBOX_DIR, entry.name));
          projects.push({
            name: entry.name,
            path: entry.name,
            created: stat.birthtime
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      projects
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type = 'console' } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'اسم المشروع مطلوب'
      }, { status: 400 });
    }

    const template = PROJECT_TEMPLATES[type] || PROJECT_TEMPLATES.console;
    const projectDir = path.join(SANDBOX_DIR, name);

    // Check if project exists
    if (fs.existsSync(projectDir)) {
      return NextResponse.json({
        success: false,
        error: 'المشروع موجود بالفعل'
      }, { status: 400 });
    }

    // Create project directory
    fs.mkdirSync(projectDir, { recursive: true });

    // Create files
    for (const file of template.files) {
      const filePath = path.join(projectDir, file.path);
      const fileDir = path.dirname(filePath);
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المشروع بنجاح',
      project: {
        name,
        type,
        path: name,
        files: template.files.map(f => f.path)
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'اسم المشروع مطلوب'
      }, { status: 400 });
    }

    const projectDir = path.join(SANDBOX_DIR, name);

    if (!fs.existsSync(projectDir)) {
      return NextResponse.json({
        success: false,
        error: 'المشروع غير موجود'
      }, { status: 404 });
    }

    fs.rmSync(projectDir, { recursive: true });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المشروع بنجاح'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

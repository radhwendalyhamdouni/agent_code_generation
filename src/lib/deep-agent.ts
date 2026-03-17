/**
 * Deep Agent System for Al-Marjaa Language
 * Professional AI Agent for Arabic Programming
 * 
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

import ZAI from 'z-ai-web-dev-sdk';

// Types
export interface AgentTask {
  id: string;
  type: 'generate' | 'execute' | 'refine' | 'explain' | 'debug' | 'create_project' | 'file_operation';
  description: string;
  context?: string;
  code?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  createdAt: Date;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  description?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
}

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

export interface ProjectPlan {
  name: string;
  description: string;
  files: ProjectFile[];
  dependencies?: string[];
  instructions?: string;
}

// Free AI Providers Configuration
export const AI_PROVIDERS = {
  zai: {
    name: 'Z-AI SDK',
    type: 'free',
    requiresKey: false,
    models: ['default'],
    limits: 'Unlimited'
  },
  openrouter: {
    name: 'OpenRouter',
    type: 'freemium',
    requiresKey: true,
    freeModels: [
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'mistralai/mistral-7b-instruct:free'
    ]
  },
  gemini: {
    name: 'Google Gemini',
    type: 'freemium',
    requiresKey: true,
    freeModels: ['gemini-2.0-flash', 'gemini-1.5-flash'],
    limits: '15 RPM, 1M tokens/day'
  },
  groq: {
    name: 'Groq',
    type: 'free',
    requiresKey: true,
    freeModels: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
    limits: 'Fast inference, generous free tier'
  }
};

// Project Templates
export const PROJECT_TEMPLATES = {
  console: {
    name: 'تطبيق طرفية',
    description: 'تطبيق سطر أوامر بسيط',
    structure: [
      { path: 'main.mrj', template: 'console_main' },
      { path: 'config.mrj', template: 'config' },
      { path: 'README.md', template: 'readme' }
    ]
  },
  web: {
    name: 'تطبيق ويب',
    description: 'تطبيق ويب مع واجهة مستخدم',
    structure: [
      { path: 'main.mrj', template: 'web_main' },
      { path: 'routes.mrj', template: 'routes' },
      { path: 'templates.mrj', template: 'templates' }
    ]
  },
  api: {
    name: 'خادم API',
    description: 'واجهة برمجة تطبيقات REST',
    structure: [
      { path: 'server.mrj', template: 'api_server' },
      { path: 'routes.mrj', template: 'api_routes' },
      { path: 'models.mrj', template: 'models' }
    ]
  },
  cli: {
    name: 'أداة سطر أوامر',
    description: 'أداة CLI قابلة للتثبيت',
    structure: [
      { path: 'cli.mrj', template: 'cli_main' },
      { path: 'commands.mrj', template: 'commands' },
      { path: 'args.mrj', template: 'args' }
    ]
  },
  neural: {
    name: 'شبكة عصبية',
    description: 'شبكة عصبية للتعلم الآلي',
    structure: [
      { path: 'model.mrj', template: 'neural_model' },
      { path: 'layers.mrj', template: 'layers' },
      { path: 'training.mrj', template: 'training' }
    ]
  },
  data: {
    name: 'معالجة بيانات',
    description: 'برنامج لمعالجة وتحليل البيانات',
    structure: [
      { path: 'main.mrj', template: 'data_main' },
      { path: 'parsers.mrj', template: 'parsers' },
      { path: 'utils.mrj', template: 'utils' }
    ]
  }
};

// Template Content
export const TEMPLATE_CONTENT: Record<string, string> = {
  console_main: `// {PROJECT_NAME} - {PROJECT_DESCRIPTION}
// © {YEAR} {AUTHOR}

// المكتبات المطلوبة
استيراد "config" كـ إعدادات؛

// الدالة الرئيسية
دالة رئيسي() {
    اطبع("═══════════════════════════════════")؛
    اطبع("  {PROJECT_NAME}")؛
    اطبع("  {PROJECT_DESCRIPTION}")؛
    اطبع("═══════════════════════════════════")؛
    اطبع("")؛
    
    // الكود الرئيسي هنا
    متغير المدخلات = قراءة("أدخل القيمة: ")؛
    اطبع("النتيجة: " + معالجة(المدخلات))؛
}

// دالة المعالجة
دالة معالجة(مدخل) {
    أرجع مدخل؛
}

// تشغيل البرنامج
رئيسي()؛`,

  web_main: `// {PROJECT_NAME} - تطبيق ويب
// © {YEAR} {AUTHOR}

استيراد "http" كـ http؛
استيراد "routes" كـ مسارات؛

// إعدادات الخادم
ثابت المنفذ = 8080؛
ثابت المضيف = "localhost"؛

// إنشاء الخادم
متغير الخادم = http.خادم(المنفذ)؛

// معالجة الطلبات
الخادم.عند_الطلب(دالة(طلب، استجابة) {
    مسارات.معالجة(طلب، استجابة)؛
})؛

// تشغيل الخادم
الخادم.شغل()؛
اطبع("الخادم يعمل على http://" + المضيف + ":" + المنفذ)؛`,

  api_server: `// {PROJECT_NAME} - خادم API
// © {YEAR} {AUTHOR}

استيراد "http" كـ http؛
استيراد "json" كـ json؛

// إعدادات API
ثابت API_VERSION = "v1"؛
ثابت المنفذ = 3000؛

// خادم API
متغير الخادم = http.خادم(المنفذ)؛

// نقاط النهاية
الخادم.احصل("/api/" + API_VERSION + "/status"، دالة(طلب، استجابة) {
    استجابة.json({
        الحالة: "يعمل"،
        الإصدار: API_VERSION،
        الوقت: الآن()
    })؛
})؛

الخادم.شغل()؛
اطبع("API يعمل على المنفذ " + المنفذ)؛`,

  cli_main: `// {PROJECT_NAME} - أداة سطر أوامر
// © {YEAR} {AUTHOR}

استيراد "args" كـ args؛
استيراد "commands" كـ أوامر؛

// معلومات الأداة
ثابت الاسم = "{PROJECT_NAME}"؛
ثابت الإصدار = "1.0.0"؛

// تحليل المعاملات
متغير المعاملات = args.حلل()؛

// عرض المساعدة
إذا المعاملات.مساعدة {
    اطبع("═══════════════════════════════════")؛
    اطبع("  " + الاسم + " v" + الإصدار)؛
    اطبع("═══════════════════════════════════")؛
    اطبع("الاستخدام: " + الاسم + " [أمر] [خيارات]")؛
    أرجع؛
}

// تنفيذ الأمر
متغير الأمر = المعاملات.الأمر || "help"؛
أوامر.نفذ(الأمر، المعاملات)؛`,

  neural_model: `// {PROJECT_NAME} - شبكة عصبية
// © {YEAR} {AUTHOR}

استيراد "ai" كـ ai؛
استيراد "layers" كـ طبقات؛

// إنشاء النموذج
متغير النموذج = ai.نموذج_عصبي()؛

// إضافة الطبقات
النموذج.أضف_طبقة(طبقات.كثيفة(128، "relu"))؛
النموذج.أضف_طبقة(طبقات.إسقاط(0.2))؛
النموذج.أضف_طبقة(طبقات.كثيفة(64، "relu"))؛
النموذج.أضف_طبقة(طبقات.كثيفة(10، "softmax"))؛

// تجميع النموذج
النموذج.جمع(
    المحسن: "adam"،
    الخسارة: "categorical_crossentropy"،
    المقاييس: ["الدقة"]
)؛

اطبع(النموذج.ملخص())؛`,

  config: `// ملف الإعدادات
// {PROJECT_NAME}

ثابت الإعدادات = {
    الاسم: "{PROJECT_NAME}"،
    الإصدار: "1.0.0"،
    التصحيح: صح،
    اللغة: "العربية"،
    الترميز: "UTF-8"
}؛`,

  readme: `# {PROJECT_NAME}

{PROJECT_DESCRIPTION}

## التثبيت

\`\`\`bash
almarjaa main.mrj
\`\`\`

## الاستخدام

\`\`\`bash
almarjaa main.mrj
\`\`\`

## الترخيص

© {YEAR} {AUTHOR} - جميع الحقوق محفوظة

---

تم الإنشاء بواسطة **وكيل المرجع الذكي**`
};

// Deep Agent Class
export class DeepAgent {
  private provider: string;
  private model: string;
  private apiKey?: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(provider: string = 'zai', model?: string, apiKey?: string) {
    this.provider = provider;
    this.model = model || 'default';
    this.apiKey = apiKey;
  }

  // Generate code from description
  async generateCode(description: string, context?: string): Promise<{ code: string; explanation: string }> {
    const systemPrompt = this.buildSystemPrompt();
    const prompt = context 
      ? `السياق: ${context}\n\nالمطلوب: ${description}`
      : `المطلوب: ${description}`;

    const response = await this.callAI(systemPrompt, prompt);
    
    // Extract code from response
    const codeMatch = response.match(/```almarjaa\n([\s\S]*?)```/);
    const code = codeMatch?.[1] || response;
    
    return { code, explanation: response };
  }

  // Chat with agent
  async chat(message: string): Promise<string> {
    this.conversationHistory.push({ role: 'user', content: message });
    
    const systemPrompt = this.buildSystemPrompt();
    const response = await this.callAI(systemPrompt, message, this.conversationHistory);
    
    this.conversationHistory.push({ role: 'assistant', content: response });
    return response;
  }

  // Debug code
  async debugCode(code: string, error: string): Promise<{ fixedCode: string; explanation: string }> {
    const systemPrompt = `أنت خبير في لغة المرجع البرمجية العربية. مهمتك تحليل الأخطاء وإصلاحها.

عند استلام كود ورسالة خطأ:
1. حلل الخطأ وحدد السبب
2. قدم الكود المصحح
3. اشرح سبب الخطأ وكيفية الإصلاح`;

    const prompt = `الكود:
\`\`\`almarjaa
${code}
\`\`\`

الخطأ:
${error}

أرجع الكود المصحح والشرح.`;

    const response = await this.callAI(systemPrompt, prompt);
    const codeMatch = response.match(/```almarjaa\n([\s\S]*?)```/);
    const fixedCode = codeMatch?.[1] || code;
    
    return { fixedCode, explanation: response };
  }

  // Create project
  async createProject(name: string, description: string, type: keyof typeof PROJECT_TEMPLATES = 'console'): Promise<ProjectPlan> {
    const template = PROJECT_TEMPLATES[type];
    const files: ProjectFile[] = [];

    for (const file of template.structure) {
      const content = this.generateFileContent(file.template, {
        PROJECT_NAME: name,
        PROJECT_DESCRIPTION: description,
        AUTHOR: 'رضوان دالي حمدوني',
        YEAR: new Date().getFullYear().toString()
      });
      
      files.push({
        path: file.path,
        content,
        language: file.path.endsWith('.mrj') ? 'almarjaa' : 'text',
        description: `ملف ${file.path}`
      });
    }

    return {
      name,
      description,
      files,
      instructions: `تم إنشاء مشروع "${name}" بنجاح! للبدء:
1. افتح المجلد: cd ${name}
2. شغل البرنامج: almarjaa main.mrj`
    };
  }

  private generateFileContent(templateName: string, variables: Record<string, string>): string {
    let content = TEMPLATE_CONTENT[templateName] || `// ${templateName}`;
    
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    
    return content;
  }

  // Clear conversation
  clearConversation(): void {
    this.conversationHistory = [];
  }

  // Build system prompt
  private buildSystemPrompt(): string {
    return `أنت وكيل ذكي متخصص في لغة المرجع البرمجية العربية.

## معلومات عن لغة المرجع:
- المطوِّر: رضوان دالي حمدوني
- الإصدار: 3.4.0
- أول لغة برمجة عربية متكاملة مع الذكاء الاصطناعي

## الكلمات المفتاحية الأساسية:
- متغير، ثابت، دالة، صنف، إذا، وإلا، طالما، لكل، في، أرجع، اطبع
- صحيح، خطأ، فارغ، جديد، هذا، محاولة، قبض

## الأدوات المتاحة:
- توليد كود من وصف
- تنفيذ كود المرجع
- تصحيح الأخطاء
- إنشاء مشاريع كاملة
- شرح الكود
- إدارة الملفات (إنشاء، حذف، تعديل)

## مهمتك:
1. فهم طلبات المستخدم بالعربية
2. كتابة كود لغة المرجع الصحيح
3. تقديم حلول شاملة ومفصلة
4. المساعدة في إدارة الملفات والمشاريع`;
  }

  // Call AI provider
  private async callAI(systemPrompt: string, prompt: string, history?: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const zai = await ZAI.create();

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(history || []),
        { role: 'user', content: prompt }
      ];

      const completion = await zai.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 4096
      });

      return completion.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('AI Error:', error);
      return 'حدث خطأ في الاتصال بنموذج AI';
    }
  }
}

// Export singleton factory
export function createDeepAgent(provider?: string, model?: string, apiKey?: string): DeepAgent {
  return new DeepAgent(provider, model, apiKey);
}

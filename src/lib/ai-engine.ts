/**
 * محرك الذكاء الاصطناعي للغة المرجع
 * AI Engine for Al-Marjaa Language
 * يستخدم z-ai-web-dev-sdk لتوليد الأكواد
 */

import ZAI from 'z-ai-web-dev-sdk';

export interface CodeGenerationResult {
  success: boolean;
  code?: string;
  explanation?: string;
  error?: string;
}

export interface CodeFixResult {
  success: boolean;
  fixedCode?: string;
  explanation?: string;
  error?: string;
}

// قواعد لغة المرجع
const ALMARJAA_RULES = `
أنت مبرمج خبير بلغة المرجع العربية. هذه قواعد اللغة:

## المتغيرات
- متغير اسم = قيمة؛
- متغير رقم = 42؛
- متغير نص = "مرحباً"؛
- متغير قائمة = [1، 2، 3]؛

## الدوال
- دالة اسم(معاملات) { أرجع قيمة؛ }
- دالة جمع(أ، ب) { أرجع أ + ب؛ }

## الشروط
- إذا شرط { }
- وإلا إذا شرط { }
- وإلا { }

## الحلقات
- لكل عنصر في [قائمة] { }

## الطباعة
- اطبع("نص")؛
- اطبع(متغير)؛
- اطبع("نص" + متغير)؛

## الإرجاع
- أرجع قيمة؛

## الدوال المدمجة
- طول(قائمة) - طول القائمة
- طول(نص) - طول النص
- جذر(رقم) - الجذر التربيعي
- أس(قاعدة، أس) - الأس
- مطلق(رقم) - القيمة المطلقة
- وقت() - الوقت الحالي

## العوامل
- حسابية: + - * / %
- مقارنة: == != > < >= <=
- منطقية: && || !

## ملاحظات مهمة
1. كل جملة تنتهي بـ "؛"
2. الفواصل في القوائم "،" (فاصلة عربية)
3. الأقواس { } للكتل
4. الأقواس [ ] للقوائم
5. الأقواس ( ) للدوال والشروط

## أمثلة

### مثال 1: حاسبة
دالة جمع(أ، ب) {
    أرجع أ + ب؛
}

دالة طرح(أ، ب) {
    أرجع أ - ب؛
}

اطبع("5 + 3 = " + جمع(5، 3))؛

### مثال 2: حلقة
لكل رقم في [1، 2، 3، 4، 5] {
    اطبع("الرقم: " + رقم)؛
}

### مثال 3: شرط
متغير عمر = 18؛
إذا عمر >= 18 {
    اطبع("بالغ")؛
} وإلا {
    اطبع("قاصر")؛
}
`;

export class AlmarjaaAIEngine {
  private zai: any = null;
  private initialized: boolean = false;

  /**
   * تهيئة المحرك
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      this.zai = await ZAI.create();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize AI engine:', error);
      return false;
    }
  }

  /**
   * توليد كود من وصف
   */
  async generateCode(prompt: string): Promise<CodeGenerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: ALMARJAA_RULES },
          { role: 'user', content: `اكتب كود بلغة المرجع لـ: ${prompt}\n\nأرجع الكود فقط بدون شرح.` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const code = completion.choices[0]?.message?.content || '';
      
      // تنظيف الكود
      const cleanedCode = this.cleanCode(code);
      
      return {
        success: true,
        code: cleanedCode,
        explanation: `تم توليد الكود بناءً على: ${prompt}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'فشل توليد الكود'
      };
    }
  }

  /**
   * إصلاح كود به خطأ
   */
  async fixCode(code: string, error: string): Promise<CodeFixResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: ALMARJAA_RULES },
          { role: 'user', content: `
الكود التالي به خطأ:

\`\`\`
${code}
\`\`\`

الخطأ:
${error}

أصلح الكود وأرجع النسخة المصححة فقط.
          ` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const fixedCode = completion.choices[0]?.message?.content || '';
      
      return {
        success: true,
        fixedCode: this.cleanCode(fixedCode),
        explanation: 'تم إصلاح الكود'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'فشل إصلاح الكود'
      };
    }
  }

  /**
   * شرح كود
   */
  async explainCode(code: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'أنت مدرس للبرمجة بلغة المرجع العربية. اشرح الأكواد ببساطة ووضوح.' },
          { role: 'user', content: `اشرح هذا الكود:\n\n${code}` }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      return 'فشل شرح الكود';
    }
  }

  /**
   * تحسين كود
   */
  async optimizeCode(code: string): Promise<CodeGenerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: ALMARJAA_RULES },
          { role: 'user', content: `
حسّن هذا الكود وأعد كتابته بشكل أفضل:

\`\`\`
${code}
\`\`\`

أرجع الكود المحسن فقط.
          ` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const optimizedCode = completion.choices[0]?.message?.content || '';
      
      return {
        success: true,
        code: this.cleanCode(optimizedCode),
        explanation: 'تم تحسين الكود'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'فشل تحسين الكود'
      };
    }
  }

  /**
   * إضافة تعليقات للكود
   */
  async addComments(code: string): Promise<CodeGenerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: ALMARJAA_RULES },
          { role: 'user', content: `
أضف تعليقات توضيحية لهذا الكود:

\`\`\`
${code}
\`\`\`

التعليقات في المرجع تبدأ بـ // مثل:
// هذا تعليق

أرجع الكود مع التعليقات فقط.
          ` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const commentedCode = completion.choices[0]?.message?.content || '';
      
      return {
        success: true,
        code: this.cleanCode(commentedCode),
        explanation: 'تم إضافة التعليقات'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'فشل إضافة التعليقات'
      };
    }
  }

  /**
   * توليد اختبارات للكود
   */
  async generateTests(code: string): Promise<CodeGenerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: ALMARJAA_RULES },
          { role: 'user', content: `
اكتب اختبارات لهذا الكود:

\`\`\`
${code}
\`\`\`

اكتب اختبارات تختبر جميع الدوال والسيناريوهات.
استخدم اطبع لإظهار نتائج الاختبارات.
أرجع كود الاختبارات فقط.
          ` }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const testCode = completion.choices[0]?.message?.content || '';
      
      return {
        success: true,
        code: this.cleanCode(testCode),
        explanation: 'تم توليد الاختبارات'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'فشل توليد الاختبارات'
      };
    }
  }

  /**
   * إصلاح كود به خطأ
   */
  async fixCode(code: string, error: string): Promise<{ success: boolean; fixedCode?: string; explanation?: string; error?: string }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: ALMARJAA_RULES },
          { role: 'user', content: `
الكود التالي به خطأ:

\`\`\`
${code}
\`\`\`

الخطأ:
${error}

أصلح الكود وأرجع النسخة المصححة فقط.
          ` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const fixedCode = completion.choices[0]?.message?.content || '';
      
      return {
        success: true,
        fixedCode: this.cleanCode(fixedCode),
        explanation: 'تم إصلاح الكود'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'فشل إصلاح الكود'
      };
    }
  }

  /**
   * شرح كود
   */
  async explainCode(code: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'أنت مدرس للبرمجة بلغة المرجع العربية. اشرح الأكواد ببساطة ووضوح.' },
          { role: 'user', content: `اشرح هذا الكود:\n\n${code}` }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      return 'فشل شرح الكود';
    }
  }

  /**
   * تحسين كود
   */
  async optimizeCode(code: string): Promise<CodeGenerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: ALMARJAA_RULES },
          { role: 'user', content: `
حسّن هذا الكود وأعد كتابته بشكل أفضل:

\`\`\`
${code}
\`\`\`

أرجع الكود المحسن فقط.
          ` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const optimizedCode = completion.choices[0]?.message?.content || '';
      
      return {
        success: true,
        code: this.cleanCode(optimizedCode),
        explanation: 'تم تحسين الكود'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'فشل تحسين الكود'
      };
    }
  }

  /**
   * إضافة تعليقات للكود
   */
  async addComments(code: string): Promise<CodeGenerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: ALMARJAA_RULES },
          { role: 'user', content: `
أضف تعليقات توضيحية لهذا الكود:

\`\`\`
${code}
\`\`\`

التعليقات في المرجع تبدأ بـ // مثل:
// هذا تعليق

أرجع الكود مع التعليقات فقط.
          ` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const commentedCode = completion.choices[0]?.message?.content || '';
      
      return {
        success: true,
        code: this.cleanCode(commentedCode),
        explanation: 'تم إضافة التعليقات'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'فشل إضافة التعليقات'
      };
    }
  }

  /**
   * التحقق من صحة بناء الكود
   */
  validateSyntax(code: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // التحقق من الأقواس المتوازنة
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`عدد الأقواس غير متوازن: { = ${openBraces}, } = ${closeBraces}`);
    }
    
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`عدد الأقواس الدائرية غير متوازن: ( = ${openParens}, ) = ${closeParens}`);
    }
    
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`عدد الأقواس المربعة غير متوازن: [ = ${openBrackets}, ] = ${closeBrackets}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * تنظيف الكود من التنسيق الزائد
   */
  private cleanCode(code: string): string {
    return code
      // إزالة علامات الكود
      .replace(/```almarjaa\n?/g, '')
      .replace(/```arabic\n?/g, '')
      .replace(/```\n?/g, '')
      // إزالة الأسطر الفارغة الزائدة
      .replace(/\n{3,}/g, '\n\n')
      // إزالة المسافات الزائدة
      .trim();
  }
}

// إنشاء مثيل واحد
export const aiEngine = new AlmarjaaAIEngine();

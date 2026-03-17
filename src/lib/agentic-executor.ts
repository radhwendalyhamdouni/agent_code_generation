/**
 * Agentic Executor System
 * نظام التنفيذ الذكي التكراري
 * 
 * يقوم بإنشاء الملفات وتنفيذها وإصلاح الأخطاء تلقائياً
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

import ZAI from 'z-ai-web-dev-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Types
export interface ExecutionStep {
  id: string;
  type: 'think' | 'create' | 'execute' | 'fix' | 'success' | 'error' | 'info';
  title: string;
  content: string;
  code?: string;
  filePath?: string;
  output?: string;
  error?: string;
  timestamp: Date;
  duration?: number;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

export interface AgenticResult {
  success: boolean;
  steps: ExecutionStep[];
  files: ProjectFile[];
  finalOutput?: string;
  iterations: number;
  totalDuration: number;
}

export interface TaskContext {
  projectName: string;
  projectPath: string;
  description: string;
  maxIterations: number;
}

// Main Agentic Executor Class
export class AgenticExecutor {
  private zai: any = null;
  private steps: ExecutionStep[] = [];
  private files: ProjectFile[] = [];
  private startTime: number = 0;
  private sandboxPath: string;
  private onStep?: (step: ExecutionStep) => void;

  constructor(sandboxPath: string = './sandbox') {
    this.sandboxPath = path.resolve(sandboxPath);
  }

  // Set callback for real-time updates
  setStepCallback(callback: (step: ExecutionStep) => void) {
    this.onStep = callback;
  }

  // Add a step and notify
  private addStep(step: Omit<ExecutionStep, 'id' | 'timestamp'>): ExecutionStep {
    const fullStep: ExecutionStep = {
      ...step,
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    this.steps.push(fullStep);
    if (this.onStep) {
      this.onStep(fullStep);
    }
    return fullStep;
  }

  // Initialize AI
  private async initAI() {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
    return this.zai;
  }

  // Main execution method
  async executeProject(description: string, maxIterations: number = 10): Promise<AgenticResult> {
    this.startTime = Date.now();
    this.steps = [];
    this.files = [];

    // Ensure sandbox exists
    if (!fs.existsSync(this.sandboxPath)) {
      fs.mkdirSync(this.sandboxPath, { recursive: true });
    }

    this.addStep({
      type: 'info',
      title: '🚀 بدء تنفيذ المشروع',
      content: `الوصف: ${description}\nالحد الأقصى للمحاولات: ${maxIterations}`
    });

    try {
      // Step 1: Generate project plan
      this.addStep({
        type: 'think',
        title: '🧠 تحليل المطلوب وتخطيط المشروع',
        content: 'جاري تحليل المتطلبات وإنشاء خطة المشروع...'
      });

      const plan = await this.generateProjectPlan(description);
      
      this.addStep({
        type: 'info',
        title: '📋 خطة المشروع',
        content: `المشروع: ${plan.name}\nالملفات المطلوبة: ${plan.files.map(f => f.path).join(', ')}`
      });

      // Step 2: Create files
      for (const file of plan.files) {
        await this.createFile(file.path, file.content);
      }

      // Step 3: Execute and fix loop
      let iteration = 0;
      let success = false;

      while (iteration < maxIterations && !success) {
        iteration++;
        
        this.addStep({
          type: 'execute',
          title: `⚡ تنفيذ المحاولة ${iteration}/${maxIterations}`,
          content: `جاري تنفيذ المشروع...`
        });

        const executionResult = await this.executeProjectFiles();

        if (executionResult.success) {
          success = true;
          this.addStep({
            type: 'success',
            title: '✅ تم تنفيذ المشروع بنجاح!',
            content: executionResult.output || 'تم التنفيذ بدون أخطاء',
            output: executionResult.output
          });
        } else {
          this.addStep({
            type: 'error',
            title: `❌ خطأ في المحاولة ${iteration}`,
            content: executionResult.error || 'حدث خطأ غير معروف',
            error: executionResult.error
          });

          if (iteration < maxIterations) {
            // Try to fix
            this.addStep({
              type: 'fix',
              title: '🔧 محاولة الإصلاح',
              content: 'جاري تحليل الخطأ وإصلاحه...'
            });

            const fixResult = await this.fixErrors(executionResult.error || '', executionResult.output || '');
            
            if (fixResult.files) {
              for (const file of fixResult.files) {
                await this.updateFile(file.path, file.content);
              }
            }
          }
        }
      }

      const totalDuration = Date.now() - this.startTime;

      if (!success) {
        this.addStep({
          type: 'error',
          title: '⚠️ لم يتم إكمال المشروع',
          content: `تم الوصول للحد الأقصى من المحاولات (${maxIterations})\nآخر خطأ: ${this.steps[this.steps.length - 1]?.error || 'غير معروف'}`
        });
      }

      return {
        success,
        steps: this.steps,
        files: this.files,
        iterations: iteration,
        totalDuration
      };

    } catch (error: any) {
      this.addStep({
        type: 'error',
        title: '❌ خطأ في التنفيذ',
        content: error.message,
        error: error.message
      });

      return {
        success: false,
        steps: this.steps,
        files: this.files,
        iterations: 0,
        totalDuration: Date.now() - this.startTime
      };
    }
  }

  // Generate project plan using AI
  private async generateProjectPlan(description: string): Promise<{ name: string; files: ProjectFile[] }> {
    const zai = await this.initAI();

    const systemPrompt = `أنت خبير في لغة المرجع البرمجية العربية. مهمتك إنشاء مشروع كامل.

قواعد لغة المرجع:
- الكلمات المفتاحية: متغير، ثابت، دالة، صنف، إذا، وإلا، طالما، لكل، في، أرجع، اطبع
- الفاصلة المنقوطة (؛) ضرورية في نهاية كل سطر
- التعليقات تبدأ بـ //
- الدوال: دالة اسم(معاملات) { ... }
- المتغيرات: متغير اسم = قيمة؛
- الشرط: إذا شرط { ... } وإلا { ... }
- الحلقات: لكل عنصر في قائمة { ... } أو طالما شرط { ... }

أرجع JSON بالتنسيق التالي فقط:
{
  "name": "اسم_المشروع",
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
        { role: 'user', content: `أنشئ مشروع: ${description}` }
      ],
      temperature: 0.3,
      max_tokens: 4096
    });

    const content = response.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fallback
      }
    }

    // Fallback: create simple project
    return {
      name: 'project',
      files: [{
        path: 'main.mrj',
        content: `// المشروع الرئيسي\nاطبع("مرحباً بالعالم!")؛`,
        language: 'almarjaa'
      }]
    };
  }

  // Create a file
  private async createFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.sandboxPath, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf-8');
    
    this.files.push({ path: filePath, content, language: this.detectLanguage(filePath) });
    
    this.addStep({
      type: 'create',
      title: `📄 إنشاء ملف: ${filePath}`,
      content: `تم إنشاء الملف (${content.length} بايت)`,
      code: content.substring(0, 500) + (content.length > 500 ? '\n...' : ''),
      filePath
    });
  }

  // Update a file
  private async updateFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.sandboxPath, filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content, 'utf-8');
      
      const existingIndex = this.files.findIndex(f => f.path === filePath);
      if (existingIndex >= 0) {
        this.files[existingIndex].content = content;
      }
      
      this.addStep({
        type: 'fix',
        title: `📝 تحديث ملف: ${filePath}`,
        content: 'تم تحديث الملف',
        code: content.substring(0, 500) + (content.length > 500 ? '\n...' : ''),
        filePath
      });
    }
  }

  // Execute project files
  private async executeProjectFiles(): Promise<{ success: boolean; output?: string; error?: string }> {
    const mainFile = this.files.find(f => f.path === 'main.mrj' || f.path.endsWith('.mrj'));
    
    if (!mainFile) {
      return { success: false, error: 'لا يوجد ملف .mrj للتنفيذ' };
    }

    const fullPath = path.join(this.sandboxPath, mainFile.path);

    try {
      // Try to run with almarjaa
      const { stdout, stderr } = await execAsync(`almarjaa "${fullPath}"`, {
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });

      if (stderr && !stdout) {
        return { success: false, output: stderr, error: stderr };
      }

      return { success: true, output: stdout };
    } catch (error: any) {
      // Try fallback path
      try {
        const almarjaaPath = path.join(process.env.HOME || '/root', '.cargo', 'bin', 'almarjaa');
        const { stdout, stderr } = await execAsync(`"${almarjaaPath}" "${fullPath}"`, {
          timeout: 30000,
          maxBuffer: 1024 * 1024
        });
        
        if (stderr && !stdout) {
          return { success: false, output: stderr, error: stderr };
        }
        return { success: true, output: stdout };
      } catch (fallbackError: any) {
        return { 
          success: false, 
          output: fallbackError.message,
          error: fallbackError.message 
        };
      }
    }
  }

  // Fix errors using AI
  private async fixErrors(error: string, output: string): Promise<{ files?: ProjectFile[] }> {
    const zai = await this.initAI();

    const systemPrompt = `أنت خبير في تصحيح أخطاء لغة المرجع البرمجية العربية.

قواعد لغة المرجع:
- الكلمات المفتاحية: متغير، ثابت، دالة، صنف، إذا، وإلا، طالما، لكل، في، أرجع، اطبع
- الفاصلة المنقوطة (؛) ضرورية في نهاية كل سطر
- التعليقات تبدأ بـ //
- الأقواس: { } للكتل، ( ) للدوال

أرجع JSON بالملفات المصححة فقط:
{
  "files": [
    {
      "path": "main.mrj",
      "content": "الكود المصحح الكامل",
      "language": "almarjaa"
    }
  ]
}`;

    const currentCode = this.files.map(f => `// ${f.path}\n${f.content}`).join('\n\n');

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `الكود الحالي:
\`\`\`
${currentCode}
\`\`\`

الخطأ:
${error}

المخرجات:
${output}

أصلح الكود وأرجع الملفات المصححة.` }
      ],
      temperature: 0.2,
      max_tokens: 4096
    });

    const content = response.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return {};
      }
    }

    return {};
  }

  // Detect language from file extension
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath);
    const langMap: Record<string, string> = {
      '.mrj': 'almarjaa',
      '.rs': 'rust',
      '.ts': 'typescript',
      '.js': 'javascript',
      '.json': 'json',
      '.md': 'markdown'
    };
    return langMap[ext] || 'text';
  }

  // Get all files for download
  getProjectFiles(): ProjectFile[] {
    return this.files;
  }
}

// Export factory
export function createAgenticExecutor(sandboxPath?: string): AgenticExecutor {
  return new AgenticExecutor(sandboxPath);
}

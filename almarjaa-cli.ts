#!/usr/bin/env bun

/**
 * وكيل المرجع الذكي - أداة سطر الأوامر
 * Al-Marjaa AI Agent - CLI Tool
 * 
 * © 2026 رضوان دالي حمدوني
 */

import { createDeepAgent, PROJECT_TEMPLATES } from './src/lib/deep-agent';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const command = args[0] || 'help';

const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Help command
function showHelp() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════╗
║     وكيل المرجع الذكي - CLI                                ║
║     Al-Marjaa AI Agent - Command Line Interface            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}

${colors.green}الأوامر المتاحة:${colors.reset}

  ${colors.yellow}chat "رسالة"${colors.reset}        محادثة مع الوكيل
  ${colors.yellow}generate "وصف"${colors.reset}     توليد كود من وصف
  ${colors.yellow}run <ملف>${colors.reset}          تنفيذ ملف لغة المرجع
  ${colors.yellow}new <اسم> [نوع]${colors.reset}    إنشاء مشروع جديد
  ${colors.yellow}list${colors.reset}               عرض المشاريع
  ${colors.yellow}files [مسار]${colors.reset}       عرض الملفات
  ${colors.yellow}read <ملف>${colors.reset}         قراءة محتوى ملف
  ${colors.yellow}help${colors.reset}               عرض هذه المساعدة

${colors.green}أنواع المشاريع:${colors.reset}
  console   - تطبيق طرفية (افتراضي)
  web       - تطبيق ويب
  api       - خادم API
  cli       - أداة سطر أوامر
  neural    - شبكة عصبية

${colors.green}أمثلة:${colors.reset}
  almarjaa chat "اكتب برنامج يحسب المضروب"
  almarjaa new مشروعي console
  almarjaa run main.mrj
  almarjaa generate "برنامج يرتب قائمة"
`);
}

// Chat command
async function chat(message: string) {
  if (!message) {
    log('❌ الرسالة مطلوبة', 'red');
    return;
  }

  log('🤖 وكيل المرجع الذكي', 'cyan');
  log('─'.repeat(50), 'blue');
  
  const agent = createDeepAgent();
  const response = await agent.chat(message);
  
  console.log('\n' + response);
  log('\n' + '─'.repeat(50), 'blue');
}

// Generate command
async function generate(description: string) {
  if (!description) {
    log('❌ الوصف مطلوب', 'red');
    return;
  }

  log('🔧 جاري توليد الكود...', 'yellow');
  
  const agent = createDeepAgent();
  const result = await agent.generateCode(description);
  
  log('\n✨ الكود المولّد:', 'green');
  log('─'.repeat(50), 'blue');
  console.log(result.code);
  log('─'.repeat(50), 'blue');
}

// Create new project
function createProject(name: string, type: string = 'console') {
  if (!name) {
    log('❌ اسم المشروع مطلوب', 'red');
    return;
  }

  const projectDir = path.join(SANDBOX_DIR, name);
  
  if (fs.existsSync(projectDir)) {
    log(`❌ المشروع "${name}" موجود بالفعل`, 'red');
    return;
  }

  const template = PROJECT_TEMPLATES[type as keyof typeof PROJECT_TEMPLATES];
  if (!template) {
    log(`❌ نوع المشروع "${type}" غير معروف`, 'red');
    return;
  }

  fs.mkdirSync(projectDir, { recursive: true });

  for (const file of template.structure) {
    const filePath = path.join(projectDir, file.path);
    const fileDir = path.dirname(filePath);
    fs.mkdirSync(fileDir, { recursive: true });
    
    // Generate content from template
    let content = TEMPLATE_CONTENT[file.template] || `// ${file.path}`;
    content = content.replace(/{PROJECT_NAME}/g, name);
    content = content.replace(/{YEAR}/g, new Date().getFullYear().toString());
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  log(`✅ تم إنشاء مشروع "${name}" بنجاح!`, 'green');
  log(`📁 المسار: ${projectDir}`, 'cyan');
  log(`🚀 للتشغيل: cd sandbox/${name} && almarjaa main.mrj`, 'yellow');
}

// List projects
function listProjects() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(SANDBOX_DIR, { withFileTypes: true });
  const projects = entries.filter(e => e.isDirectory());

  if (projects.length === 0) {
    log('📁 لا توجد مشاريع حالياً', 'yellow');
    log('💡 استخدم "almarjaa new <اسم>" لإنشاء مشروع جديد', 'cyan');
    return;
  }

  log('\n📁 المشاريع:', 'green');
  log('─'.repeat(40), 'blue');
  
  for (const project of projects) {
    const stat = fs.statSync(path.join(SANDBOX_DIR, project.name));
    log(`  📂 ${project.name}`, 'cyan');
    log(`     أُنشئ: ${stat.birthtime.toLocaleDateString('ar-SA')}`, 'reset');
  }
}

// List files
function listFiles(dirPath: string = '') {
  const targetDir = dirPath ? path.join(SANDBOX_DIR, dirPath) : SANDBOX_DIR;
  
  if (!fs.existsSync(targetDir)) {
    log('❌ المسار غير موجود', 'red');
    return;
  }

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  
  log(`\n📁 ${dirPath || 'sandbox'}:`, 'green');
  log('─'.repeat(40), 'blue');
  
  for (const entry of entries) {
    const icon = entry.isDirectory() ? '📂' : '📄';
    const color = entry.isDirectory() ? 'cyan' : 'reset';
    log(`  ${icon} ${entry.name}`, color);
  }
}

// Read file
function readFile(filePath: string) {
  if (!filePath) {
    log('❌ مسار الملف مطلوب', 'red');
    return;
  }

  const fullPath = path.join(SANDBOX_DIR, filePath);
  
  if (!fs.existsSync(fullPath)) {
    log('❌ الملف غير موجود', 'red');
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  log(`\n📄 ${filePath}:`, 'green');
  log('─'.repeat(40), 'blue');
  console.log(content);
}

// Template content
const TEMPLATE_CONTENT: Record<string, string> = {
  console_main: `// {PROJECT_NAME} - تطبيق طرفية
// © {YEAR}

دالة رئيسي() {
    اطبع("═══════════════════════════════════")؛
    اطبع("  {PROJECT_NAME}")؛
    اطبع("═══════════════════════════════════")؛
    اطبع("")؛
    
    متغير الاسم = "المستخدم"؛
    اطبع("أهلاً " + الاسم + "!")؛
}

رئيسي()؛`,

  config: `// ملف الإعدادات
ثابت الإعدادات = {
    الاسم: "{PROJECT_NAME}"،
    الإصدار: "1.0.0"
}؛`,

  readme: `# {PROJECT_NAME}

تم إنشاؤه بواسطة وكيل المرجع الذكي

## التشغيل
\`\`\`bash
almarjaa main.mrj
\`\`\`
`,

  web_main: `// {PROJECT_NAME} - تطبيق ويب
// © {YEAR}

استيراد "http" كـ http؛

ثابت المنفذ = 8080؛
متغير الخادم = http.خادم(المنفذ)؛

الخادم.عند_الطلب(دالة(طلب، استجابة) {
    استجابة.أرسل("مرحباً من {PROJECT_NAME}!")؛
})؛

الخادم.شغل()؛
اطبع("الخادم يعمل على المنفذ " + نص(المنفذ))؛`,

  api_server: `// {PROJECT_NAME} - خادم API
// © {YEAR}

استيراد "http" كـ http؛

ثابت المنفذ = 3000؛
متغير الخادم = http.خادم(المنفذ)؛

الخادم.احصل("/api/status"، دالة(طلب، استجابة) {
    استجابة.json({ الحالة: "يعمل" })؛
})؛

الخادم.شغل()؛`
};

// Main command handler
async function main() {
  switch (command) {
    case 'chat':
      await chat(args.slice(1).join(' '));
      break;
    case 'generate':
      await generate(args.slice(1).join(' '));
      break;
    case 'new':
      createProject(args[1], args[2]);
      break;
    case 'list':
    case 'projects':
      listProjects();
      break;
    case 'files':
      listFiles(args[1]);
      break;
    case 'read':
      readFile(args[1]);
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
  }
}

main().catch(console.error);

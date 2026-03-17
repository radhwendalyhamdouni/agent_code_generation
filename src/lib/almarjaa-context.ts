// Al-Marjaa Language Context Loader
// This module loads and provides access to the language definition files

import fs from 'fs';
import path from 'path';

// Types for language context
export interface Keyword {
  primary: string[];
  alias?: string[];
}

export interface Operator {
  symbol: string;
  name?: string;
  alt?: string;
}

export interface SyntaxRule {
  pattern: string;
  example: string;
  description: string;
}

export interface BuiltinFunction {
  params: string[];
  description: string;
}

export interface LanguageRules {
  language_name: string;
  language_version: string;
  file_extension: string;
  keywords: Record<string, Record<string, string[]>>;
  operators: Record<string, Record<string, Operator>>;
  punctuation: Record<string, string | string[]>;
  brackets: Record<string, { open: string; close: string }>;
  regex_patterns: Record<string, { pattern: string; description: string }>;
  syntax_rules: Record<string, SyntaxRule>;
  builtin_functions: Record<string, Record<string, BuiltinFunction>>;
}

// Cache for loaded files
let languageSpec: string | null = null;
let syntaxRules: LanguageRules | null = null;
let fewShotExamples: string | null = null;

// Paths to language definition files
const getLanguageFilesPath = () => {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'agent_code_generation', 'almarjaa_language'),
    path.join(process.cwd(), 'download'),
    path.join(process.cwd(), 'almarjaa_language'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return possiblePaths[0]; // Default to first option
};

// Load language specification (Markdown)
export function loadLanguageSpec(): string {
  if (languageSpec) return languageSpec;

  const basePath = getLanguageFilesPath();
  const specPath = path.join(basePath, 'LANGUAGE_SPEC.md');

  try {
    if (fs.existsSync(specPath)) {
      languageSpec = fs.readFileSync(specPath, 'utf-8');
    } else {
      // Fallback: embedded spec
      languageSpec = getEmbeddedSpec();
    }
  } catch {
    languageSpec = getEmbeddedSpec();
  }

  return languageSpec;
}

// Load syntax rules (JSON)
export function loadSyntaxRules(): LanguageRules {
  if (syntaxRules) return syntaxRules;

  const basePath = getLanguageFilesPath();
  const rulesPath = path.join(basePath, 'SYNTAX_RULES.json');

  try {
    if (fs.existsSync(rulesPath)) {
      const content = fs.readFileSync(rulesPath, 'utf-8');
      syntaxRules = JSON.parse(content);
    } else {
      syntaxRules = getEmbeddedRules();
    }
  } catch {
    syntaxRules = getEmbeddedRules();
  }

  return syntaxRules!;
}

// Load few-shot examples
export function loadFewShotExamples(): string {
  if (fewShotExamples) return fewShotExamples;

  const basePath = getLanguageFilesPath();
  const examplesPath = path.join(basePath, 'FEW_SHOT_EXAMPLES.md');

  try {
    if (fs.existsSync(examplesPath)) {
      fewShotExamples = fs.readFileSync(examplesPath, 'utf-8');
    } else {
      fewShotExamples = getEmbeddedExamples();
    }
  } catch {
    fewShotExamples = getEmbeddedExamples();
  }

  return fewShotExamples;
}

// Get the full context for AI generation
export function getFullContext(): string {
  const spec = loadLanguageSpec();
  const rules = loadSyntaxRules();
  const examples = loadFewShotExamples();

  return `
# لغة المرجع (Al-Marjaa Language) - سياق التوليد

## مواصفات اللغة:
${spec.substring(0, 10000)}

## قواعد النحو:
\`\`\`json
${JSON.stringify(rules, null, 2).substring(0, 8000)}
\`\`\`

## أمثلة برمجية:
${examples.substring(0, 8000)}
`;
}

// Embedded fallback spec (truncated for essential info)
function getEmbeddedSpec(): string {
  return `
# مواصفات لغة المرجع (Al-Marjaa Language Specification)

## الكلمات المفتاحية الرئيسية:

### الدوال والتحكم:
- دالة، أرجع، إذا، وإلا، طالما، لكل، في، توقف، أكمل

### المتغيرات:
- متغير، م (اختصار)، ثابت، ث (اختصار)

### القيم:
- صح، خطأ، لا_شيء

### العمليات:
- و، أو، ليس

## أنواع البيانات:
- رقم، نص، منطقي، قائمة، قاموس، دالة، صنف

## المشغلات:
- حسابية: + - * / % ^ //
- مقارنة: == != < > <= >=
- إسناد: = += -= *= /=

## صيغة الدوال:
\`\`\`
دالة اسم_الدالة(معامل١، معامل٢) {
    أرجع نتيجة؛
}
\`\`\`

## صيغة الشروط:
\`\`\`
إذا شرط {
    # كود
} وإلا {
    # كود بديل
}
\`\`\`

## صيغة الحلقات:
\`\`\`
طالما شرط { # كود }
لكل عنصر في مجموعة { # كود }
\`\`\`
`;
}

// Embedded fallback rules
function getEmbeddedRules(): LanguageRules {
  return {
    language_name: "Al-Marjaa",
    language_version: "3.2.0",
    file_extension: ".mrj",
    keywords: {
      functions: { primary: ["دالة"], alias: ["fn"], return: ["أرجع", "ارجع"] },
      control_flow: {
        if: ["إذا", "اذا"],
        else: ["وإلا", "والا"],
        while: ["طالما"],
        for: ["لكل"],
        in: ["في"],
        break: ["توقف"],
        continue: ["أكمل", "اكمل"]
      },
      variables: { var: ["متغير", "م"], const: ["ثابت", "ث"] },
      values: { true: ["صح"], false: ["خطأ"], null: ["لا_شيء"] },
      logic: { and: ["و"], or: ["أو", "او"], not: ["ليس"] }
    },
    operators: {
      arithmetic: {
        plus: { symbol: "+", name: "جمع" },
        minus: { symbol: "-", name: "طرح" },
        multiply: { symbol: "*", name: "ضرب" },
        divide: { symbol: "/", name: "قسمة" },
        modulo: { symbol: "%", name: "باقي" },
        power: { symbol: "^", name: "أس" }
      },
      comparison: {
        equal: { symbol: "==", name: "يساوي" },
        not_equal: { symbol: "!=", name: "لا_يساوي" },
        less: { symbol: "<", name: "أصغر" },
        greater: { symbol: ">", name: "أكبر" }
      }
    },
    punctuation: { semicolons: ["؛", ";"], commas: ["،", ","] },
    brackets: {
      parentheses: { open: "(", close: ")" },
      braces: { open: "{", close: "}" },
      brackets: { open: "[", close: "]" }
    },
    regex_patterns: {
      identifier: { pattern: "[\\p{Arabic}\\p{Latin}_][\\p{Arabic}\\p{Latin}\\p{Nd}_ـ]*", description: "معرف" },
      arabic_number: { pattern: "[٠-٩]+(\\.[٠-٩]+)?", description: "رقم عربي" }
    },
    syntax_rules: {},
    builtin_functions: {
      io: { "اطبع": { params: ["قيمة"], description: "طباعة قيمة" } },
      list: { "طول": { params: ["قائمة"], description: "طول القائمة" } }
    }
  };
}

// Embedded fallback examples
function getEmbeddedExamples(): string {
  return `
# أمثلة لغة المرجع

## مثال 1: طباعة
\`\`\`
اطبع("مرحباً بالعالم!")؛
\`\`\`

## مثال 2: متغيرات
\`\`\`
متغير الاسم = "أحمد"؛
ثابت pi = ٣.١٤؛
\`\`\`

## مثال 3: دوال
\`\`\`
دالة جمع(أ، ب) {
    أرجع أ + ب؛
}
\`\`\`

## مثال 4: شروط
\`\`\`
إذا الدرجة >= ٩٠ {
    اطبع("ممتاز!")؛
} وإلا {
    اطبع("حاول مرة أخرى")؛
}
\`\`\`

## مثال 5: حلقات
\`\`\`
لكل رقم في [١، ٢، ٣، ٤، ٥] {
    اطبع(رقم)؛
}
\`\`\`
`;
}

// Validate generated code against language rules
export function validateCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rules = loadSyntaxRules();

  // Check for balanced brackets
  const bracketPairs = [
    { open: '(', close: ')' },
    { open: '{', close: '}' },
    { open: '[', close: ']' }
  ];

  for (const { open, close } of bracketPairs) {
    const openCount = (code.match(new RegExp(`\\${open}`, 'g')) || []).length;
    const closeCount = (code.match(new RegExp(`\\${close}`, 'g')) || []).length;
    if (openCount !== closeCount) {
      errors.push(`عدم تطابق الأقواس: ${open} و ${close}`);
    }
  }

  // Check for required semicolons (basic check)
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('//') &&
        !line.endsWith('؛') && !line.endsWith(';') &&
        !line.endsWith('{') && !line.endsWith('}') &&
        !line.includes('=>')) {
      // Check if it's a statement that needs semicolon
      if (line.includes('=') || line.includes('اطبع') || line.includes('أرجع')) {
        // This is a warning, not an error
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Extract code structure from generated content
export function extractCodeFromResponse(response: string): string {
  // Try to extract code from markdown code blocks
  const codeBlockMatch = response.match(/```(?:almarjaa|al-marjaa|mrj)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // If no code block, return the response as-is (might be pure code)
  return response.trim();
}

/**
 * AI Providers Library for Al-Marjaa Language Agent
 * Supports: Gemini API, OpenRouter API, and z-ai-web-dev-sdk
 * 
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

// Types
export interface AIProvider {
  name: string;
  id: string;
  models: string[];
  requiresApiKey: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResponse {
  success: boolean;
  content: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Available providers
export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'Gemini',
    id: 'gemini',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    requiresApiKey: true
  },
  {
    name: 'OpenRouter',
    id: 'openrouter',
    models: [
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'mistralai/mistral-7b-instruct:free'
    ],
    requiresApiKey: true
  },
  {
    name: 'Z-AI SDK',
    id: 'zai',
    models: ['default', 'advanced'],
    requiresApiKey: false
  }
];

// Gemini API Client
export class GeminiClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const model = options.model || 'gemini-2.0-flash';
    
    try {
      // Convert messages to Gemini format
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add system instruction if provided
      const systemInstruction = options.systemPrompt ? {
        parts: [{ text: options.systemPrompt }]
      } : undefined;

      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction,
            generationConfig: {
              temperature: options.temperature || 0.7,
              maxOutputTokens: options.maxTokens || 2048
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, content: '', error: `Gemini API Error: ${error}` };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return {
        success: true,
        content,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error: any) {
      return { success: false, content: '', error: error.message };
    }
  }
}

// OpenRouter API Client
export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const model = options.model || 'google/gemini-2.0-flash-exp:free';
    
    try {
      // Add system prompt if provided
      const allMessages = options.systemPrompt 
        ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
        : messages;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://almarjaa.agent',
          'X-Title': 'Al-Marjaa Language Agent'
        },
        body: JSON.stringify({
          model,
          messages: allMessages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048
        })
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, content: '', error: `OpenRouter API Error: ${error}` };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      return {
        success: true,
        content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error: any) {
      return { success: false, content: '', error: error.message };
    }
  }
}

// Z-AI SDK Client (using z-ai-web-dev-sdk)
export class ZAIClient {
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      // Dynamic import for z-ai-web-dev-sdk
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      // Add system prompt if provided
      const allMessages = options.systemPrompt 
        ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
        : messages;

      const completion = await zai.chat.completions.create({
        messages: allMessages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048
      });

      const content = completion.choices?.[0]?.message?.content || '';
      
      return {
        success: true,
        content,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error: any) {
      return { success: false, content: '', error: error.message };
    }
  }
}

// Unified AI Service
export class UnifiedAIService {
  private provider: 'gemini' | 'openrouter' | 'zai';
  private geminiClient?: GeminiClient;
  private openRouterClient?: OpenRouterClient;
  private zaiClient?: ZAIClient;

  constructor(provider: 'gemini' | 'openrouter' | 'zai' = 'zai', apiKey?: string) {
    this.provider = provider;
    
    if (provider === 'gemini' && apiKey) {
      this.geminiClient = new GeminiClient(apiKey);
    } else if (provider === 'openrouter' && apiKey) {
      this.openRouterClient = new OpenRouterClient(apiKey);
    } else {
      this.zaiClient = new ZAIClient();
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    switch (this.provider) {
      case 'gemini':
        if (!this.geminiClient) {
          return { success: false, content: '', error: 'Gemini API key not configured' };
        }
        return this.geminiClient.chat(messages, options);
      
      case 'openrouter':
        if (!this.openRouterClient) {
          return { success: false, content: '', error: 'OpenRouter API key not configured' };
        }
        return this.openRouterClient.chat(messages, options);
      
      default:
        if (!this.zaiClient) {
          this.zaiClient = new ZAIClient();
        }
        return this.zaiClient.chat(messages, options);
    }
  }

  getProvider(): string {
    return this.provider;
  }
}

// System prompt for Al-Marjaa Language
export const ALMARJAA_SYSTEM_PROMPT = `أنت وكيل ذكي متخصص في لغة المرجع البرمجية العربية.

## معلومات عن لغة المرجع:
لغة المرجع هي أول لغة برمجة عربية متكاملة مع الذكاء الاصطناعي، طورها المبرمج **رضوان دالي حمدوني**.

## الكلمات المفتاحية الأساسية:
- متغير، ثابت، دالة، صنف، إذا، وإلا، طالما، لكل، في، أرجع، اطبع
- صحيح، خطأ، فارغ، جديد، هذا، محاولة، قبض، ألقِ

## أنواع البيانات:
- رقم (Number): ١٢٣، 45.67
- نص (String): "مرحباً"
- منطقي (Boolean): صحيح، خطأ
- قائمة (List): [1، 2، 3]
- قاموس (Dictionary): {"مفتاح": "قيمة"}

## أمثلة:

### طباعة:
\`\`\`almarjaa
اطبع("مرحباً بالعالم!")؛
\`\`\`

### المتغيرات:
\`\`\`almarjaa
متغير الاسم = "أحمد"؛
متغير العمر = ٢٥؛
ثابت باي = 3.14159؛
\`\`\`

### الدوال:
\`\`\`almarjaa
دالة مضروب(ن) {
    إذا ن <= 1 {
        أرجع 1؛
    }
    أرجع ن * مضروب(ن - 1)؛
}
\`\`\`

### الحلقات:
\`\`\`almarjaa
لكل رقم في مدى(١، ١٠) {
    اطبع(رقم)؛
}

طالما شرط {
    // الكود
}
\`\`\`

### الشروط:
\`\`\`almarjaa
إذا العمر >= 18 {
    اطبع("بالغ")؛
} وإلا {
    اطبع("قاصر")؛
}
\`\`\`

### القوائم:
\`\`\`almarjaa
متغير أرقام = [1، 2، 3، 4، 5]؛
متغير زوجية = [س لكل س في أرقام إذا س % 2 == 0]؛
\`\`\`

### البرمجة الكائنية:
\`\`\`almarjaa
صنف حيوان {
    متغير الاسم؛
    
    دالة حيوان(الاسم) {
        هذا.الاسم = الاسم؛
    }
    
    دالة صوت() {
        أرجع "صوت عام"؛
    }
}

صنف كلب: حيوان {
    دالة صوت() {
        أرجع "نباح!"؛
    }
}
\`\`\`

## مهمتك:
1. فهم طلبات المستخدم بالعربية
2. كتابة كود لغة المرجع الصحيح
3. شرح الكود إذا لزم الأمر
4. اقتراح تحسينات وبدائل
5. تصحيح الأخطاء البرمجية

يجب أن تكون الإجابات بالعربية مع كود صالح للتنفيذ.`;

// Export a factory function
export function createAIService(provider: string, apiKey?: string): UnifiedAIService {
  return new UnifiedAIService(provider as any, apiKey);
}

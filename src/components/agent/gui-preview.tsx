'use client';

/**
 * معاينة واجهة المرجع - GUI Preview
 * معاينة حية لتطبيقات لغة المرجع
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Play,
  Code,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Layout,
  FileCode,
  Sparkles,
  Loader2,
  Download,
  Maximize2,
} from 'lucide-react';

interface GUIPreviewProps {
  className?: string;
}

export function GUIPreview({ className }: GUIPreviewProps) {
  const [code, setCode] = useState(defaultCode);
  const [preview, setPreview] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState<string[]>(['basic', 'calculator', 'todo', 'dashboard']);

  // معاينة الكود
  const handlePreview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          code,
          title: 'معاينة تطبيق المرجع'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPreview(data.html);
        setActiveTab('preview');
      } else {
        setPreview(`<p class="error">${data.error}</p>`);
      }
    } catch (error: any) {
      setPreview(`<p class="error">خطأ: ${error.message}</p>`);
    } finally {
      setLoading(false);
    }
  }, [code]);

  // تحميل قالب
  const loadTemplate = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/gui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'template',
          templateType: type
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCode(data.code);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // نسخ الكود
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // تنزيل المعاينة
  const downloadPreview = useCallback(() => {
    if (!preview) return;
    
    const blob = new Blob([preview], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'almarjaa-app.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [preview]);

  return (
    <div className={cn("h-full flex flex-col bg-background", className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">معاينة الواجهة</span>
          <Badge variant="outline" className="text-[10px]">
            GUI
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {/* قوالب */}
          <select
            className="h-7 px-2 text-xs bg-muted/50 border border-border rounded"
            onChange={(e) => loadTemplate(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>اختر قالب</option>
            <option value="basic">تطبيق أساسي</option>
            <option value="calculator">حاسبة</option>
            <option value="todo">قائمة مهام</option>
            <option value="dashboard">لوحة تحكم</option>
          </select>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs bg-primary/10 text-primary hover:bg-primary/20"
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 ml-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 ml-1" />
            )}
            معاينة
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between px-4 py-1 border-b border-border bg-muted/20">
              <TabsList className="h-8">
                <TabsTrigger value="code" className="text-xs px-3 h-7">
                  <Code className="h-3 w-3 ml-1" />
                  الكود
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-3 h-7" disabled={!preview}>
                  <Eye className="h-3 w-3 ml-1" />
                  المعاينة
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={copyCode}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                {preview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={downloadPreview}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <TabsContent value="code" className="m-0 flex-1">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="اكتب كود الواجهة هنا..."
                className="h-full border-0 rounded-none resize-none font-mono text-sm bg-[#0a0a0a] focus-visible:ring-0"
                style={{ direction: 'rtl', textAlign: 'right' }}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="m-0 flex-1">
              {preview ? (
                <iframe
                  srcDoc={preview}
                  className="w-full h-full border-0 bg-white"
                  title="معاينة التطبيق"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">اضغط "معاينة" لرؤية التطبيق</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Components Palette */}
        <div className="w-56 border-r border-border shrink-0 flex flex-col">
          <div className="px-3 py-2 border-b border-border shrink-0">
            <span className="text-xs font-medium text-muted-foreground">المكونات</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {componentList.map((comp) => (
                <button
                  key={comp.key}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded text-right text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => setCode(code + '\n' + comp.template)}
                >
                  <span className="text-lg">{comp.icon}</span>
                  <div className="flex-1">
                    <span className="block font-medium">{comp.arabicName}</span>
                    <span className="text-[10px] text-muted-foreground">{comp.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// قائمة المكونات
const componentList = [
  {
    key: 'container',
    arabicName: 'حاوية',
    description: 'حاوية للعناصر',
    icon: '📦',
    template: `حاوية.جديد({
    اتجاه: "column"،
    محاذاة: "center"
})؛`
  },
  {
    key: 'text',
    arabicName: 'نص',
    description: 'عرض النص',
    icon: '📝',
    template: `نص.جديد({
    محتوى: "نص تجريبي"،
    حجم: 16،
    لون: "#ffffff"
})؛`
  },
  {
    key: 'button',
    arabicName: 'زر',
    description: 'زر تفاعلي',
    icon: '🔘',
    template: `زر.جديد({
    نص: "اضغط هنا"،
    خلفية: "#10b981"،
    عند_الضغط: دالة() {
        تنبيه.اعرض("تم الضغط!")؛
    }
})؛`
  },
  {
    key: 'input',
    arabicName: 'مدخل',
    description: 'حقل إدخال',
    icon: '✏️',
    template: `مدخل.جديد({
    نص: "أدخل النص..."،
    معرف: "مدخل1"
})؛`
  },
  {
    key: 'card',
    arabicName: 'بطاقة',
    description: 'بطاقة محتوى',
    icon: '🃏',
    template: `بطاقة.جديد({
    عنوان: "عنوان البطاقة"،
    محتوى: "محتوى البطاقة هنا..."
})؛`
  },
  {
    key: 'list',
    arabicName: 'قائمة',
    description: 'قائمة عناصر',
    icon: '📋',
    template: `قائمة.جديد({
    عناصر: ["عنصر 1"، "عنصر 2"، "عنصر 3"]
})؛`
  },
  {
    key: 'table',
    arabicName: 'جدول',
    description: 'جدول بيانات',
    icon: '📊',
    template: `جدول.جديد({
    رؤوس: ["الاسم"، "القيمة"]،
    صفوف: [
        ["أ"، "100"]،
        ["ب"، "200"]
    ]
})؛`
  },
  {
    key: 'tabs',
    arabicName: 'تبويبات',
    description: 'تبويبات متعددة',
    icon: '📑',
    template: `تبويبات.جديد({
    تبويبات: ["الأول"، "الثاني"، "الثالث"]،
    نشط: 0
})؛`
  },
  {
    key: 'progress',
    arabicName: 'تقدم',
    description: 'شريط التقدم',
    icon: '📈',
    template: `تقدم.جديد({
    قيمة: 70،
    أقصى: 100،
    لون: "#10b981"
})؛`
  },
  {
    key: 'checkbox',
    arabicName: 'خانة',
    description: 'خانة اختيار',
    icon: '☑️',
    template: `خانة.جديد({
    نص: "أوافق على الشروط"،
    محدد: خطأ
})؛`
  },
  {
    key: 'select',
    arabicName: 'منسدلة',
    description: 'قائمة منسدلة',
    icon: '🔽',
    template: `منسدلة.جديد({
    خيارات: ["الخيار 1"، "الخيار 2"، "الخيار 3"]
})؛`
  },
  {
    key: 'slider',
    arabicName: 'منزلق',
    description: 'شريط تمرير',
    icon: '🎚️',
    template: `منزلق.جديد({
    أدنى: 0،
    أقصى: 100،
    قيمة: 50
})؛`
  },
  {
    key: 'image',
    arabicName: 'صورة',
    description: 'عرض صورة',
    icon: '🖼️',
    template: `صورة.جديد({
    مصدر: "رابط_الصورة"،
    عرض: 200،
    ارتفاع: 150
})؛`
  },
  {
    key: 'alert',
    arabicName: 'تنبيه',
    description: 'رسالة تنبيه',
    icon: '⚠️',
    template: `تنبيه.جديد({
    نص: "هذا تنبيه مهم!"،
    نوع: "تحذير"
})؛`
  },
  {
    key: 'form',
    arabicName: 'نموذج',
    description: 'نموذج إدخال',
    icon: '📄',
    template: `نموذج.جديد({
    عنوان: "نموذج جديد"
}) {
    حقل.جديد({ تسمية: "الاسم" })؛
    حقل.جديد({ تسمية: "البريد" })؛
}`
  },
];

// الكود الافتراضي
const defaultCode = `// تطبيق المرجع - واجهة تفاعلية
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

حاوية.جديد({
    اتجاه: "row"،
    محاذاة: "center"
}) {
    زر.جديد({
        نص: "زر 1"،
        خلفية: "#10b981"
    })؛
    
    زر.جديد({
        نص: "زر 2"،
        خلفية: "#3b82f6"
    })؛
}`;

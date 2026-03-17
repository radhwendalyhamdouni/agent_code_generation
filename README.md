<div align="center">

<img src="public/banner.png" alt="وكيل المرجع الذكي - AI Agent Banner" width="100%"/>

# وكيل المرجع الذكي | Al-Marjaa AI Agent

### وكيل ذكي متقدم لبناء تطبيقات لغة المرجع
### Advanced AI Agent for Building Al-Marjaa Language Applications

[![Version](https://img.shields.io/badge/version-3.4.0-blue.svg)](https://github.com/radhwendalyhamdouni/agent_code_generation)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70%2B-orange?logo=rust)](https://www.rust-lang.org/)

<p align="center">
  <a href="#-نظرة-عامة">نظرة عامة</a> •
  <a href="#-المميزات">المميزات</a> •
  <a href="#-التثبيت">التثبيت</a> •
  <a href="#-الاستخدام">الاستخدام</a> •
  <a href="#-api">API</a>
</p>

</div>

---

## 🌟 نظرة عامة | Overview

**وكيل المرجع الذكي** هو بيئة تطوير متكاملة تعتمد على الذكاء الاصطناعي لإنشاء وتشغيل وتصحيح برامج لغة المرجع العربية. يجمع بين قوة نماذج الذكاء الاصطناعي المتقدمة ومفسر لغة المرجع الفعلي لتوفير تجربة برمجة سلسة وفعالة.

**Al-Marjaa AI Agent** is an AI-powered integrated development environment for creating, running, and debugging Al-Marjaa Arabic language programs. It combines advanced AI models with the actual Al-Marjaa interpreter to provide a seamless and efficient programming experience.

---

## ✨ المميزات | Features

### 🤖 ذكاء اصطناعي متقدم | Advanced AI

- **توليد الكود من الوصف**: اكتب ما تريد بالعربية ويقوم الوكيل بإنشاء الكود
- **تصحيح الأخطاء الذكي**: تحليل وتصحيح الأخطاء تلقائياً
- **شرح الكود**: شرح تفصيلي لأي كود بلغة المرجع
- **محادثة تفاعلية**: تواصل مع الوكيل باللغة العربية

### 💻 بيئة تطوير متكاملة | Full IDE

- **محرر كود متقدم**: تحرير كود لغة المرجع مع تمييز بناء الجملة
- **تنفيذ فعلي**: تشغيل الكود باستخدام مفسر لغة المرجع الحقيقي
- **طرفية مدمجة**: أوامر سطرية مباشرة
- **مستكشف الملفات**: إدارة الملفات والمشاريع

### 🎨 واجهة احترافية | Professional UI

- **تصميم عصري**: واجهة داكنة أنيقة بألوان الزمرد والفيروزي
- **دعم RTL**: كتابة من اليمين لليسار للغة العربية
- **ألواح قابلة للتعديل**: تكبير وتصغير النوافذ حسب الحاجة
- **ثيمات متعددة**: تخصيص المظهر حسب التفضيل

### 🔧 إدارة المشاريع | Project Management

- **قوالب جاهزة**: قوالب متنوعة للتطبيقات المختلفة
- **تصدير ZIP**: تصدير المشروع كملف مضغوط
- **إدارة الملفات**: إنشاء وحذف وتعديل الملفات

### ⚡ أداء عالي | High Performance

- **Next.js 16**: أحدث إطار عمل للواجهات
- **TypeScript**: كود آمن وقوي
- **Tailwind CSS**: تصميم سريع ومرن
- **shadcn/ui**: مكونات احترافية

---

## 📦 التثبيت | Installation

### المتطلبات | Requirements

- Node.js 18+
- Rust 1.70+ (لتشغيل مفسر لغة المرجع)
- Git

### التثبيت السريع | Quick Install

```bash
# استنساخ المستودع
git clone https://github.com/radhwendalyhamdouni/agent_code_generation.git
cd agent_code_generation

# تثبيت التبعيات
npm install

# بناء المشروع
npm run build

# تشغيل الخادم
npm start
```

### تثبيت لغة المرجع | Install Al-Marjaa Language

```bash
# استنساخ مستودع اللغة
git clone https://github.com/radhwendalyhamdouni/Al-Marjaa-Language.git
cd Al-Marjaa-Language

# البناء
cargo build --release

# التثبيت
cargo install --path .
```

### التثبيت على Debian | Debian Installation

```bash
chmod +x install-debian.sh
./install-debian.sh
```

---

## 🚀 الاستخدام | Usage

### تشغيل الواجهة | Run the UI

```bash
npm run dev
# افتح http://localhost:3000
```

### استخدام CLI | CLI Usage

```bash
# تشغيل ملف المرجع
almarjaa program.mrj

# وضع REPL التفاعلي
almarjaa -r

# Vibe Coding
almarjaa-vibe
```

### مثال كود | Code Example

```almarjaa
// مرحباً بالعالم
اطبع("مرحباً بالعالم!")؛

// متغيرات
متغير الاسم = "أحمد"؛
متغير العمر = ٢٥؛

// دالة
دالة ترحيب(اسم) {
    اطبع("مرحباً " + اسم + "!")؛
}

ترحيب(الاسم)؛
```

---

## 🔌 API

### Chat API

```typescript
POST /api/agent/chat
Body: { message: string }
Response: { content: string }
```

### Execute API

```typescript
POST /api/agent/execute
Body: { code: string, language?: string }
Response: { success: boolean, output: string }
```

### Files API

```typescript
GET /api/files
POST /api/files { action: 'create' | 'update', path: string, content?: string }
DELETE /api/files?path=filename
```

### Projects API

```typescript
POST /api/projects { name: string, type: string }
```

### Export API

```typescript
GET /api/export?project=name
Response: ZIP file download
```

### Settings API

```typescript
GET /api/settings
POST /api/settings { ...settings }
DELETE /api/settings
```

---

## 🏗️ هيكلية المشروع | Project Structure

```
agent_code_generation/
├── src/
│   ├── app/
│   │   ├── page.tsx           # الواجهة الرئيسية
│   │   ├── layout.tsx         # التخطيط
│   │   ├── globals.css        # الأنماط
│   │   └── api/               # واجهات API
│   │       ├── agent/         # واجهات الوكيل
│   │       │   ├── chat/      # المحادثة
│   │       │   └── execute/   # التنفيذ
│   │       ├── files/         # إدارة الملفات
│   │       ├── projects/      # إدارة المشاريع
│   │       ├── export/        # التصدير
│   │       └── settings/      # الإعدادات
│   ├── components/            # مكونات UI
│   └── lib/                   # المكتبات
│       └── deep-agent.ts      # وكيل الذكاء الاصطناعي
├── mini-services/
│   └── terminal-controller/   # خدمة الطرفية
├── public/                    # الملفات العامة
├── sandbox/                   # مساحة العمل
└── almarjaa-cli.ts           # أداة CLI
```

---

## 🛠️ التقنيات | Technologies

| التقنية | الاستخدام |
|---------|----------|
| Next.js 16 | إطار الواجهة |
| TypeScript | لغة البرمجة |
| Tailwind CSS 4 | التنسيق |
| shadcn/ui | مكونات UI |
| Radix UI | مكونات أساسية |
| Z-AI SDK | الذكاء الاصطناعي |
| Rust | مفسر لغة المرجع |
| Prisma | قاعدة البيانات |

---

## 📝 قوالب المشاريع | Project Templates

| النوع | الوصف |
|------|-------|
| `console` | تطبيق طرفية بسيط |
| `web` | تطبيق ويب مع واجهة |
| `api` | خادم API REST |
| `cli` | أداة سطر أوامر |
| `neural` | شبكة عصبية |
| `data` | معالجة بيانات |

---

## 🎯 أمثلة الاستخدام | Usage Examples

### توليد كود من وصف

```
المستخدم: اكتب برنامج يحسب مضروب عدد

الوكيل:
```almarjaa
دالة مضروب(ن) {
    إذا ن <= 1 {
        أرجع 1؛
    }
    أرجع ن * مضروب(ن - 1)؛
}

اطبع(مضروب(5))؛  // 120
```
```

### تصحيح الأخطاء

```
المستخدم: هذا الكود لا يعمل:
متغير س = 10
اطبع(س)

الوكيل: المشكلة في عدم وجود الفاصلة المنقوطة في نهاية السطر الأول:
متغير س = 10؛
اطبع(س)؛
```

---

## 📜 الرخصة | License

### © 2026 رضوان دالي حمدوني | All Rights Reserved

هذا المشروع محمي بموجب حقوق الملكية الفكرية. يُسمح بالاستخدام للأغراض **غير التجارية** فقط مع نسب المصدر.

---

## 👨‍💻 المؤلف | Author

<div align="center">

**رضوان دالي حمدوني | RADHWEN DALY HAMDOUNI**

[![GitHub](https://img.shields.io/badge/GitHub-radhwendalyhamdouni-blue?logo=github)](https://github.com/radhwendalyhamdouni)
[![Email](https://img.shields.io/badge/Email-almarjaa.project@hotmail.com-red?logo=mail)](mailto:almarjaa.project@hotmail.com)

</div>

---

## 🙏 شكر وتقدير | Acknowledgments

- مجتمع Rust على الدعم التقني
- فريق Next.js على الإطار الرائع
- المجتمع العربي للبرمجة

---

<div align="center">

**صُنع بـ ❤️ للعالم العربي**

**Made with ❤️ for the Arab World**

© 2026 رضوان دالي حمدوني | RADHWEN DALY HAMDOUNI

**جميع الحقوق محفوظة | All Rights Reserved**

</div>

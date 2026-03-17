/**
 * مكتبة واجهات المرجع - Al-Marjaa GUI Library
 * مكتبة عربية لإنشاء واجهات المستخدم
 */

export interface GUIComponent {
  type: string;
  id: string;
  properties: Record<string, any>;
  children?: GUIComponent[];
  events?: Record<string, string>;
}

export interface GUIWindow {
  title: string;
  width: number;
  height: number;
  direction: 'rtl' | 'ltr';
  theme: 'light' | 'dark';
  root: GUIComponent;
}

// مكونات GUI المدعومة
export const GUI_COMPONENTS = {
  // الحاوية
  حاوية: {
    arabicName: 'حاوية',
    type: 'container',
    properties: {
      عرض: 'width',
      ارتفاع: 'height',
      خلفية: 'background',
      حشوة: 'padding',
      هامش: 'margin',
      محاذاة: 'align',
      اتجاه: 'direction',
    }
  },
  
  // النص
  نص: {
    arabicName: 'نص',
    type: 'text',
    properties: {
      محتوى: 'content',
      حجم: 'fontSize',
      لون: 'color',
      ثخانة: 'fontWeight',
      محاذاة: 'textAlign',
    }
  },
  
  // الزر
  زر: {
    arabicName: 'زر',
    type: 'button',
    properties: {
      نص: 'text',
      لون: 'color',
      خلفية: 'background',
      حجم: 'size',
      معطل: 'disabled',
    },
    events: ['عند_الضغط']
  },
  
  // مدخل النص
  مدخل: {
    arabicName: 'مدخل',
    type: 'input',
    properties: {
      نص: 'placeholder',
      قيمة: 'value',
      نوع: 'type',
      لون: 'color',
      خلفية: 'background',
    },
    events: ['عند_التغيير', 'عند_الإدخال']
  },
  
  // القائمة
  قائمة: {
    arabicName: 'قائمة',
    type: 'list',
    properties: {
      عناصر: 'items',
      لون: 'color',
      خلفية: 'background',
    }
  },
  
  // الصورة
  صورة: {
    arabicName: 'صورة',
    type: 'image',
    properties: {
      مصدر: 'src',
      عرض: 'width',
      ارتفاع: 'height',
      وصف: 'alt',
    }
  },
  
  // البطاقة
  بطاقة: {
    arabicName: 'بطاقة',
    type: 'card',
    properties: {
      عنوان: 'title',
      محتوى: 'content',
      ظل: 'shadow',
    }
  },
  
  // الجدول
  جدول: {
    arabicName: 'جدول',
    type: 'table',
    properties: {
      أعمدة: 'columns',
      صفوف: 'rows',
      رؤوس: 'headers',
    }
  },
  
  // شريط التقدم
  تقدم: {
    arabicName: 'تقدم',
    type: 'progress',
    properties: {
      قيمة: 'value',
      أقصى: 'max',
      لون: 'color',
    }
  },
  
  // المؤقت
  مؤقت: {
    arabicName: 'مؤقت',
    type: 'timer',
    properties: {
      مدة: 'duration',
      نشط: 'active',
    },
    events: ['عند_الانتهاء']
  },
  
  // التنبيه
  تنبيه: {
    arabicName: 'تنبيه',
    type: 'alert',
    properties: {
      نص: 'message',
      نوع: 'type',
    }
  },
  
  // النموذج
  نموذج: {
    arabicName: 'نموذج',
    type: 'form',
    properties: {
      عنوان: 'title',
      حقول: 'fields',
    },
    events: ['عند_الإرسال']
  },
  
  // التبويبات
  تبويبات: {
    arabicName: 'تبويبات',
    type: 'tabs',
    properties: {
      تبويبات: 'tabs',
      نشط: 'active',
    }
  },
  
  // القائمة المنسدلة
  منسدلة: {
    arabicName: 'منسدلة',
    type: 'select',
    properties: {
      خيارات: 'options',
      محدد: 'selected',
    },
    events: ['عند_الاختيار']
  },
  
  // خانة الاختيار
  خانة: {
    arabicName: 'خانة',
    type: 'checkbox',
    properties: {
      نص: 'label',
      محدد: 'checked',
    },
    events: ['عند_التغيير']
  },
  
  // المنزلق
  منزلق: {
    arabicName: 'منزلق',
    type: 'slider',
    properties: {
      أقصى: 'max',
      أدنى: 'min',
      قيمة: 'value',
    },
    events: ['عند_التغيير']
  },
};

/**
 * محلل أكواد GUI للغة المرجع
 */
export class GUIParser {
  
  /**
   * تحليل كود GUI إلى مكونات
   */
  parse(code: string): GUIComponent[] {
    const components: GUIComponent[] = [];
    
    // أنماط البحث
    const patterns = {
      window: /نافذة\.جديد\s*\(\s*\{([^}]+)\}\s*\)/g,
      component: /(\w+)\.جديد\s*\(\s*\{([^}]+)\}\s*\)/g,
      property: /(\w+):\s*"([^"]+)"|(\w+):\s*(\d+)|(\w+):\s*(\[[^\]]+\])|(\w+):\s*(\{[^}]+\})/g,
      event: /عند_(\w+)\s*:\s*دالة\s*\(\s*\)\s*\{([^}]+)\}/g,
    };
    
    // استخراج المكونات
    let match;
    while ((match = patterns.component.exec(code)) !== null) {
      const [fullMatch, componentName, propertiesStr] = match;
      
      // التحقق من أن المكون مدعوم
      const componentDef = Object.values(GUI_COMPONENTS).find(
        c => c.arabicName === componentName
      );
      
      if (componentDef) {
        const component: GUIComponent = {
          type: componentDef.type,
          id: `${componentName}_${components.length}`,
          properties: this.parseProperties(propertiesStr, componentDef.properties),
          events: {},
        };
        
        // استخراج الأحداث
        let eventMatch;
        const eventPatterns = /عند_(\w+)\s*:\s*دالة\s*\(\s*\)\s*\{([^}]+)\}/g;
        while ((eventMatch = eventPatterns.exec(propertiesStr)) !== null) {
          component.events![`on${eventMatch[1].charAt(0).toUpperCase()}${eventMatch[1].slice(1)}`] = eventMatch[2].trim();
        }
        
        components.push(component);
      }
    }
    
    return components;
  }
  
  /**
   * تحليل الخصائص
   */
  private parseProperties(propsStr: string, mapping: Record<string, string>): Record<string, any> {
    const props: Record<string, any> = {};
    
    // تحليل الخصائص النصية
    const textPattern = /(\w+):\s*"([^"]+)"/g;
    let match;
    while ((match = textPattern.exec(propsStr)) !== null) {
      const [, key, value] = match;
      if (mapping[key]) {
        props[mapping[key]] = value;
      } else {
        props[key] = value;
      }
    }
    
    // تحليل الخصائص الرقمية
    const numPattern = /(\w+):\s*(\d+(?:\.\d+)?)/g;
    while ((match = numPattern.exec(propsStr)) !== null) {
      const [, key, value] = match;
      if (mapping[key]) {
        props[mapping[key]] = parseFloat(value);
      } else {
        props[key] = parseFloat(value);
      }
    }
    
    // تحليل القوائم
    const listPattern = /(\w+):\s*\[([^\]]+)\]/g;
    while ((match = listPattern.exec(propsStr)) !== null) {
      const [, key, value] = match;
      const items = value.split('،').map(s => s.trim().replace(/"/g, ''));
      if (mapping[key]) {
        props[mapping[key]] = items;
      } else {
        props[key] = items;
      }
    }
    
    return props;
  }
}

/**
 * محول GUI إلى HTML
 */
export class GUIRenderer {
  
  /**
   * تحويل المكونات إلى HTML
   */
  render(components: GUIComponent[]): string {
    return components.map(c => this.renderComponent(c)).join('\n');
  }
  
  /**
   * تحويل مكون واحد
   */
  private renderComponent(component: GUIComponent): string {
    switch (component.type) {
      case 'container':
        return this.renderContainer(component);
      case 'text':
        return this.renderText(component);
      case 'button':
        return this.renderButton(component);
      case 'input':
        return this.renderInput(component);
      case 'list':
        return this.renderList(component);
      case 'image':
        return this.renderImage(component);
      case 'card':
        return this.renderCard(component);
      case 'table':
        return this.renderTable(component);
      case 'progress':
        return this.renderProgress(component);
      case 'checkbox':
        return this.renderCheckbox(component);
      case 'select':
        return this.renderSelect(component);
      case 'slider':
        return this.renderSlider(component);
      case 'tabs':
        return this.renderTabs(component);
      default:
        return `<!-- Unknown component: ${component.type} -->`;
    }
  }
  
  private renderContainer(c: GUIComponent): string {
    const style = this.buildStyle(c.properties);
    const children = c.children?.map(child => this.renderComponent(child)).join('') || '';
    return `<div class="gui-container" style="${style}">${children}</div>`;
  }
  
  private renderText(c: GUIComponent): string {
    const style = this.buildStyle(c.properties);
    const content = c.properties.content || c.properties.text || '';
    return `<p class="gui-text" style="${style}">${content}</p>`;
  }
  
  private renderButton(c: GUIComponent): string {
    const style = this.buildStyle(c.properties);
    const text = c.properties.text || 'زر';
    const onclick = c.events?.onClick ? `onclick="${c.events.onClick}"` : '';
    return `<button class="gui-button" style="${style}" ${onclick}>${text}</button>`;
  }
  
  private renderInput(c: GUIComponent): string {
    const style = this.buildStyle(c.properties);
    const placeholder = c.properties.placeholder || '';
    const type = c.properties.type || 'text';
    const onchange = c.events?.onChange ? `onchange="${c.events.onChange}"` : '';
    return `<input class="gui-input" type="${type}" placeholder="${placeholder}" style="${style}" ${onchange} />`;
  }
  
  private renderList(c: GUIComponent): string {
    const style = this.buildStyle(c.properties);
    const items = c.properties.items || [];
    const listItems = items.map((item: string) => `<li>${item}</li>`).join('');
    return `<ul class="gui-list" style="${style}">${listItems}</ul>`;
  }
  
  private renderImage(c: GUIComponent): string {
    const style = this.buildStyle(c.properties);
    const src = c.properties.src || '';
    const alt = c.properties.alt || '';
    return `<img class="gui-image" src="${src}" alt="${alt}" style="${style}" />`;
  }
  
  private renderCard(c: GUIComponent): string {
    const style = this.buildStyle(c.properties);
    const title = c.properties.title || '';
    const content = c.properties.content || '';
    return `
      <div class="gui-card" style="${style}">
        ${title ? `<h3 class="gui-card-title">${title}</h3>` : ''}
        <div class="gui-card-content">${content}</div>
      </div>
    `;
  }
  
  private renderTable(c: GUIComponent): string {
    const style = this.buildStyle(c.properties);
    const headers = c.properties.headers || [];
    const rows = c.properties.rows || [];
    
    const headerHtml = headers.map((h: string) => `<th>${h}</th>`).join('');
    const rowsHtml = rows.map((row: string[]) => 
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    
    return `
      <table class="gui-table" style="${style}">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }
  
  private renderProgress(c: GUIComponent): string {
    const value = c.properties.value || 0;
    const max = c.properties.max || 100;
    const color = c.properties.color || '#10b981';
    return `
      <div class="gui-progress">
        <div class="gui-progress-bar" style="width: ${(value / max) * 100}%; background: ${color};"></div>
      </div>
    `;
  }
  
  private renderCheckbox(c: GUIComponent): string {
    const label = c.properties.label || '';
    const checked = c.properties.checked ? 'checked' : '';
    return `
      <label class="gui-checkbox">
        <input type="checkbox" ${checked} />
        <span>${label}</span>
      </label>
    `;
  }
  
  private renderSelect(c: GUIComponent): string {
    const options = c.properties.options || [];
    const optionsHtml = options.map((opt: string) => `<option>${opt}</option>`).join('');
    return `<select class="gui-select">${optionsHtml}</select>`;
  }
  
  private renderSlider(c: GUIComponent): string {
    const min = c.properties.min || 0;
    const max = c.properties.max || 100;
    const value = c.properties.value || 50;
    return `<input class="gui-slider" type="range" min="${min}" max="${max}" value="${value}" />`;
  }
  
  private renderTabs(c: GUIComponent): string {
    const tabs = c.properties.tabs || [];
    const active = c.properties.active || 0;
    
    const tabsHtml = tabs.map((tab: string, i: number) => 
      `<button class="gui-tab ${i === active ? 'active' : ''}">${tab}</button>`
    ).join('');
    
    return `<div class="gui-tabs">${tabsHtml}</div>`;
  }
  
  private buildStyle(properties: Record<string, any>): string {
    const styleMap: Record<string, string> = {
      width: (v: any) => `width: ${typeof v === 'number' ? v + 'px' : v};`,
      height: (v: any) => `height: ${typeof v === 'number' ? v + 'px' : v};`,
      background: (v: string) => `background: ${v};`,
      color: (v: string) => `color: ${v};`,
      fontSize: (v: any) => `font-size: ${typeof v === 'number' ? v + 'px' : v};`,
      fontWeight: (v: string) => `font-weight: ${v};`,
      textAlign: (v: string) => `text-align: ${v};`,
      padding: (v: any) => `padding: ${typeof v === 'number' ? v + 'px' : v};`,
      margin: (v: any) => `margin: ${typeof v === 'number' ? v + 'px' : v};`,
      shadow: (v: string) => `box-shadow: ${v};`,
    };
    
    return Object.entries(properties)
      .filter(([key]) => styleMap[key])
      .map(([key, value]) => styleMap[key](value))
      .join(' ');
  }
}

/**
 * توليد CSS للـ GUI
 */
export function generateGUICSS(): string {
  return `
/* أساسيات GUI */
.gui-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
}

.gui-text {
  font-family: 'Tajawal', sans-serif;
  line-height: 1.6;
}

.gui-button {
  font-family: 'Tajawal', sans-serif;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.gui-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.gui-input {
  font-family: 'Tajawal', sans-serif;
  padding: 10px 16px;
  border-radius: 8px;
  border: 2px solid #374151;
  background: #1f2937;
  color: white;
  font-size: 14px;
  width: 100%;
}

.gui-input:focus {
  outline: none;
  border-color: #10b981;
}

.gui-list {
  list-style: none;
  padding: 0;
}

.gui-list li {
  padding: 8px 12px;
  border-bottom: 1px solid #374151;
}

.gui-card {
  background: #1f2937;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.gui-card-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.gui-table {
  width: 100%;
  border-collapse: collapse;
}

.gui-table th, .gui-table td {
  padding: 12px;
  border: 1px solid #374151;
  text-align: right;
}

.gui-table th {
  background: #374151;
}

.gui-progress {
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.gui-progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.gui-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.gui-select {
  font-family: 'Tajawal', sans-serif;
  padding: 10px 16px;
  border-radius: 8px;
  border: 2px solid #374151;
  background: #1f2937;
  color: white;
  width: 100%;
}

.gui-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  -webkit-appearance: none;
  background: #374151;
}

.gui-tabs {
  display: flex;
  gap: 4px;
}

.gui-tab {
  padding: 10px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.gui-tab.active {
  border-bottom-color: #10b981;
  color: #10b981;
}
`;
}

// إنشاء مثيلات
export const guiParser = new GUIParser();
export const guiRenderer = new GUIRenderer();

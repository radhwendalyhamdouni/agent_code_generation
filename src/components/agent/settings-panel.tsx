'use client';

/**
 * لوحة الإعدادات - Settings Panel
 * إعدادات مزودي AI المجانيين مع التبديل التلقائي
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Key,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Zap,
  Settings,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAgentStore, AIProvider } from '@/lib/agent-store';

interface SettingsPanelProps {
  className?: string;
}

export function SettingsPanel({ className }: SettingsPanelProps) {
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const {
    aiProviders,
    currentProvider,
    setCurrentProvider,
    updateAIProvider,
    removeAIProvider,
    addAIProvider,
  } = useAgentStore();

  // Save API key
  const saveApiKey = (providerId: string) => {
    if (tempApiKey.trim()) {
      updateAIProvider(providerId, { apiKey: tempApiKey.trim() });
      setEditingProvider(null);
      setTempApiKey('');
    }
  };

  // Remove API key
  const removeApiKey = (providerId: string) => {
    updateAIProvider(providerId, { apiKey: '' });
  };

  // Test connection
  const testConnection = async (provider: AIProvider) => {
    if (!provider.apiKey) return;
    
    try {
      updateAIProvider(provider.id, { testing: true } as any);
      
      // Simulate test - in real app would make actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateAIProvider(provider.id, { 
        connected: true,
        usedToday: 0,
      } as any);
    } catch {
      updateAIProvider(provider.id, { connected: false } as any);
    } finally {
      updateAIProvider(provider.id, { testing: false } as any);
    }
  };

  // Get provider status
  const getProviderStatus = (provider: AIProvider) => {
    if (!provider.apiKey) return { label: 'غير مُعد', color: 'text-muted-foreground' };
    if ((provider.usedToday || 0) >= (provider.dailyLimit || 0)) {
      return { label: 'نفد الرصيد', color: 'text-red-400' };
    }
    return { label: 'متاح', color: 'text-green-400' };
  };

  // Add custom provider
  const handleAddProvider = () => {
    addAIProvider({
      name: 'مزود جديد',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      free: false,
      priority: aiProviders.length + 1,
    });
  };

  return (
    <div className={cn("h-full flex flex-col bg-background", className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">الإعدادات</span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {aiProviders.filter(p => p.apiKey).length}/{aiProviders.length} مفعل
        </Badge>
      </div>

      {/* Provider Selection */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <label className="text-xs text-muted-foreground mb-2 block">المزود النشط</label>
        <Select value={currentProvider} onValueChange={setCurrentProvider}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر المزود" />
          </SelectTrigger>
          <SelectContent>
            {aiProviders
              .filter(p => p.apiKey)
              .map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    <span>{provider.name}</span>
                    {provider.free && (
                      <Badge variant="outline" className="text-[10px] text-green-400">
                        مجاني
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground mt-1">
          التبديل التلقائي عند نفاد الرصيد مُفعّل
        </p>
      </div>

      {/* Providers List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {aiProviders.map((provider) => (
            <div
              key={provider.id}
              className={cn(
                "border rounded-lg transition-colors",
                currentProvider === provider.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/30"
              )}
            >
              {/* Provider Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => setExpandedProvider(
                  expandedProvider === provider.id ? null : provider.id
                )}
              >
                <div className="flex items-center gap-2">
                  <Zap className={cn(
                    "h-4 w-4",
                    provider.apiKey ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-medium text-sm">{provider.name}</span>
                  {provider.free && (
                    <Badge variant="outline" className="text-[10px] text-green-400 border-green-400/30">
                      مجاني
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", getProviderStatus(provider).color)}>
                    {getProviderStatus(provider).label}
                  </Badge>
                  {expandedProvider === provider.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Provider Details */}
              {expandedProvider === provider.id && (
                <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                  {/* Model */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">النموذج</label>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded">
                      {provider.model}
                    </code>
                  </div>

                  {/* Usage */}
                  {provider.dailyLimit && (
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">
                        الاستخدام اليومي
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              (provider.usedToday || 0) >= (provider.dailyLimit || 0)
                                ? "bg-red-500"
                                : (provider.usedToday || 0) > (provider.dailyLimit || 0) * 0.8
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            )}
                            style={{ 
                              width: `${Math.min(100, ((provider.usedToday || 0) / (provider.dailyLimit || 1)) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {provider.usedToday || 0}/{provider.dailyLimit}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* API Key */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      مفتاح API
                    </label>
                    {editingProvider === provider.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={tempApiKey}
                          onChange={(e) => setTempApiKey(e.target.value)}
                          placeholder="أدخل مفتاح API"
                          className="text-xs h-8"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => saveApiKey(provider.id)}
                          disabled={!tempApiKey.trim()}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => { setEditingProvider(null); setTempApiKey(''); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {provider.apiKey ? (
                          <>
                            <code className="text-xs bg-muted/50 px-2 py-1 rounded flex-1">
                              ••••••••{provider.apiKey.slice(-4)}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => { setEditingProvider(provider.id); setTempApiKey(''); }}
                            >
                              تغيير
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-red-400"
                              onClick={() => removeApiKey(provider.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-full"
                            onClick={() => { setEditingProvider(provider.id); setTempApiKey(''); }}
                          >
                            <Key className="h-3 w-3 ml-1" />
                            إضافة مفتاح
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      الأولوية ({provider.priority})
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(p => (
                        <Button
                          key={p}
                          size="sm"
                          variant={provider.priority === p ? "default" : "outline"}
                          className="h-6 w-6 p-0 text-[10px]"
                          onClick={() => updateAIProvider(provider.id, { priority: p })}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>التبديل التلقائي</span>
          <Switch defaultChecked />
        </div>
        <p className="text-[10px] text-muted-foreground">
          عند نفاد رصيد مزود، ينتقل تلقائياً للمزود التالي حسب الأولوية
        </p>
      </div>
    </div>
  );
}

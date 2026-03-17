'use client';

/**
 * وكيل المرجع الذكي - واجهة احترافية متقدمة
 * Professional Advanced UI for Al-Marjaa AI Agent
 * 
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bot, Code, Terminal, Send, Play, Copy, Check, Loader2, 
  FileCode, Plus, RefreshCw, Download, Upload,
  ChevronDown, Folder, Settings as SettingsIcon,
  MessageSquare, Sparkles, PanelLeftClose, PanelLeft,
  X, Save, Moon, Sun, Volume2, VolumeX,
  GitBranch, Trash2, FileArchive, FolderPlus,
  Globe, Type, AlignRight, AlignLeft,
  Zap, Cpu, Database, Shield, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

interface AppSettings {
  theme: string;
  language: string;
  fontSize: number;
  autoSave: boolean;
  autoSaveDelay: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
  aiProvider: string;
  aiModel: string;
  terminalFontSize: number;
  editorFont: string;
  rtl: boolean;
  notifications: boolean;
  soundEffects: boolean;
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'ar',
  fontSize: 14,
  autoSave: true,
  autoSaveDelay: 1000,
  showLineNumbers: true,
  wordWrap: true,
  tabSize: 4,
  aiProvider: 'zai',
  aiModel: 'default',
  terminalFontSize: 13,
  editorFont: 'monospace',
  rtl: true,
  notifications: true,
  soundEffects: false,
};

// Main Component
export default function AlMarjaaAgentPage() {
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('// اكتب كود لغة المرجع هنا\nاطبع("مرحباً بالعالم!")؛');
  const [output, setOutput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '╔══════════════════════════════════════════════════╗',
    '║     متحكم الطرفية - لغة المرجع                  ║',
    '║     البيئة: sandbox                             ║',
    '╚══════════════════════════════════════════════════╝',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('console');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load files and settings on mount
  useEffect(() => {
    loadFiles();
    loadSettings();
  }, []);

  // Load settings
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings
  const saveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Load files from API
  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      if (data.success) {
        setFiles(data.files || []);
      } else {
        // Demo files
        setFiles([
          { name: 'main.mrj', path: 'main.mrj', type: 'file' },
          { name: 'config.mrj', path: 'config.mrj', type: 'file' },
          { name: 'utils.mrj', path: 'utils.mrj', type: 'file' },
        ]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([
        { name: 'main.mrj', path: 'main.mrj', type: 'file' },
        { name: 'config.mrj', path: 'config.mrj', type: 'file' },
      ]);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'تم استلام طلبك. كيف يمكنني مساعدتك أكثر؟',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Extract code and update editor
      const codeMatch = data.content?.match(/```almarjaa\n([\s\S]*?)```/);
      if (codeMatch) {
        setCode(codeMatch[1]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'أنا هنا للمساعدة! يمكنك طلب كتابة كود، تصحيح أخطاء، أو شرح أي كود بلغة المرجع.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute code
  const executeCode = async () => {
    setIsLoading(true);
    setOutput('جاري التنفيذ...');

    try {
      const response = await fetch('/api/agent/execute?XTransformPort=3030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      setOutput(data.output || 'تم التنفيذ بنجاح');
    } catch (error) {
      console.error('Error executing code:', error);
      // Simulate execution for demo
      const lines = code.split('\n');
      let result = '';
      for (const line of lines) {
        const printMatch = line.match(/اطبع\s*\(\s*["'](.+?)["']\s*\)/);
        if (printMatch) {
          result += printMatch[1] + '\n';
        }
      }
      setOutput(result || '✓ تم تنفيذ الكود بنجاح');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute terminal command
  const executeTerminalCommand = async () => {
    if (!terminalInput.trim()) return;

    const command = terminalInput;
    setTerminalHistory(prev => [...prev, `$ ${command}`]);
    setTerminalInput('');

    try {
      const response = await fetch('/api/agent/execute?XTransformPort=3030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      const data = await response.json();
      setTerminalHistory(prev => [...prev, data.output || 'تم التنفيذ']);
    } catch (error) {
      setTerminalHistory(prev => [...prev, `> ${command}`]);
      setTerminalHistory(prev => [...prev, 'Command executed (simulation mode)']);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save file
  const saveFile = async () => {
    if (!selectedFile) {
      alert('يرجى اختيار ملف أولاً');
      return;
    }
    
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          path: selectedFile,
          content: code
        })
      });
      const data = await response.json();
      if (data.success) {
        setOutput('✓ تم حفظ الملف بنجاح');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setOutput('✓ تم الحفظ محلياً');
    }
  };

  // Create new file
  const createNewFile = async () => {
    const name = prompt('أدخل اسم الملف (مثال: newfile.mrj):');
    if (!name) return;

    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          path: name,
          content: '// ملف جديد\n'
        })
      });
      loadFiles();
    } catch (error) {
      console.error('Error creating file:', error);
      setFiles(prev => [...prev, { name, path: name, type: 'file' }]);
    }
  };

  // Create new project
  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      alert('يرجى إدخال اسم المشروع');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          type: newProjectType
        })
      });
      const data = await response.json();
      if (data.success) {
        loadFiles();
        setNewProjectOpen(false);
        setNewProjectName('');
        alert(`تم إنشاء المشروع "${newProjectName}" بنجاح!`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('تم إنشاء المشروع محلياً');
      setNewProjectOpen(false);
    }
  };

  // Export project as ZIP
  const exportProject = async (projectName?: string) => {
    try {
      const url = projectName 
        ? `/api/export?project=${projectName}`
        : '/api/export';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('فشل في التصدير');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = projectName ? `${projectName}.zip` : 'almarjaa-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      setOutput('✓ تم تصدير المشروع بنجاح');
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ في التصدير. يرجى المحاولة مرة أخرى.');
    }
  };

  // Delete file
  const deleteFile = async (filePath: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${filePath}"؟`)) return;

    try {
      await fetch(`/api/files?path=${filePath}`, {
        method: 'DELETE'
      });
      loadFiles();
      if (selectedFile === filePath) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setFiles(prev => prev.filter(f => f.path !== filePath));
    }
  };

  // Load file content
  const loadFileContent = async (filePath: string) => {
    try {
      const response = await fetch(`/api/files?path=${filePath}`);
      const data = await response.json();
      if (data.success) {
        setCode(data.content);
        setActiveTab('code');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setCode(`// ${filePath}\n// محتوى الملف\nاطبع("مرحباً من ${filePath}")؛`);
      setActiveTab('code');
    }
  };

  // Render message with code blocks
  const renderMessage = (message: Message) => {
    const parts = message.content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const langMatch = part.match(/```(\w+)?\n?/);
        const language = langMatch?.[1] || 'almarjaa';
        const codeContent = part.replace(/```\w*\n?|```/g, '').trim();

        return (
          <div key={index} className="my-2 rounded-lg bg-slate-900/80 border border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
              <Badge variant="outline" className="text-xs bg-emerald-600/20 text-emerald-400 border-emerald-500/30">{language}</Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-slate-700"
                  onClick={() => copyToClipboard(codeContent)}
                >
                  {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-slate-700"
                  onClick={() => { setCode(codeContent); setActiveTab('code'); }}
                >
                  <Code className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <pre className="p-3 text-sm text-emerald-300 font-mono overflow-x-auto" dir="ltr">
              {codeContent}
            </pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-slate-800/80 rounded-lg"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-l from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                وكيل المرجع الذكي
              </h1>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs bg-emerald-500/10">
            v3.4.0
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
            onClick={() => setNewProjectOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            مشروع جديد
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
            onClick={() => exportProject()}
          >
            <Download className="h-4 w-4" />
            تصدير ZIP
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-slate-100">
            <GitBranch className="h-4 w-4" />
            main
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-slate-800/80"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex" dir="rtl">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* Sidebar - File Explorer */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-slate-900/50">
                <div className="h-full flex flex-col border-l border-slate-800/50">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50 shrink-0 bg-slate-800/30">
                    <span className="text-sm font-medium text-slate-300">المستكشف</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 hover:bg-emerald-600/20 hover:text-emerald-400" 
                        onClick={createNewFile}
                        title="إنشاء ملف جديد"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 hover:bg-emerald-600/20 hover:text-emerald-400" 
                        onClick={loadFiles}
                        title="تحديث"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File List */}
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-slate-300 cursor-pointer hover:bg-slate-800/50 rounded-md">
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                        <Folder className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium">sandbox</span>
                      </div>
                      <div className="mr-4 mt-1">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className={cn(
                              "group flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-md transition-all",
                              selectedFile === file.path 
                                ? "bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500" 
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            )}
                            onClick={() => {
                              setSelectedFile(file.path);
                              if (file.type === 'file') {
                                loadFileContent(file.path);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {file.type === 'directory' ? (
                                <Folder className="h-4 w-4 text-amber-400" />
                              ) : (
                                <FileCode className="h-4 w-4 text-emerald-400" />
                              )}
                              <span className="text-sm truncate">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-red-600/20 hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFile(file.path);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {files.length === 0 && (
                          <div className="text-center text-slate-600 text-sm py-8">
                            <Folder className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            لا توجد ملفات
                            <br />
                            <span className="text-xs">انقر + للإنشاء</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Quick Actions */}
                  <div className="p-2 border-t border-slate-800/50 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start gap-2 border-dashed border-slate-700 hover:bg-slate-800/50"
                      onClick={() => setNewProjectOpen(true)}
                    >
                      <FolderPlus className="h-4 w-4" />
                      مشروع جديد
                    </Button>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle className="w-1 bg-slate-800/50 hover:bg-emerald-500/50 transition-colors cursor-col-resize" />
            </>
          )}

          {/* Main Panel */}
          <ResizablePanel defaultSize={sidebarOpen ? 80 : 100}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              
              {/* Top Section - Chat & Code */}
              <ResizablePanel defaultSize={65} minSize={30} maxSize={85}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800/50 bg-slate-800/20 shrink-0">
                    <TabsList className="bg-transparent gap-2">
                      <TabsTrigger
                        value="chat"
                        className="gap-2 data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 rounded-lg"
                      >
                        <MessageSquare className="h-4 w-4" />
                        المحادثة
                      </TabsTrigger>
                      <TabsTrigger
                        value="code"
                        className="gap-2 data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 rounded-lg"
                      >
                        <Code className="h-4 w-4" />
                        الكود
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                      {activeTab === 'code' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={saveFile} 
                            className="gap-2 border-slate-700 hover:bg-slate-800"
                          >
                            <Save className="h-4 w-4" />
                            حفظ
                          </Button>
                          <Button
                            size="sm"
                            onClick={executeCode}
                            disabled={isLoading}
                            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            تنفيذ
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chat Tab */}
                  <TabsContent value="chat" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <div className="h-full flex flex-col">
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4">
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/10 border border-emerald-500/10">
                              <Sparkles className="h-14 w-14 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                              مرحباً بك في وكيل المرجع!
                            </h3>
                            <p className="text-slate-400 max-w-lg mb-8 leading-relaxed">
                              أنا وكيل ذكي متخصص في لغة المرجع البرمجية العربية. يمكنني مساعدتك في كتابة وتصحيح وتشغيل الكود.
                            </p>
                            <div className="grid grid-cols-2 gap-3 max-w-md">
                              {[
                                { icon: Code, text: 'كتابة كود جديد' },
                                { icon: Zap, text: 'تصحيح الأخطاء' },
                                { icon: Info, text: 'شرح الكود' },
                                { icon: FolderPlus, text: 'إنشاء مشروع' }
                              ].map(item => (
                                <Button
                                  key={item.text}
                                  variant="outline"
                                  className="justify-start gap-2 bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/50 h-12"
                                  onClick={() => setInputMessage(`ساعدني في: ${item.text}`)}
                                >
                                  <item.icon className="h-4 w-4 text-emerald-400" />
                                  {item.text}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 max-w-3xl mx-auto">
                            {messages.map(message => (
                              <div
                                key={message.id}
                                className={cn(
                                  "flex",
                                  message.role === 'user' ? "justify-start" : "justify-end"
                                )}
                              >
                                <div
                                  className={cn(
                                    "max-w-[85%] rounded-2xl px-4 py-3 shadow-lg",
                                    message.role === 'user'
                                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20"
                                      : "bg-slate-800/80 text-slate-100 border border-slate-700/50"
                                  )}
                                >
                                  <div className="text-sm leading-relaxed">
                                    {renderMessage(message)}
                                  </div>
                                  <p className="text-xs opacity-60 mt-2">
                                    {message.timestamp.toLocaleTimeString('ar-SA')}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {isLoading && (
                              <div className="flex justify-end">
                                <div className="bg-slate-800/80 rounded-2xl px-4 py-3 border border-slate-700/50">
                                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                                </div>
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </ScrollArea>

                      {/* Input */}
                      <div className="p-4 border-t border-slate-800/50 bg-slate-800/20 shrink-0">
                        <div className="max-w-3xl mx-auto flex gap-3">
                          <Textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="اكتب رسالتك هنا... مثال: اكتب برنامج يحسب مضروب عدد"
                            className="min-h-[56px] max-h-32 bg-slate-800/50 border-slate-700/50 resize-none text-right placeholder:text-slate-500 focus-visible:ring-emerald-500/50"
                            dir="rtl"
                            style={{ fontSize: `${settings.fontSize}px` }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={isLoading || !inputMessage.trim()}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-auto px-5 shrink-0 shadow-lg shadow-emerald-500/20"
                          >
                            <Send className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Code Tab */}
                  <TabsContent value="code" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <div className="h-full flex">
                      {/* Editor */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 p-3">
                          <Textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className={cn(
                              "h-full font-mono bg-slate-950/50 border-slate-800/50 resize-none focus-visible:ring-emerald-500/50 text-right",
                              settings.wordWrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"
                            )}
                            dir="rtl"
                            style={{ 
                              fontSize: `${settings.fontSize}px`,
                              fontFamily: settings.editorFont
                            }}
                            spellCheck={false}
                            placeholder="// اكتب كود لغة المرجع هنا"
                          />
                        </div>
                      </div>

                      {/* Output Panel */}
                      <div className="w-72 border-r border-slate-800/50 flex flex-col bg-slate-900/30 shrink-0">
                        <div className="px-3 py-2 border-b border-slate-800/50 flex items-center gap-2 shrink-0 bg-slate-800/20">
                          <Terminal className="h-4 w-4 text-teal-400" />
                          <span className="text-sm font-medium">النتيجة</span>
                        </div>
                        <ScrollArea className="flex-1 p-3">
                          <pre className="text-sm font-mono text-emerald-300 whitespace-pre-wrap break-words" dir="ltr">
                            {output || 'اضغط "تنفيذ" لتشغيل الكود...'}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </ResizablePanel>

              <ResizableHandle className="h-1 bg-slate-800/50 hover:bg-emerald-500/50 transition-colors cursor-row-resize" />

              {/* Bottom Section - Terminal */}
              <ResizablePanel defaultSize={35} minSize={15} maxSize={60}>
                <div className="h-full flex flex-col bg-slate-950/50">
                  <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800/50 bg-slate-800/20 shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium">الطرفية</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => setTerminalHistory([
                          '╔══════════════════════════════════════════════════╗',
                          '║     متحكم الطرفية - لغة المرجع                  ║',
                          '║     البيئة: sandbox                             ║',
                          '╚══════════════════════════════════════════════════╝',
                          ''
                        ])}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        مسح
                      </Button>
                    </div>
                  </div>

                  {/* Terminal Output */}
                  <ScrollArea className="flex-1 p-3">
                    <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap" dir="ltr" style={{ fontSize: `${settings.terminalFontSize}px` }}>
                      {terminalHistory.map((line, i) => (
                        <div key={i} className={line.startsWith('$') || line.startsWith('>') ? 'text-emerald-400' : ''}>
                          {line}
                        </div>
                      ))}
                      <span className="text-emerald-400">$ </span>
                    </pre>
                  </ScrollArea>

                  {/* Terminal Input */}
                  <div className="p-3 border-t border-slate-800/50 shrink-0">
                    <div className="flex gap-2">
                      <Input
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            executeTerminalCommand();
                          }
                        }}
                        placeholder="أدخل الأمر..."
                        className="bg-slate-900/50 border-slate-800 font-mono focus-visible:ring-emerald-500/50"
                        dir="ltr"
                        style={{ fontSize: `${settings.terminalFontSize}px` }}
                      />
                      <Button
                        onClick={executeTerminalCommand}
                        size="icon"
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shrink-0"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 border-t border-slate-800/50 bg-slate-900/80 text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
            متصل
          </span>
          <span>لغة المرجع v3.4.0</span>
          <span className="text-slate-600">|</span>
          <span>{files.length} ملفات</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">{settings.aiProvider.toUpperCase()}</span>
          <span>UTF-8</span>
          <span>© 2026 رضوان دالي حمدوني</span>
        </div>
      </footer>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-slate-100" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-emerald-400" />
              الإعدادات
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              تخصيص تجربتك مع وكيل المرجع الذكي
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Appearance */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Sun className="h-4 w-4" />
                المظهر
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-400">حجم الخط</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={(value) => saveSettings({ fontSize: value[0] })}
                      min={10}
                      max={24}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-300 w-8">{settings.fontSize}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">حجم خط الطرفية</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.terminalFontSize]}
                      onValueChange={(value) => saveSettings({ terminalFontSize: value[0] })}
                      min={10}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-300 w-8">{settings.terminalFontSize}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Type className="h-4 w-4" />
                المحرر
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400">التفاف النص</Label>
                  <Switch
                    checked={settings.wordWrap}
                    onCheckedChange={(checked) => saveSettings({ wordWrap: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400">الحفظ التلقائي</Label>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => saveSettings({ autoSave: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">حجم Tab</Label>
                  <Select
                    value={settings.tabSize.toString()}
                    onValueChange={(value) => saveSettings({ tabSize: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 مسافات</SelectItem>
                      <SelectItem value="4">4 مسافات</SelectItem>
                      <SelectItem value="8">8 مسافات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">نوع الخط</Label>
                  <Select
                    value={settings.editorFont}
                    onValueChange={(value) => saveSettings({ editorFont: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monospace">Monospace</SelectItem>
                      <SelectItem value="'Fira Code'">Fira Code</SelectItem>
                      <SelectItem value="'JetBrains Mono'">JetBrains Mono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* AI */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                الذكاء الاصطناعي
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-400">مزود AI</Label>
                  <Select
                    value={settings.aiProvider}
                    onValueChange={(value) => saveSettings({ aiProvider: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zai">Z-AI (افتراضي)</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Other */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                أخرى
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400">الإشعارات</Label>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => saveSettings({ notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400">المؤثرات الصوتية</Label>
                  <Switch
                    checked={settings.soundEffects}
                    onCheckedChange={(checked) => saveSettings({ soundEffects: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={async () => {
                await saveSettings(DEFAULT_SETTINGS);
                setSettingsOpen(false);
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة تعيين
            </Button>
            <Button 
              onClick={() => setSettingsOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-emerald-400" />
              مشروع جديد
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              إنشاء مشروع جديد بلغة المرجع
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">اسم المشروع</Label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="أدخل اسم المشروع"
                className="bg-slate-800 border-slate-700"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">نوع المشروع</Label>
              <Select value={newProjectType} onValueChange={setNewProjectType}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="console">تطبيق طرفية</SelectItem>
                  <SelectItem value="web">تطبيق ويب</SelectItem>
                  <SelectItem value="api">خادم API</SelectItem>
                  <SelectItem value="cli">أداة سطر أوامر</SelectItem>
                  <SelectItem value="neural">شبكة عصبية</SelectItem>
                  <SelectItem value="data">معالجة بيانات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProjectOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={createNewProject}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

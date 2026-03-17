'use client';

/**
 * مستعرض الملفات - File Viewer
 * عرض الملفات والأكواد مع إمكانية التنفيذ والمعاينة
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  FileCode,
  FolderOpen,
  Play,
  Copy,
  Check,
  Download,
  Eye,
  Code,
  Terminal,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAgentStore, ProjectFile } from '@/lib/agent-store';

interface FileViewerProps {
  className?: string;
}

export function FileViewer({ className }: FileViewerProps) {
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'output'>('code');
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<{ success: boolean; content: string } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

  const { files, setFiles } = useAgentStore();

  // Fetch files from sandbox
  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/agent/task');
      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          setFiles(data.files.map((f: { path: string; content: string; language: string }) => ({
            name: f.path.split('/').pop() || f.path,
            path: f.path,
            type: 'file' as const,
            content: f.content,
            language: f.language || 'almarjaa',
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  }, [setFiles]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Build file tree
  const buildFileTree = (files: ProjectFile[]) => {
    const tree: Map<string, ProjectFile[]> = new Map();
    
    files.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length === 1) {
        // Root file
        if (!tree.has('')) tree.set('', []);
        tree.get('')!.push(file);
      } else {
        const folder = parts[0];
        if (!tree.has(folder)) tree.set(folder, []);
        tree.get(folder)!.push(file);
      }
    });
    
    return tree;
  };

  const fileTree = buildFileTree(files);

  // Toggle folder
  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  // Copy to clipboard
  const copyCode = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Execute code
  const executeCode = async () => {
    if (!selectedFile?.content) return;
    
    setExecuting(true);
    setOutput(null);
    setActiveTab('output');
    
    try {
      const response = await fetch('/api/agent/execute-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: selectedFile.content, 
          language: selectedFile.language || 'almarjaa' 
        }),
      });
      
      const result = await response.json();
      setOutput({
        success: result.success,
        content: result.success ? result.output : result.error || 'خطأ في التنفيذ'
      });
    } catch (error: any) {
      setOutput({
        success: false,
        content: error.message || 'خطأ في الاتصال'
      });
    } finally {
      setExecuting(false);
    }
  };

  // Download file
  const downloadFile = () => {
    if (!selectedFile) return;
    
    const blob = new Blob([selectedFile.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download all files
  const downloadAll = async () => {
    try {
      const response = await fetch('/api/agent/task?action=download');
      if (!response.ok) throw new Error('فشل التنزيل');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'almarjaa-project.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Get language for syntax highlighter
  const getLanguage = (lang: string) => {
    const map: Record<string, string> = {
      almarjaa: 'javascript',
      javascript: 'javascript',
      typescript: 'typescript',
      json: 'json',
      markdown: 'markdown',
    };
    return map[lang] || 'text';
  };

  return (
    <div className={cn("h-full flex flex-col bg-background", className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">الملفات ({files.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={fetchFiles}
          >
            <RefreshCw className="h-3 w-3 ml-1" />
            تحديث
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={downloadAll}
            disabled={files.length === 0}
          >
            <Download className="h-3 w-3 ml-1" />
            تنزيل الكل
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-64 border-l border-border shrink-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              {files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  لا توجد ملفات
                  <br />
                  <span className="text-xs">أنشئ مشروعاً جديداً</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Root files */}
                  {fileTree.get('')?.map(file => (
                    <FileItem
                      key={file.path}
                      file={file}
                      selected={selectedFile?.path === file.path}
                      onClick={() => {
                        setSelectedFile(file);
                        setActiveTab('code');
                        setOutput(null);
                      }}
                    />
                  ))}
                  
                  {/* Folders */}
                  {Array.from(fileTree.entries())
                    .filter(([folder]) => folder !== '')
                    .map(([folder, folderFiles]) => (
                      <div key={folder}>
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 text-sm text-right"
                          onClick={() => toggleFolder(folder)}
                        >
                          {expandedFolders.has(folder) ? (
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          ) : (
                            <ChevronRight className="h-3 w-3 shrink-0" />
                          )}
                          <Folder className="h-4 w-4 text-yellow-400 shrink-0" />
                          <span className="truncate">{folder}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {folderFiles.length}
                          </Badge>
                        </button>
                        
                        {expandedFolders.has(folder) && (
                          <div className="mr-4 mt-1 space-y-1">
                            {folderFiles.map(file => (
                              <FileItem
                                key={file.path}
                                file={file}
                                selected={selectedFile?.path === file.path}
                                onClick={() => {
                                  setSelectedFile(file);
                                  setActiveTab('code');
                                  setOutput(null);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* File Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedFile.language || 'almarjaa'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="h-7">
                      <TabsTrigger value="code" className="text-xs px-2 h-6">
                        <Code className="h-3 w-3 ml-1" />
                        الكود
                      </TabsTrigger>
                      <TabsTrigger value="output" className="text-xs px-2 h-6">
                        <Terminal className="h-3 w-3 ml-1" />
                        النتيجة
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={executeCode}
                    disabled={executing}
                  >
                    {executing ? (
                      <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3 ml-1" />
                    )}
                    تشغيل
                  </Button>
                  
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
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={downloadFile}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* File Content */}
              <ScrollArea className="flex-1">
                {activeTab === 'code' && (
                  <div className="relative" dir="rtl">
                    <pre className="p-4 text-sm overflow-x-auto" style={{ direction: 'rtl', textAlign: 'right' }}>
                      <code className="language-almarjaa">
                        <SyntaxHighlighter
                          language={getLanguage(selectedFile.language || 'almarjaa')}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            background: 'transparent',
                            minHeight: '100%',
                            direction: 'rtl',
                            textAlign: 'right',
                          }}
                          showLineNumbers
                          lineNumberStyle={{
                            direction: 'ltr',
                            minWidth: '2.5em',
                            paddingRight: '1em',
                            color: '#6b7280',
                          }}
                        >
                          {selectedFile.content || '// ملف فارغ'}
                        </SyntaxHighlighter>
                      </code>
                    </pre>
                  </div>
                )}

                {activeTab === 'output' && (
                  <div className="p-4">
                    {output ? (
                      <div className={cn(
                        "p-4 rounded-lg border font-mono text-sm",
                        output.success 
                          ? "bg-green-500/5 border-green-500/30 text-green-400"
                          : "bg-red-500/5 border-red-500/30 text-red-400"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {output.success ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="font-medium">
                            {output.success ? 'تم التنفيذ بنجاح' : 'خطأ في التنفيذ'}
                          </span>
                        </div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {output.content}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Play className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">اضغط "تشغيل" لتنفيذ الكود</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">اختر ملفاً لعرض محتواه</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// File Item Component
function FileItem({ 
  file, 
  selected, 
  onClick 
}: { 
  file: ProjectFile; 
  selected: boolean; 
  onClick: () => void;
}) {
  const getIcon = () => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mrj':
        return <FileCode className="h-4 w-4 text-emerald-400" />;
      case 'js':
      case 'ts':
        return <FileCode className="h-4 w-4 text-yellow-400" />;
      case 'json':
        return <FileCode className="h-4 w-4 text-blue-400" />;
      case 'md':
        return <FileText className="h-4 w-4 text-slate-400" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <button
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-right transition-colors",
        selected 
          ? "bg-primary/20 text-primary" 
          : "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      {getIcon()}
      <span className="truncate">{file.name}</span>
    </button>
  );
}

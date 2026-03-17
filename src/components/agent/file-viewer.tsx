'use client';

/**
 * مستعرض الملفات - File Viewer
 * عرض الملفات والأكواد مع إمكانية التنفيذ والمعاينة والتحرير
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  FileCode,
  FolderOpen,
  Play,
  Copy,
  Check,
  Download,
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
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAgentStore, ProjectFile } from '@/lib/agent-store';

interface FileViewerProps {
  className?: string;
}

// Custom Al-Marjaa syntax highlighting style
const almarjaaStyle = {
  ...vscDarkPlus,
  'comment': { color: '#6A9955', fontStyle: 'italic' },
  'keyword': { color: '#C586C0' },
  'string': { color: '#CE9178' },
  'function': { color: '#DCDCAA' },
  'number': { color: '#B5CEA8' },
};

export function FileViewer({ className }: FileViewerProps) {
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'output'>('code');
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<{ success: boolean; content: string } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { files, setFiles, deleteFile, renameFile } = useAgentStore();

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

  // Build file tree with unique keys
  const buildFileTree = (files: ProjectFile[]) => {
    const tree: Map<string, ProjectFile[]> = new Map();
    
    // Remove duplicates first
    const uniqueFiles = files.reduce((acc: ProjectFile[], file) => {
      if (!acc.find(f => f.path === file.path)) {
        acc.push(file);
      }
      return acc;
    }, []);
    
    uniqueFiles.forEach(file => {
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

  // Start editing file
  const startEdit = (file: ProjectFile) => {
    setEditingFile(file.path);
    setEditContent(file.content || '');
  };

  // Save edit
  const saveEdit = () => {
    if (selectedFile && editingFile) {
      // Update the file content in the store
      const updatedFiles = files.map(f => 
        f.path === editingFile ? { ...f, content: editContent } : f
      );
      setFiles(updatedFiles);
      setSelectedFile({ ...selectedFile, content: editContent });
      setEditingFile(null);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingFile(null);
    setEditContent('');
  };

  // Open rename dialog
  const openRenameDialog = (file: ProjectFile) => {
    setRenameValue(file.name.replace(/\.[^/.]+$/, ''));
    setRenameDialogOpen(true);
  };

  // Handle rename
  const handleRename = () => {
    if (selectedFile && renameValue.trim()) {
      renameFile(selectedFile.path, renameValue.trim());
      setRenameDialogOpen(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (path: string) => {
    setFileToDelete(path);
    setDeleteDialogOpen(true);
  };

  // Handle delete
  const handleDelete = () => {
    if (fileToDelete) {
      deleteFile(fileToDelete);
      if (selectedFile?.path === fileToDelete) {
        setSelectedFile(null);
      }
      setDeleteDialogOpen(false);
      setFileToDelete(null);
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

  // Generate unique key for file
  const getFileKey = (file: ProjectFile, index: number, prefix: string = '') => {
    return `file-${prefix}-${index}-${file.path}`;
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
                  {fileTree.get('')?.map((file, idx) => (
                    <FileItem
                      key={getFileKey(file, idx, 'root')}
                      file={file}
                      selected={selectedFile?.path === file.path}
                      onClick={() => {
                        setSelectedFile(file);
                        setActiveTab('code');
                        setOutput(null);
                        setEditingFile(null);
                      }}
                      onDelete={() => openDeleteDialog(file.path)}
                      onRename={() => openRenameDialog(file)}
                    />
                  ))}
                  
                  {/* Folders */}
                  {Array.from(fileTree.entries())
                    .filter(([folder]) => folder !== '')
                    .map(([folder, folderFiles], folderIdx) => (
                      <div key={`folder-${folderIdx}-${folder}`}>
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
                            {folderFiles.map((file, idx) => (
                              <FileItem
                                key={getFileKey(file, idx, folder)}
                                file={file}
                                selected={selectedFile?.path === file.path}
                                onClick={() => {
                                  setSelectedFile(file);
                                  setActiveTab('code');
                                  setOutput(null);
                                  setEditingFile(null);
                                }}
                                onDelete={() => openDeleteDialog(file.path)}
                                onRename={() => openRenameDialog(file)}
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
                  
                  {/* Edit/Save buttons */}
                  {editingFile === selectedFile.path ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs bg-green-500/10 text-green-400"
                        onClick={saveEdit}
                      >
                        <Save className="h-3 w-3 ml-1" />
                        حفظ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={cancelEdit}
                      >
                        <X className="h-3 w-3 ml-1" />
                        إلغاء
                      </Button>
                    </>
                  ) : (
                    <>
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
                        className="h-7 px-2 text-xs"
                        onClick={() => startEdit(selectedFile)}
                      >
                        <Edit2 className="h-3 w-3 ml-1" />
                        تعديل
                      </Button>
                    </>
                  )}
                  
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
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                    onClick={() => openDeleteDialog(selectedFile.path)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* File Content */}
              <ScrollArea className="flex-1">
                {activeTab === 'code' && (
                  editingFile === selectedFile.path ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full min-h-[400px] p-4 bg-transparent text-sm font-mono resize-none focus:outline-none"
                      style={{ direction: 'rtl', textAlign: 'right' }}
                      dir="rtl"
                    />
                  ) : (
                    <div className="relative" dir="rtl">
                      <pre className="p-4 text-sm overflow-x-auto" style={{ direction: 'rtl', textAlign: 'right' }}>
                        <code className="language-almarjaa">
                          <SyntaxHighlighter
                            language={getLanguage(selectedFile.language || 'almarjaa')}
                            style={almarjaaStyle}
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
                  )
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
                        <pre className="whitespace-pre-wrap text-xs" dir="rtl">
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

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعادة تسمية الملف</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="اسم الملف الجديد"
              className="text-right"
              dir="rtl"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleRename}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف الملف</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// File Item Component
function FileItem({ 
  file, 
  selected, 
  onClick,
  onDelete,
  onRename,
}: { 
  file: ProjectFile; 
  selected: boolean; 
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

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
    <div 
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
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
        <span className="truncate flex-1">{file.name}</span>
      </button>
      
      {/* Quick actions */}
      {showActions && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-background rounded">
          <button
            className="p-1 hover:bg-muted/50 rounded text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            title="إعادة تسمية"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="حذف"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * مدير الملفات - يحفظ الملفات فعلياً على الخادم
 * File manager with real file system operations
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronLeft,
  ChevronDown,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Download,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { useAgentStore, ProjectFile } from '@/lib/agent-store';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Language mapping
const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() || 'text';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    mrj: 'almarjaa',
    json: 'json',
    md: 'markdown',
    txt: 'text',
  };
  return langMap[ext] || ext;
};

// File icon component
function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'mrj'].includes(ext || '')) {
    return <FileCode className={cn("text-primary", className)} />;
  }
  if (['md', 'txt', 'log'].includes(ext || '')) {
    return <FileText className={cn("text-blue-400", className)} />;
  }
  return <File className={cn("text-muted-foreground", className)} />;
}

export function FileManager() {
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    files,
    setFiles,
    selectedFile,
    setSelectedFile,
    updateFileContent,
    toggleFolder,
  } = useAgentStore();

  // Load files from server on mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Get selected file data
  const selectedFileData = findFile(files, selectedFile);

  // Load files from API
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          setFiles(data.files.map((f: any) => ({
            name: f.name || f.path.split('/').pop(),
            path: f.path,
            type: 'file' as const,
            content: f.content,
            language: f.language || 'text',
          })));
        }
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [setFiles]);

  // Handle file selection
  const handleSelectFile = useCallback((path: string, content?: string) => {
    setSelectedFile(path);
    if (content !== undefined) {
      setEditorContent(content);
    }
  }, [setSelectedFile]);

  // Create new file on server
  const handleCreateFile = useCallback(async () => {
    if (!newFileName.trim()) return;

    const fileName = newFileName.includes('.') ? newFileName : `${newFileName}.mrj`;
    
    // Check for duplicates locally
    if (files.some(f => f.path === fileName)) {
      alert('الملف موجود مسبقاً');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          path: fileName,
          name: fileName,
          content: '// ملف جديد\nاطبع("مرحباً!")؛\n',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Add to local state
        const newFile: ProjectFile = {
          name: fileName,
          path: fileName,
          type: 'file',
          content: '// ملف جديد\nاطبع("مرحباً!")؛\n',
          language: getLanguageFromPath(fileName),
        };
        
        setFiles([...files, newFile]);
        handleSelectFile(fileName, newFile.content);
        setNewFileName('');
        setIsNewFileDialogOpen(false);
      } else {
        alert(result.error || 'فشل إنشاء الملف');
      }
    } catch (error: any) {
      console.error('Create file error:', error);
      alert('حدث خطأ أثناء إنشاء الملف');
    } finally {
      setSaving(false);
    }
  }, [newFileName, files, setFiles, handleSelectFile]);

  // Delete file from server
  const handleDeleteFile = useCallback(async (filePath: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${filePath}"؟`)) return;

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setFiles(files.filter(f => f.path !== filePath));
        if (selectedFile === filePath) {
          setSelectedFile(null);
        }
      } else {
        alert(result.error || 'فشل حذف الملف');
      }
    } catch (error) {
      console.error('Delete file error:', error);
      alert('حدث خطأ أثناء حذف الملف');
    }
  }, [files, setFiles, selectedFile, setSelectedFile]);

  // Save file content to server
  const handleSaveContent = useCallback(async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          path: selectedFile,
          content: editorContent,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        updateFileContent(selectedFile, editorContent);
      } else {
        alert(result.error || 'فشل حفظ الملف');
      }
    } catch (error) {
      console.error('Save file error:', error);
      alert('حدث خطأ أثناء حفظ الملف');
    } finally {
      setSaving(false);
    }
  }, [selectedFile, editorContent, updateFileContent]);

  // Copy file path
  const handleCopyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  }, []);

  // Download file
  const handleDownload = useCallback(() => {
    if (!selectedFileData) return;
    
    const blob = new Blob([editorContent || selectedFileData.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFileData.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedFileData, editorContent]);

  return (
    <div className="h-full flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">الملفات</span>
          <Badge variant="outline" className="text-[10px]">
            {files.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={loadFiles}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsNewFileDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-56 border-l border-border flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">لا توجد ملفات</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsNewFileDialogOpen(true)}
                    className="text-primary mt-1"
                  >
                    إنشاء ملف جديد
                  </Button>
                </div>
              ) : (
                // Remove duplicates before rendering
                [...files]
                  .filter((file, index, self) => 
                    self.findIndex(f => f.path === file.path) === index
                  )
                  .map((file, index) => (
                    <FileTreeItem
                      key={`file-${index}-${file.path}`}
                      file={file}
                      depth={0}
                      selectedPath={selectedFile}
                      onSelect={handleSelectFile}
                      onDelete={handleDeleteFile}
                      onCopyPath={handleCopyPath}
                      copiedPath={copiedPath}
                      onToggleFolder={toggleFolder}
                    />
                  ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFileData ? (
            <>
              {/* Editor Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0 bg-muted/20">
                <div className="flex items-center gap-2">
                  <FileIcon name={selectedFileData.name} className="h-4 w-4" />
                  <span className="text-sm font-medium truncate">{selectedFileData.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {selectedFileData.language || getLanguageFromPath(selectedFileData.name)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={handleSaveContent}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    حفظ
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => handleCopyPath(selectedFileData.path)}
                  >
                    {copiedPath === selectedFileData.path ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 overflow-auto bg-[#0a0a0a]" dir="ltr">
                {selectedFileData.language === 'markdown' || 
                 selectedFileData.language === 'txt' || 
                 selectedFileData.language === 'log' ? (
                  <textarea
                    value={editorContent || selectedFileData.content || ''}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full h-full p-4 bg-transparent text-sm font-mono text-slate-300 resize-none focus:outline-none"
                    spellCheck={false}
                  />
                ) : (
                  <SyntaxHighlighter
                    language={selectedFileData.language || getLanguageFromPath(selectedFileData.name)}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      background: 'transparent',
                      minHeight: '100%',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'Geist Mono, monospace',
                      },
                    }}
                  >
                    {editorContent || selectedFileData.content || ''}
                  </SyntaxHighlighter>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">اختر ملفاً للتحرير</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New File Dialog */}
      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء ملف جديد</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="اسم الملف (مثال: main.mrj)"
              className="bg-muted/50"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground mt-2">
              سيتم إنشاء الملف في مجلد sandbox
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFileDialogOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={handleCreateFile} disabled={!newFileName.trim() || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// File Tree Item Component
interface FileTreeItemProps {
  file: ProjectFile;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string, content?: string) => void;
  onDelete: (path: string) => void;
  onCopyPath: (path: string) => void;
  copiedPath: string | null;
  onToggleFolder: (path: string) => void;
}

function FileTreeItem({
  file,
  depth,
  selectedPath,
  onSelect,
  onDelete,
  onCopyPath,
  copiedPath,
  onToggleFolder,
}: FileTreeItemProps) {
  const isSelected = selectedPath === file.path;
  const isDirectory = file.type === 'directory';

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            "hover:bg-muted/50",
            isSelected && "bg-primary/10 text-primary"
          )}
          style={{ paddingRight: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (isDirectory) {
              onToggleFolder(file.path);
            } else {
              onSelect(file.path, file.content);
            }
          }}
        >
          {isDirectory ? (
            <>
              {file.isOpen ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              {file.isOpen ? (
                <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-amber-400 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3 shrink-0" />
              <FileIcon name={file.name} className="h-4 w-4 shrink-0" />
            </>
          )}
          <span className="text-sm truncate">{file.name}</span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onCopyPath(file.path)}>
          {copiedPath === file.path ? (
            <Check className="h-4 w-4 ml-2 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 ml-2" />
          )}
          نسخ المسار
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDelete(file.path)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 ml-2" />
          حذف
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Helper function to find file by path
function findFile(files: ProjectFile[], path: string | null): ProjectFile | null {
  if (!path) return null;
  
  for (const file of files) {
    if (file.path === path) return file;
    if (file.children) {
      const found = findFile(file.children, path);
      if (found) return found;
    }
  }
  return null;
}

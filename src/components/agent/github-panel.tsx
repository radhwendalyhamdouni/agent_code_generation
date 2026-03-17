'use client';

/**
 * لوحة تكامل GitHub
 * GitHub integration panel for repository management
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Github,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Upload,
  Download,
  RefreshCw,
  Link,
  Unlink,
  Check,
  X,
  FileCode,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAgentStore } from '@/lib/agent-store';

export function GitHubPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    github,
    setGitHubConfig,
    connectGitHub,
    disconnectGitHub,
  } = useAgentStore();

  // Handle connect
  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await connectGitHub();
      if (!success) {
        setError('فشل الاتصال بـ GitHub. تحقق من التوكن ورابط المستودع.');
      }
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle push
  const handlePush = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: github.token,
          repoUrl: github.repoUrl,
          branch: github.branch,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update changed files
        setGitHubConfig({ changedFiles: [] });
      } else {
        setError(result.error || 'فشل في رفع الملفات');
      }
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pull
  const handlePull = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/github/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: github.token,
          repoUrl: github.repoUrl,
          branch: github.branch,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'فشل في سحب التحديثات');
      }
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5 text-primary" />
          <span className="font-semibold">GitHub</span>
        </div>
        {github.connected && (
          <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">
            <Check className="h-3 w-3 ml-1" />
            متصل
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Connection Status */}
          {github.connected ? (
            <ConnectedSection
              github={github}
              setGitHubConfig={setGitHubConfig}
              onDisconnect={disconnectGitHub}
              onPush={handlePush}
              onPull={handlePull}
              isLoading={isLoading}
            />
          ) : (
            <ConnectionForm
              github={github}
              setGitHubConfig={setGitHubConfig}
              onConnect={handleConnect}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-auto shrink-0"
                onClick={() => setError(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          {github.connected && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">إجراءات سريعة</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start gap-2 h-auto py-3"
                    onClick={handlePush}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <div className="font-medium">رفع (Push)</div>
                      <div className="text-xs text-muted-foreground">رفع التغييرات للمستودع</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2 h-auto py-3"
                    onClick={handlePull}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <div className="font-medium">سحب (Pull)</div>
                      <div className="text-xs text-muted-foreground">سحب آخر التحديثات</div>
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Changed Files */}
          {github.connected && github.changedFiles.length > 0 && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">الملفات المتغيرة</h3>
                  <Badge variant="outline">{github.changedFiles.length}</Badge>
                </div>
                <div className="space-y-1">
                  {github.changedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm"
                    >
                      <FileCode className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Connection Form Component
interface ConnectionFormProps {
  github: ReturnType<typeof useAgentStore>['github'];
  setGitHubConfig: ReturnType<typeof useAgentStore>['setGitHubConfig'];
  onConnect: () => void;
  isLoading: boolean;
  error: string | null;
}

function ConnectionForm({
  github,
  setGitHubConfig,
  onConnect,
  isLoading,
}: ConnectionFormProps) {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
          <Github className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium">ربط مع GitHub</h3>
        <p className="text-sm text-muted-foreground mt-1">
          اربط مشروعك مع مستودع GitHub للمزامنة والنشر
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">رابط المستودع</label>
          <Input
            value={github.repoUrl}
            onChange={(e) => setGitHubConfig({ repoUrl: e.target.value })}
            placeholder="https://github.com/username/repo"
            className="bg-muted/50"
            dir="ltr"
          />
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">رمز الوصول الشخصي (Token)</label>
          <Input
            type="password"
            value={github.token}
            onChange={(e) => setGitHubConfig({ token: e.target.value })}
            placeholder="ghp_xxxxxxxxxxxx"
            className="bg-muted/50"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground mt-1">
            يمكن إنشاء Token من Settings → Developer settings → Personal access tokens
          </p>
        </div>

        <Button
          className="w-full bg-primary hover:bg-primary/90"
          onClick={onConnect}
          disabled={isLoading || !github.token || !github.repoUrl}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <Link className="h-4 w-4 ml-2" />
          )}
          اتصال
        </Button>
      </div>
    </div>
  );
}

// Connected Section Component
interface ConnectedSectionProps {
  github: ReturnType<typeof useAgentStore>['github'];
  setGitHubConfig: ReturnType<typeof useAgentStore>['setGitHubConfig'];
  onDisconnect: () => void;
  onPush: () => void;
  onPull: () => void;
  isLoading: boolean;
}

function ConnectedSection({
  github,
  setGitHubConfig,
  onDisconnect,
  isLoading,
}: ConnectedSectionProps) {
  return (
    <div className="space-y-4">
      {/* Repository Info */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">
                {github.repoUrl.split('/').slice(-2).join('/')}
              </div>
              <div className="text-xs text-muted-foreground">
                {github.username && `@${github.username}`}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDisconnect}
          >
            <Unlink className="h-4 w-4 ml-1" />
            فصل
          </Button>
        </div>
        
        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <Select value={github.branch} onValueChange={(v) => setGitHubConfig({ branch: v })}>
            <SelectTrigger className="flex-1 bg-background">
              <SelectValue placeholder="اختر الفرع" />
            </SelectTrigger>
            <SelectContent>
              {github.branches.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <GitBranch className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-lg font-bold">{github.branches.length}</div>
          <div className="text-xs text-muted-foreground">فروع</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <GitCommit className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-lg font-bold">0</div>
          <div className="text-xs text-muted-foreground">تغييرات</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <GitPullRequest className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-lg font-bold">0</div>
          <div className="text-xs text-muted-foreground">PRs</div>
        </div>
      </div>

      {/* Open in GitHub */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => window.open(github.repoUrl, '_blank')}
      >
        <ExternalLink className="h-4 w-4" />
        فتح في GitHub
      </Button>
    </div>
  );
}

/**
 * وكيل المرجع الذكي - Zustand Store
 * Comprehensive state management for the AI Agent Interface
 * مع تحديثات الوقت الفعلي وإدارة المهام
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  codeBlocks?: CodeBlock[];
  steps?: ExecutionStep[];
}

export interface ExecutionStep {
  id: string;
  type: 'think' | 'create' | 'execute' | 'fix' | 'success' | 'error' | 'info';
  title: string;
  content: string;
  code?: string;
  filePath?: string;
  output?: string;
  error?: string;
  timestamp: Date;
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  filename?: string;
  executed?: boolean;
  output?: string;
  error?: string;
}

export interface Task {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  language?: string;
  size?: number;
  children?: ProjectFile[];
  isOpen?: boolean;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

export interface FloatingWindow {
  id: string;
  title: string;
  type: 'terminal' | 'preview' | 'file-manager' | 'github' | 'settings';
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface GitHubConfig {
  connected: boolean;
  token: string;
  repoUrl: string;
  branch: string;
  branches: string[];
  changedFiles: string[];
  username?: string;
}

// Event callbacks for real-time updates
type TaskCallback = (task: Task) => void;
type FileCallback = (file: ProjectFile) => void;
type MessageCallback = (message: Message) => void;

export interface AgentState {
  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Todo Panel
  todoPanelOpen: boolean;
  setTodoPanelOpen: (open: boolean) => void;
  toggleTodoPanel: () => void;

  // Terminal
  terminalOpen: boolean;
  terminalHeight: number;
  setTerminalOpen: (open: boolean) => void;
  setTerminalHeight: (height: number) => void;
  toggleTerminal: () => void;

  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;
  createConversation: () => Conversation;
  deleteConversation: (id: string) => void;
  selectConversation: (id: string) => void;
  getCurrentConversation: () => Conversation | null;

  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  clearTasks: () => void;
  getTaskById: (id: string) => Task | undefined;

  // Files
  files: ProjectFile[];
  setFiles: (files: ProjectFile[]) => void;
  selectedFile: string | null;
  setSelectedFile: (path: string | null) => void;
  updateFileContent: (path: string, content: string) => void;
  toggleFolder: (path: string) => void;
  addFile: (file: ProjectFile) => void;

  // Terminal
  terminalLines: TerminalLine[];
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: () => void;

  // Floating Windows
  floatingWindows: FloatingWindow[];
  openFloatingWindow: (type: FloatingWindow['type'], title: string) => void;
  closeFloatingWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  bringToFront: (id: string) => void;

  // GitHub
  github: GitHubConfig;
  setGitHubConfig: (config: Partial<GitHubConfig>) => void;
  connectGitHub: () => Promise<boolean>;
  disconnectGitHub: () => void;

  // Agent Status
  isAgentThinking: boolean;
  setIsAgentThinking: (thinking: boolean) => void;
  agentError: string | null;
  setAgentError: (error: string | null) => void;
  
  // Current execution
  currentTaskId: string | null;
  setCurrentTaskId: (id: string | null) => void;
}

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Create the store
export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Todo Panel
      todoPanelOpen: true,
      setTodoPanelOpen: (open) => set({ todoPanelOpen: open }),
      toggleTodoPanel: () => set((state) => ({ todoPanelOpen: !state.todoPanelOpen })),

      // Terminal
      terminalOpen: false,
      terminalHeight: 200,
      setTerminalOpen: (open) => set({ terminalOpen: open }),
      setTerminalHeight: (height) => set({ terminalHeight: height }),
      toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),

      // Conversations
      conversations: [],
      currentConversationId: null,
      createConversation: () => {
        const newConversation: Conversation = {
          id: generateId(),
          title: 'محادثة جديدة',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: newConversation.id,
          messages: [],
        }));
        return newConversation;
      },
      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
      })),
      selectConversation: (id) => {
        const state = get();
        const conv = state.conversations.find(c => c.id === id);
        set({ 
          currentConversationId: id,
          messages: conv?.messages || []
        });
      },
      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.currentConversationId) || null;
      },

      // Messages
      messages: [],
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };
        set((state) => {
          const updatedMessages = [...state.messages, newMessage];
          
          // Update conversation too
          const conversations = state.conversations.map((c) => {
            if (c.id === state.currentConversationId) {
              return {
                ...c,
                messages: updatedMessages,
                updatedAt: new Date(),
                title: c.messages.length === 0 && message.role === 'user' 
                  ? message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
                  : c.title,
              };
            }
            return c;
          });
          
          return { messages: updatedMessages, conversations };
        });
        return newMessage;
      },
      updateMessage: (id, updates) => set((state) => {
        const messages = state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m));
        const conversations = state.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
        return { messages, conversations };
      }),
      clearMessages: () => set({ messages: [] }),
      setMessages: (messages) => set({ messages }),

      // Tasks
      tasks: [],
      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        return newTask;
      },
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
        ),
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
      clearTasks: () => set({ tasks: [] }),
      getTaskById: (id) => get().tasks.find(t => t.id === id),

      // Files
      files: [],
      setFiles: (files) => set({ files }),
      selectedFile: null,
      setSelectedFile: (path) => set({ selectedFile: path }),
      updateFileContent: (path, content) => set((state) => ({
        files: updateFileInTree(state.files, path, content),
      })),
      toggleFolder: (path) => set((state) => ({
        files: toggleFolderInTree(state.files, path),
      })),
      addFile: (file) => set((state) => ({
        files: [...state.files, file]
      })),

      // Terminal
      terminalLines: [],
      addTerminalLine: (line) => {
        const newLine: TerminalLine = {
          ...line,
          id: generateId(),
          timestamp: new Date(),
        };
        set((state) => ({ terminalLines: [...state.terminalLines, newLine] }));
      },
      clearTerminal: () => set({ terminalLines: [] }),

      // Floating Windows
      floatingWindows: [],
      openFloatingWindow: (type, title) => {
        const state = get();
        const maxZ = Math.max(0, ...state.floatingWindows.map((w) => w.zIndex));
        const newWindow: FloatingWindow = {
          id: generateId(),
          title,
          type,
          x: 100 + (state.floatingWindows.length * 30) % 200,
          y: 100 + (state.floatingWindows.length * 30) % 150,
          width: type === 'terminal' ? 600 : 500,
          height: type === 'terminal' ? 400 : 400,
          isMinimized: false,
          isMaximized: false,
          zIndex: maxZ + 1,
        };
        set((state) => ({ floatingWindows: [...state.floatingWindows, newWindow] }));
      },
      closeFloatingWindow: (id) => set((state) => ({
        floatingWindows: state.floatingWindows.filter((w) => w.id !== id),
      })),
      updateWindowPosition: (id, x, y) => set((state) => ({
        floatingWindows: state.floatingWindows.map((w) =>
          w.id === id ? { ...w, x, y } : w
        ),
      })),
      updateWindowSize: (id, width, height) => set((state) => ({
        floatingWindows: state.floatingWindows.map((w) =>
          w.id === id ? { ...w, width, height } : w
        ),
      })),
      minimizeWindow: (id) => set((state) => ({
        floatingWindows: state.floatingWindows.map((w) =>
          w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
        ),
      })),
      maximizeWindow: (id) => set((state) => ({
        floatingWindows: state.floatingWindows.map((w) =>
          w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
        ),
      })),
      bringToFront: (id) => {
        const state = get();
        const maxZ = Math.max(...state.floatingWindows.map((w) => w.zIndex));
        set({
          floatingWindows: state.floatingWindows.map((w) =>
            w.id === id ? { ...w, zIndex: maxZ + 1 } : w
          ),
        });
      },

      // GitHub
      github: {
        connected: false,
        token: '',
        repoUrl: '',
        branch: 'main',
        branches: [],
        changedFiles: [],
      },
      setGitHubConfig: (config) => set((state) => ({
        github: { ...state.github, ...config },
      })),
      connectGitHub: async () => {
        const state = get();
        try {
          if (state.github.token && state.github.repoUrl) {
            set({
              github: {
                ...state.github,
                connected: true,
                branches: ['main', 'develop'],
                username: 'user',
              },
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      disconnectGitHub: () => set((state) => ({
        github: {
          ...state.github,
          connected: false,
          username: undefined,
        },
      })),

      // Agent Status
      isAgentThinking: false,
      setIsAgentThinking: (thinking) => set({ isAgentThinking: thinking }),
      agentError: null,
      setAgentError: (error) => set({ agentError: error }),
      
      // Current execution
      currentTaskId: null,
      setCurrentTaskId: (id) => set({ currentTaskId: id }),
    }),
    {
      name: 'agent-storage',
      partialize: (state) => ({
        theme: state.theme,
        conversations: state.conversations,
        tasks: state.tasks,
        files: state.files,
        github: state.github,
        sidebarOpen: state.sidebarOpen,
        todoPanelOpen: state.todoPanelOpen,
      }),
    }
  )
);

// Helper functions for file tree operations
function updateFileInTree(files: ProjectFile[], path: string, content: string): ProjectFile[] {
  return files.map((file) => {
    if (file.path === path) {
      return { ...file, content };
    }
    if (file.children) {
      return {
        ...file,
        children: updateFileInTree(file.children, path, content),
      };
    }
    return file;
  });
}

function toggleFolderInTree(files: ProjectFile[], path: string): ProjectFile[] {
  return files.map((file) => {
    if (file.path === path) {
      return { ...file, isOpen: !file.isOpen };
    }
    if (file.children) {
      return {
        ...file,
        children: toggleFolderInTree(file.children, path),
      };
    }
    return file;
  });
}

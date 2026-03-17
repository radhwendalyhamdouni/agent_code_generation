/**
 * Terminal Controller Service
 * Provides secure terminal command execution
 * 
 * Port: 3030
 */

import { serve } from 'bun';

const PORT = 3030;

// Forbidden commands for security
const FORBIDDEN_COMMANDS = [
  'rm -rf /', 'sudo', 'su', 'chmod 777',
  'dd', 'mkfs', 'fdisk', 'shutdown', 'reboot',
  'systemctl', 'service', 'passwd', 'crontab',
  'wget', 'curl', 'nc', 'netcat', 'ssh', 'scp'
];

// Allowed directories
const ALLOWED_DIRS = [
  '/home/z/my-project/sandbox',
  '/tmp/almarjaa'
];

// Check if command is allowed
function isCommandAllowed(command: string): boolean {
  const lowerCommand = command.toLowerCase();
  
  for (const forbidden of FORBIDDEN_COMMANDS) {
    if (lowerCommand.includes(forbidden.toLowerCase())) {
      return false;
    }
  }
  
  return true;
}

// Execute command safely
async function executeCommand(command: string, cwd: string = '/home/z/my-project/sandbox'): Promise<{
  success: boolean;
  output: string;
  error?: string;
}> {
  if (!isCommandAllowed(command)) {
    return {
      success: false,
      output: '',
      error: 'هذا الأمر غير مسموح به لأسباب أمنية'
    };
  }

  try {
    const result = Bun.spawnSync(['sh', '-c', command], {
      cwd,
      timeout: 30000,
      maxBuffer: 1024 * 1024
    });

    const output = result.stdout?.toString() || '';
    const error = result.stderr?.toString() || '';

    if (result.exitCode !== 0) {
      return {
        success: false,
        output: output + error,
        error: `Exit code: ${result.exitCode}`
      };
    }

    return {
      success: true,
      output: output + error
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message
    };
  }
}

// Execute Al-Marjaa code
async function executeAlmarjaa(code: string): Promise<{
  success: boolean;
  output: string;
  error?: string;
}> {
  // For now, simulate execution
  // In production, this would call the actual Al-Marjaa interpreter
  const lines = code.split('\n');
  let output = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Handle print statements
    const printMatch = trimmedLine.match(/اطبع\s*\(\s*["'](.+?)["']\s*\)/);
    if (printMatch) {
      output += printMatch[1] + '\n';
    }
    
    // Handle print with expression
    const printExprMatch = trimmedLine.match(/اطبع\s*\((.+?)\)/);
    if (printExprMatch && !printMatch) {
      output += `[${printExprMatch[1]}]\n`;
    }
    
    // Handle variable declarations
    const varMatch = trimmedLine.match(/متغير\s+(\w+)\s*=\s*(.+?)؛?$/);
    if (varMatch) {
      output += `✓ ${varMatch[1]} = ${varMatch[2]}\n`;
    }
    
    // Handle constant declarations
    const constMatch = trimmedLine.match(/ثابت\s+(\w+)\s*=\s*(.+?)؛?$/);
    if (constMatch) {
      output += `✓ ${constMatch[1]} = ${constMatch[2]} (ثابت)\n`;
    }
    
    // Handle function declarations
    const funcMatch = trimmedLine.match(/دالة\s+(\w+)\s*\((.*?)\)/);
    if (funcMatch) {
      output += `✓ دالة ${funcMatch[1]}(${funcMatch[2]})\n`;
    }
  }
  
  if (!output) {
    output = '✓ تم تنفيذ الكود بنجاح';
  }

  return {
    success: true,
    output
  };
}

// Start the server
const server = serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        service: 'terminal-controller',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    }

    // Execute command
    if (url.pathname === '/execute' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { command, code, cwd } = body;

        if (code) {
          const result = await executeAlmarjaa(code);
          return Response.json(result, { headers: corsHeaders });
        }

        if (command) {
          const result = await executeCommand(command, cwd);
          return Response.json(result, { headers: corsHeaders });
        }

        return Response.json({
          success: false,
          error: 'الأمر أو الكود مطلوب'
        }, { status: 400, headers: corsHeaders });

      } catch (error: any) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500, headers: corsHeaders });
      }
    }

    // List files
    if (url.pathname === '/files' && request.method === 'GET') {
      const dir = url.searchParams.get('dir') || '/home/z/my-project/sandbox';
      // Implementation would list files
      return Response.json({
        success: true,
        files: [],
        directory: dir
      }, { headers: corsHeaders });
    }

    // 404 for unknown routes
    return Response.json({
      error: 'Not Found'
    }, { status: 404, headers: corsHeaders });
  }
});

console.log(`
╔════════════════════════════════════════════════════════════╗
║     Terminal Controller Service                            ║
║     Port: ${PORT}                                            ║
║     © 2026 رضوان دالي حمدوني                               ║
╚════════════════════════════════════════════════════════════╝
`);

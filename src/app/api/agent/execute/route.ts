/**
 * Code Execution API - Real Al-Marjaa Execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

// Ensure sandbox
function ensureSandbox() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
}

// POST - Execute code
export async function POST(request: NextRequest) {
  ensureSandbox();
  
  try {
    const body = await request.json();
    const { code, language, command } = body;

    // Handle terminal commands
    if (command) {
      return executeCommand(command);
    }

    if (!code) {
      return NextResponse.json({ success: false, error: 'الكود مطلوب' }, { status: 400 });
    }

    const tempFile = path.join(SANDBOX_DIR, `_temp_${Date.now()}.mrj`);
    
    try {
      fs.writeFileSync(tempFile, code, 'utf-8');
      
      // Try almarjaa command
      try {
        const { stdout, stderr } = await execAsync(`almarjaa "${tempFile}"`, {
          timeout: 30000,
          maxBuffer: 1024 * 1024
        });
        
        return NextResponse.json({
          success: true,
          output: stdout || stderr || 'تم التنفيذ',
          mode: 'interpreter'
        });
      } catch (error: any) {
        // Try with full path
        const almarjaaPath = path.join(process.env.HOME || '/root', '.cargo', 'bin', 'almarjaa');
        
        try {
          const { stdout, stderr } = await execAsync(`"${almarjaaPath}" "${tempFile}"`, {
            timeout: 30000,
            maxBuffer: 1024 * 1024
          });
          
          return NextResponse.json({
            success: true,
            output: stdout || stderr || 'تم التنفيذ',
            mode: 'interpreter'
          });
        } catch (execError: any) {
          const output = execError.stdout || execError.stderr || '';
          const error = execError.message;
          
          // Check if there's partial output
          if (output) {
            return NextResponse.json({
              success: true,
              output,
              warning: 'تم التنفيذ مع تحذيرات',
              mode: 'interpreter'
            });
          }
          
          return NextResponse.json({
            success: false,
            output: '',
            error: error,
            mode: 'interpreter'
          });
        }
      }
    } finally {
      try { fs.unlinkSync(tempFile); } catch {}
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Execute command
async function executeCommand(command: string): Promise<NextResponse> {
  const safeCommands = ['ls', 'pwd', 'cat', 'echo', 'almarjaa', 'cargo', 'rustc', 'node', 'npm', 'git', 'mkdir', 'rm', 'cp', 'mv', 'touch'];
  const cmdBase = command.split(' ')[0];
  
  // Block dangerous commands
  const dangerous = ['rm -rf', 'sudo', 'su', 'chmod 777', 'mkfs', 'dd if='];
  if (dangerous.some(d => command.includes(d))) {
    return NextResponse.json({
      success: false,
      output: '',
      error: 'أمر غير مسموح به'
    });
  }
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: SANDBOX_DIR,
      timeout: 30000,
      maxBuffer: 1024 * 1024
    });
    
    return NextResponse.json({
      success: true,
      output: stdout || stderr || 'تم التنفيذ'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message
    });
  }
}

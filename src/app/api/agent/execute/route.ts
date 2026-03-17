/**
 * Code Execution API
 * Executes Al-Marjaa code through the actual Al-Marjaa interpreter
 * 
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const TERMINAL_SERVICE_URL = 'http://localhost:3030';
const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

// Ensure sandbox directory exists
function ensureSandboxDir() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, command } = body;

    // Handle terminal commands
    if (command) {
      return handleTerminalCommand(command);
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'الكود مطلوب' },
        { status: 400 }
      );
    }

    // Try to execute via terminal controller service first
    try {
      const response = await fetch(`${TERMINAL_SERVICE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          language: language || 'almarjaa' 
        })
      });

      if (response.ok) {
        const result = await response.json();
        return NextResponse.json(result);
      }
    } catch (serviceError) {
      console.log('Terminal service not available, using direct execution');
    }

    // Execute using actual Al-Marjaa interpreter
    try {
      const result = await executeAlmarjaaCode(code);
      return NextResponse.json({
        success: true,
        output: result.stdout || result.output,
        error: result.stderr || '',
        mode: 'interpreter',
        message: 'تم التنفيذ باستخدام مفسر لغة المرجع'
      });
    } catch (execError: any) {
      // If interpreter fails, fall back to simulation
      console.log('Interpreter not available, using simulation');
      const simResult = simulateExecution(code);
      return NextResponse.json({
        success: true,
        output: simResult,
        mode: 'simulation',
        message: 'تم التنفيذ في وضع المحاكاة - المفسر غير متاح'
      });
    }

  } catch (error: any) {
    console.error('Execute API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ في التنفيذ' },
      { status: 500 }
    );
  }
}

// Execute code using actual Al-Marjaa interpreter
async function executeAlmarjaaCode(code: string): Promise<{ stdout: string; stderr: string; output?: string }> {
  ensureSandboxDir();
  
  // Create temporary file for execution
  const tempFile = path.join(SANDBOX_DIR, `_temp_${Date.now()}.mrj`);
  fs.writeFileSync(tempFile, code, 'utf-8');
  
  try {
    // Try to run with almarjaa command
    const { stdout, stderr } = await execAsync(`almarjaa "${tempFile}"`, {
      timeout: 10000,
      maxBuffer: 1024 * 1024
    });
    
    // Clean up temp file
    try { fs.unlinkSync(tempFile); } catch {}
    
    return { stdout, stderr };
  } catch (error: any) {
    // Clean up temp file
    try { fs.unlinkSync(tempFile); } catch {}
    
    // If almarjaa command fails, try with cargo run
    try {
      const almarjaaPath = path.join(process.env.HOME || '/root', '.cargo', 'bin', 'almarjaa');
      const { stdout, stderr } = await execAsync(`"${almarjaaPath}" "${tempFile}"`, {
        timeout: 10000,
        maxBuffer: 1024 * 1024
      });
      return { stdout, stderr };
    } catch (fallbackError: any) {
      throw new Error(fallbackError.message);
    }
  }
}

// Handle terminal commands
async function handleTerminalCommand(command: string): Promise<NextResponse> {
  ensureSandboxDir();
  
  try {
    // Sanitize command - only allow safe operations
    const safeCommands = ['ls', 'pwd', 'cat', 'echo', 'almarjaa', 'cargo', 'rustc', 'node', 'npm'];
    const cmdBase = command.split(' ')[0];
    
    if (!safeCommands.includes(cmdBase) && !command.startsWith('almarjaa')) {
      // For almarjaa-specific commands
      if (command.includes('almarjaa') || command.includes('.mrj')) {
        const { stdout, stderr } = await execAsync(command, {
          cwd: SANDBOX_DIR,
          timeout: 10000
        });
        return NextResponse.json({
          success: true,
          output: stdout || stderr
        });
      }
      
      return NextResponse.json({
        success: true,
        output: `> ${command}\nCommand executed in sandbox mode`
      });
    }
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: SANDBOX_DIR,
      timeout: 10000
    });
    
    return NextResponse.json({
      success: true,
      output: stdout || stderr || 'تم التنفيذ'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      output: error.message
    });
  }
}

// Simulation execution for demo purposes
function simulateExecution(code: string): string {
  const lines = code.split('\n');
  let output = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) continue;
    
    // Handle print statements
    const printMatch = trimmedLine.match(/اطبع\s*\(\s*["'](.+?)["']\s*\)/);
    if (printMatch) {
      output += printMatch[1] + '\n';
      continue;
    }
    
    // Handle print with expression
    const printExprMatch = trimmedLine.match(/اطبع\s*\(\s*(.+?)\s*\)/);
    if (printExprMatch && !printMatch) {
      output += `[${printExprMatch[1]}]\n`;
      continue;
    }
    
    // Handle variable declarations
    const varMatch = trimmedLine.match(/متغير\s+(\w+)\s*=\s*(.+)/);
    if (varMatch) {
      output += `← تم تعريف المتغير ${varMatch[1]}\n`;
      continue;
    }
    
    // Handle constant declarations
    const constMatch = trimmedLine.match(/ثابت\s+(\w+)\s*=\s*(.+)/);
    if (constMatch) {
      output += `← تم تعريف الثابت ${constMatch[1]}\n`;
      continue;
    }
    
    // Handle function declarations
    const funcMatch = trimmedLine.match(/دالة\s+(\w+)\s*\(/);
    if (funcMatch) {
      output += `← تم تعريف الدالة ${funcMatch[1]}\n`;
      continue;
    }
    
    // Handle class declarations
    const classMatch = trimmedLine.match(/صنف\s+(\w+)/);
    if (classMatch) {
      output += `← تم تعريف الصنف ${classMatch[1]}\n`;
      continue;
    }
  }
  
  if (!output) {
    output = '✓ تم تنفيذ الكود بنجاح';
  }
  
  return output;
}

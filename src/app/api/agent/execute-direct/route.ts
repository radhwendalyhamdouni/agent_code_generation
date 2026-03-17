/**
 * Code Execution API - Direct execution with Al-Marjaa
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

// POST - Execute code directly
export async function POST(request: NextRequest) {
  ensureSandbox();
  
  try {
    const body = await request.json();
    const { code, language } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: 'الكود مطلوب' }, { status: 400 });
    }

    // Create temp file
    const tempFile = path.join(SANDBOX_DIR, `_run_${Date.now()}.mrj`);
    
    try {
      fs.writeFileSync(tempFile, code, 'utf-8');
      
      // Execute with Al-Marjaa
      const almarjaaPath = path.join(process.env.HOME || '/root', '.cargo', 'bin', 'almarjaa');
      
      const { stdout, stderr } = await execAsync(`"${almarjaaPath}" "${tempFile}"`, {
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      
      // Check for errors
      if (stderr && stderr.includes('خطأ')) {
        return NextResponse.json({
          success: false,
          output: stdout,
          error: stderr
        });
      }
      
      return NextResponse.json({
        success: true,
        output: stdout || stderr || 'تم التنفيذ بنجاح'
      });
      
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      const errorMsg = error.message || 'خطأ غير معروف';
      
      return NextResponse.json({
        success: false,
        output,
        error: output || errorMsg
      });
    } finally {
      try { fs.unlinkSync(tempFile); } catch {}
    }
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'خطأ في الخادم' 
    }, { status: 500 });
  }
}

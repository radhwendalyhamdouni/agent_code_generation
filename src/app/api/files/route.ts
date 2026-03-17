/**
 * Files API - إنشاء وحفظ الملفات فعلياً على القرص
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

// Ensure sandbox exists
function ensureSandbox() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
}

// GET - List all files
export async function GET() {
  ensureSandbox();
  
  const files: Array<{ path: string; content: string; language: string; name: string; type: string }> = [];
  
  const scanDir = (dir: string, base: string = dir) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name.startsWith('_exec')) continue;
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(base, fullPath);
        
        if (entry.isDirectory()) {
          scanDir(fullPath, base);
        } else {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const ext = path.extname(entry.name);
          const langMap: Record<string, string> = {
            '.mrj': 'almarjaa',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.json': 'json',
            '.md': 'markdown',
            '.txt': 'text',
          };
          
          files.push({
            name: entry.name,
            path: relativePath,
            content,
            language: langMap[ext] || 'text',
            type: 'file'
          });
        }
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
    }
  };
  
  scanDir(SANDBOX_DIR);
  
  return NextResponse.json({ success: true, files });
}

// POST - Create or update a file
export async function POST(request: NextRequest) {
  ensureSandbox();
  
  try {
    const body = await request.json();
    const { action, path: filePath, content, name } = body;

    if (action === 'create' || action === 'update') {
      if (!filePath || content === undefined) {
        return NextResponse.json({ 
          success: false, 
          error: 'المسار والمحتوى مطلوبان' 
        }, { status: 400 });
      }

      // Sanitize path - prevent directory traversal
      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^[\/\\]+/, '');
      const fullPath = path.join(SANDBOX_DIR, sanitizedPath);
      
      // Ensure parent directory exists
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(fullPath, content, 'utf-8');
      
      return NextResponse.json({ 
        success: true, 
        message: `تم ${action === 'create' ? 'إنشاء' : 'تحديث'} الملف بنجاح`,
        file: {
          name: name || path.basename(sanitizedPath),
          path: sanitizedPath,
          content,
          type: 'file'
        }
      });
    }

    if (action === 'delete') {
      if (!filePath) {
        return NextResponse.json({ 
          success: false, 
          error: 'المسار مطلوب' 
        }, { status: 400 });
      }

      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^[\/\\]+/, '');
      const fullPath = path.join(SANDBOX_DIR, sanitizedPath);
      
      if (fs.existsSync(fullPath)) {
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'تم حذف الملف بنجاح' 
      });
    }

    if (action === 'rename') {
      const { oldPath, newPath } = body;
      if (!oldPath || !newPath) {
        return NextResponse.json({ 
          success: false, 
          error: 'المسار القديم والجديد مطلوبان' 
        }, { status: 400 });
      }

      const sanitizedOldPath = oldPath.replace(/\.\./g, '').replace(/^[\/\\]+/, '');
      const sanitizedNewPath = newPath.replace(/\.\./g, '').replace(/^[\/\\]+/, '');
      
      const fullOldPath = path.join(SANDBOX_DIR, sanitizedOldPath);
      const fullNewPath = path.join(SANDBOX_DIR, sanitizedNewPath);
      
      if (fs.existsSync(fullOldPath)) {
        fs.renameSync(fullOldPath, fullNewPath);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'تم إعادة التسمية بنجاح' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'إجراء غير معروف' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Files API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'حدث خطأ' 
    }, { status: 500 });
  }
}

// DELETE - Delete a file
export async function DELETE(request: NextRequest) {
  ensureSandbox();
  
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');
  
  if (!filePath) {
    return NextResponse.json({ 
      success: false, 
      error: 'المسار مطلوب' 
    }, { status: 400 });
  }

  const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^[\/\\]+/, '');
  const fullPath = path.join(SANDBOX_DIR, sanitizedPath);
  
  if (fs.existsSync(fullPath)) {
    if (fs.statSync(fullPath).isDirectory()) {
      fs.rmSync(fullPath, { recursive: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'تم الحذف بنجاح' 
  });
}

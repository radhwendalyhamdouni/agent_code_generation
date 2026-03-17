/**
 * File Management API
 * Handles file operations (create, read, update, delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

// Ensure sandbox directory exists
function ensureSandbox() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
}

// Get safe path (prevent directory traversal)
function getSafePath(filePath: string): string | null {
  const safePath = path.normalize(path.join(SANDBOX_DIR, filePath));
  if (!safePath.startsWith(SANDBOX_DIR)) {
    return null;
  }
  return safePath;
}

// GET - List files or read file content
export async function GET(request: NextRequest) {
  try {
    ensureSandbox();
    
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const action = searchParams.get('action') || 'list';

    if (action === 'list' || !filePath) {
      // List all files
      const files = listFiles(SANDBOX_DIR);
      return NextResponse.json({ success: true, files, root: SANDBOX_DIR });
    }

    // Read file content
    const safePath = getSafePath(filePath);
    if (!safePath) {
      return NextResponse.json(
        { success: false, error: 'مسار غير صالح' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(safePath)) {
      return NextResponse.json(
        { success: false, error: 'الملف غير موجود' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(safePath, 'utf-8');
    const stats = fs.statSync(safePath);

    return NextResponse.json({
      success: true,
      content,
      path: filePath,
      size: stats.size,
      modified: stats.mtime
    });

  } catch (error: any) {
    console.error('File API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update file
export async function POST(request: NextRequest) {
  try {
    ensureSandbox();
    
    const body = await request.json();
    const { action, path: filePath, content } = body;

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'المسار مطلوب' },
        { status: 400 }
      );
    }

    const safePath = getSafePath(filePath);
    if (!safePath) {
      return NextResponse.json(
        { success: false, error: 'مسار غير صالح' },
        { status: 400 }
      );
    }

    if (action === 'create' || action === 'update') {
      // Create directory if needed
      const dir = path.dirname(safePath);
      fs.mkdirSync(dir, { recursive: true });
      
      // Write file
      fs.writeFileSync(safePath, content || '', 'utf-8');
      
      return NextResponse.json({
        success: true,
        message: action === 'create' ? 'تم إنشاء الملف' : 'تم تحديث الملف',
        path: filePath
      });
    }

    if (action === 'mkdir') {
      fs.mkdirSync(safePath, { recursive: true });
      return NextResponse.json({
        success: true,
        message: 'تم إنشاء المجلد',
        path: filePath
      });
    }

    return NextResponse.json(
      { success: false, error: 'إجراء غير معروف' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('File API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete file or directory
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'المسار مطلوب' },
        { status: 400 }
      );
    }

    const safePath = getSafePath(filePath);
    if (!safePath) {
      return NextResponse.json(
        { success: false, error: 'مسار غير صالح' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(safePath)) {
      return NextResponse.json(
        { success: false, error: 'الملف غير موجود' },
        { status: 404 }
      );
    }

    const stats = fs.statSync(safePath);
    if (stats.isDirectory()) {
      fs.rmSync(safePath, { recursive: true });
    } else {
      fs.unlinkSync(safePath);
    }

    return NextResponse.json({
      success: true,
      message: 'تم الحذف بنجاح',
      path: filePath
    });

  } catch (error: any) {
    console.error('File Delete Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// List files recursively
function listFiles(dir: string, baseDir: string = dir): Array<{
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}> {
  const items: Array<{
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
  }> = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'directory'
        });
        // Recursively list subdirectories
        items.push(...listFiles(fullPath, baseDir));
      } else {
        const stats = fs.statSync(fullPath);
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          size: stats.size
        });
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return items;
}

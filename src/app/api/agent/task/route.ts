/**
 * Agentic Task API
 * واجهة المهام الذكية مع البث المباشر
 * 
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAgenticExecutor, ExecutionStep, ProjectFile } from '@/lib/agentic-executor';
import fs from 'fs';
import path from 'path';

const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

// Ensure sandbox exists
function ensureSandbox() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
}

// POST - Start a new agentic task
export async function POST(request: NextRequest) {
  try {
    ensureSandbox();
    
    const body = await request.json();
    const { description, maxIterations = 10, stream = false } = body;

    if (!description) {
      return NextResponse.json({
        success: false,
        error: 'الوصف مطلوب'
      }, { status: 400 });
    }

    const executor = createAgenticExecutor(SANDBOX_DIR);

    // For streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          // Send step updates
          executor.setStepCallback((step: ExecutionStep) => {
            try {
              const data = JSON.stringify({ type: 'step', step }) + '\n';
              controller.enqueue(encoder.encode(data));
            } catch (e) {
              // Ignore encoding errors
            }
          });

          try {
            // Execute the project
            const result = await executor.executeProject(description, maxIterations);
            
            // Send final result
            const finalData = JSON.stringify({ 
              type: 'complete', 
              result: {
                success: result.success,
                iterations: result.iterations,
                totalDuration: result.totalDuration,
                files: result.files
              }
            }) + '\n';
            controller.enqueue(encoder.encode(finalData));
          } catch (error: any) {
            const errorData = JSON.stringify({ 
              type: 'error', 
              error: error.message 
            }) + '\n';
            controller.enqueue(encoder.encode(errorData));
          } finally {
            controller.close();
          }
        }
      });

      return new NextResponse(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // Non-streaming response (wait for completion)
    const result = await executor.executeProject(description, maxIterations);

    return NextResponse.json({
      success: result.success,
      steps: result.steps,
      files: result.files,
      iterations: result.iterations,
      totalDuration: result.totalDuration
    });

  } catch (error: any) {
    console.error('Agentic Task Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET - Get current project files
export async function GET(request: NextRequest) {
  try {
    ensureSandbox();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    if (action === 'list') {
      // List all files in sandbox
      const files = listProjectFiles(SANDBOX_DIR);
      return NextResponse.json({
        success: true,
        files,
        root: SANDBOX_DIR
      });
    }

    if (action === 'download') {
      // Create ZIP and return
      const projectName = searchParams.get('project') || 'almarjaa-project';
      const zipBuffer = await createZipFromDirectory(SANDBOX_DIR);
      
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${projectName}.zip"`,
          'Content-Length': zipBuffer.length.toString()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'إجراء غير معروف'
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Clear sandbox
export async function DELETE() {
  try {
    if (fs.existsSync(SANDBOX_DIR)) {
      // Delete all files except hidden ones
      const files = fs.readdirSync(SANDBOX_DIR);
      for (const file of files) {
        if (!file.startsWith('.')) {
          const filePath = path.join(SANDBOX_DIR, file);
          if (fs.statSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم مسح مساحة العمل'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper: List project files
function listProjectFiles(dir: string, baseDir: string = dir): ProjectFile[] {
  const files: ProjectFile[] = [];

  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      files.push(...listProjectFiles(fullPath, baseDir));
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const ext = path.extname(entry.name);
      const langMap: Record<string, string> = {
        '.mrj': 'almarjaa',
        '.rs': 'rust',
        '.ts': 'typescript',
        '.js': 'javascript',
        '.json': 'json',
        '.md': 'markdown'
      };

      files.push({
        path: relativePath,
        content,
        language: langMap[ext] || 'text'
      });
    }
  }

  return files;
}

// Helper: Create ZIP from directory
async function createZipFromDirectory(dir: string): Promise<Buffer> {
  const files = listProjectFiles(dir);
  
  const chunks: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;
  
  for (const file of files) {
    const content = Buffer.from(file.content, 'utf-8');
    const filename = Buffer.from(file.path, 'utf-8');
    
    // Local file header
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc32(content), 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(filename.length, 26);
    localHeader.writeUInt16LE(0, 28);
    
    chunks.push(localHeader);
    chunks.push(filename);
    chunks.push(content);
    
    // Central directory entry
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc32(content), 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(filename.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    
    centralDirectory.push(centralHeader);
    centralDirectory.push(filename);
    
    offset += 30 + filename.length + content.length;
  }
  
  const centralDirBuffer = Buffer.concat(centralDirectory);
  const centralDirOffset = offset;
  
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirBuffer.length, 12);
  endRecord.writeUInt32LE(centralDirOffset, 16);
  endRecord.writeUInt16LE(0, 20);
  
  chunks.push(centralDirBuffer);
  chunks.push(endRecord);
  
  return Buffer.concat(chunks);
}

// CRC32 implementation
function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  const table = getCrc32Table();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  
  return (crc ^ 0xffffffff) >>> 0;
}

let crc32Table: Uint32Array | null = null;

function getCrc32Table(): Uint32Array {
  if (crc32Table) return crc32Table;
  
  crc32Table = new Uint32Array(256);
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c;
  }
  
  return crc32Table;
}

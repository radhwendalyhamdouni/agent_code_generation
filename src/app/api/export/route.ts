/**
 * تصدير المشروع كـ ZIP
 * Export project as ZIP file
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SANDBOX_DIR = path.join(process.cwd(), 'sandbox');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get('project');
    
    const targetDir = projectName 
      ? path.join(SANDBOX_DIR, projectName)
      : SANDBOX_DIR;
    
    if (!fs.existsSync(targetDir)) {
      return NextResponse.json({
        success: false,
        error: 'المشروع غير موجود'
      }, { status: 404 });
    }

    // Create ZIP file using built-in capabilities
    const zipBuffer = await createZipBuffer(targetDir);
    
    const filename = projectName ? `${projectName}.zip` : 'almarjaa-project.zip';
    
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Create ZIP buffer from directory
async function createZipBuffer(dir: string): Promise<Buffer> {
  const files = getAllFiles(dir);
  
  const chunks: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file.path);
    const relativePath = file.relativePath;
    const filename = Buffer.from(relativePath, 'utf-8');
    
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

function getAllFiles(dir: string, baseDir: string = dir): Array<{ path: string; relativePath: string }> {
  const files: Array<{ path: string; relativePath: string }> = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push({ path: fullPath, relativePath });
    }
  }
  
  return files;
}

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

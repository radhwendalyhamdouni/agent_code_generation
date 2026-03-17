/**
 * API للإعدادات
 * Settings API
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'ar',
  fontSize: 14,
  autoSave: true,
  autoSaveDelay: 1000,
  showLineNumbers: true,
  wordWrap: true,
  tabSize: 4,
  aiProvider: 'zai',
  aiModel: 'default',
  terminalFontSize: 13,
  editorFont: 'monospace',
  rtl: true,
  notifications: true,
  soundEffects: false,
};

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load settings
function loadSettings() {
  ensureDataDir();
  
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  
  return DEFAULT_SETTINGS;
}

// Save settings
function saveSettings(settings: any) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// GET - Load settings
export async function GET() {
  try {
    const settings = loadSettings();
    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentSettings = loadSettings();
    const newSettings = { ...currentSettings, ...body };
    
    saveSettings(newSettings);
    
    return NextResponse.json({
      success: true,
      message: 'تم حفظ الإعدادات',
      settings: newSettings
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Reset settings
export async function DELETE() {
  try {
    saveSettings(DEFAULT_SETTINGS);
    
    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين الإعدادات',
      settings: DEFAULT_SETTINGS
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

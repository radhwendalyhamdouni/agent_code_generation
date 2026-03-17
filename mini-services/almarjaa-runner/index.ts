// Al-Marjaa Code Runner Mini Service
// This service handles code execution requests

import { createServer } from 'http';

const PORT = 3030;

// Simple interpreter for Al-Marjaa code (simulated)
class AlMarjaaInterpreter {
  private variables: Map<string, any> = new Map();
  private functions: Map<string, { params: string[], body: string }> = new Map();
  private output: string[] = [];

  // Execute code and return results
  execute(code: string, input?: string): { output: string, error: string | null } {
    this.variables.clear();
    this.functions.clear();
    this.output = [];

    try {
      const lines = this.preprocessCode(code);
      
      for (const line of lines) {
        if (line.trim()) {
          this.executeLine(line, input);
        }
      }

      return {
        output: this.output.join('\n'),
        error: null
      };

    } catch (error: any) {
      return {
        output: this.output.join('\n'),
        error: error.message
      };
    }
  }

  // Preprocess code - normalize Arabic/English characters
  private preprocessCode(code: string): string[] {
    // Normalize semicolons and commas
    let normalized = code
      .replace(/؛/g, ';')
      .replace(/،/g, ',')
      .replace(/٠/g, '0')
      .replace(/١/g, '1')
      .replace(/٢/g, '2')
      .replace(/٣/g, '3')
      .replace(/٤/g, '4')
      .replace(/٥/g, '5')
      .replace(/٦/g, '6')
      .replace(/٧/g, '7')
      .replace(/٨/g, '8')
      .replace(/٩/g, '9');

    // Split by lines or semicolons
    const statements: string[] = [];
    let currentStatement = '';
    let braceDepth = 0;

    for (const char of normalized) {
      currentStatement += char;
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      
      if ((char === ';' || char === '\n') && braceDepth === 0) {
        const trimmed = currentStatement.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }

    // Don't forget the last statement
    const lastTrimmed = currentStatement.trim();
    if (lastTrimmed && !lastTrimmed.startsWith('#') && !lastTrimmed.startsWith('//')) {
      statements.push(lastTrimmed);
    }

    return statements;
  }

  // Execute a single line/statement
  private executeLine(line: string, input?: string): void {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) return;

    // Print statement
    if (line.startsWith('اطبع') || line.startsWith('طبع')) {
      this.handlePrint(line);
      return;
    }

    // Variable declaration
    if (line.startsWith('متغير ') || line.startsWith('م ')) {
      this.handleVariableDeclaration(line);
      return;
    }

    // Constant declaration
    if (line.startsWith('ثابت ') || line.startsWith('ث ')) {
      this.handleVariableDeclaration(line, true);
      return;
    }

    // Function declaration
    if (line.startsWith('دالة ') || line.startsWith('دالة:')) {
      this.handleFunctionDeclaration(line);
      return;
    }

    // If statement
    if (line.startsWith('إذا ') || line.startsWith('اذا ')) {
      this.handleIfStatement(line);
      return;
    }

    // While loop
    if (line.startsWith('طالما ')) {
      this.handleWhileLoop(line);
      return;
    }

    // For loop
    if (line.startsWith('لكل ')) {
      this.handleForLoop(line);
      return;
    }

    // Return statement
    if (line.startsWith('أرجع ') || line.startsWith('ارجع ')) {
      const value = this.evaluateExpression(line.substring(5).replace(/;$/, ''));
      // Return from function - handled by caller
      return;
    }

    // Function call (standalone)
    if (line.includes('(') && line.includes(')')) {
      this.evaluateExpression(line);
      return;
    }

    // Variable assignment
    if (line.includes('=') && !line.includes('==')) {
      this.handleAssignment(line);
      return;
    }
  }

  // Handle print statements
  private handlePrint(line: string): void {
    const match = line.match(/اطبع\s*\(([^)]*)\)|طبع\s*\(([^)]*)\)/);
    if (match) {
      const arg = match[1] || match[2];
      const value = this.evaluateExpression(arg);
      this.output.push(String(value));
    }
  }

  // Handle variable declaration
  private handleVariableDeclaration(line: string, isConst: boolean = false): void {
    const prefix = isConst ? (line.startsWith('ثابت ') ? 'ثابت ' : 'ث ') : (line.startsWith('متغير ') ? 'متغير ' : 'م ');
    const rest = line.substring(prefix.length);
    
    const parts = rest.split('=');
    const name = parts[0].trim();
    
    if (parts.length > 1) {
      const value = this.evaluateExpression(parts[1].replace(/;$/, '').trim());
      this.variables.set(name, value);
    } else {
      this.variables.set(name, null);
    }
  }

  // Handle assignment
  private handleAssignment(line: string): void {
    const parts = line.split('=');
    const name = parts[0].trim();
    const value = this.evaluateExpression(parts[1].replace(/;$/, '').trim());
    this.variables.set(name, value);
  }

  // Handle function declaration
  private handleFunctionDeclaration(line: string): void {
    const match = line.match(/دالة\s+(\w+)\s*\(([^)]*)\)\s*\{([^}]*)\}/);
    if (match) {
      const name = match[1];
      const params = match[2].split(',').map(p => p.trim()).filter(p => p);
      const body = match[3];
      this.functions.set(name, { params, body });
    }
  }

  // Handle if statement (simplified)
  private handleIfStatement(line: string): void {
    const match = line.match(/إذا\s+(.+?)\s*\{([^}]*)\}(?:\s*وإلا\s*\{([^}]*)\})?/);
    if (match) {
      const condition = match[1];
      const thenBlock = match[2];
      const elseBlock = match[3];

      if (this.evaluateCondition(condition)) {
        this.executeBlock(thenBlock);
      } else if (elseBlock) {
        this.executeBlock(elseBlock);
      }
    }
  }

  // Handle while loop
  private handleWhileLoop(line: string): void {
    const match = line.match(/طالما\s+(.+?)\s*\{([^}]*)\}/);
    if (match) {
      const condition = match[1];
      const body = match[2];
      let iterations = 0;
      const maxIterations = 1000;

      while (this.evaluateCondition(condition) && iterations < maxIterations) {
        this.executeBlock(body);
        iterations++;
      }
    }
  }

  // Handle for loop
  private handleForLoop(line: string): void {
    const match = line.match(/لكل\s+(\w+)\s+في\s+(.+?)\s*\{([^}]*)\}/);
    if (match) {
      const varName = match[1];
      const iterable = this.evaluateExpression(match[2]);
      const body = match[3];

      if (Array.isArray(iterable)) {
        for (const item of iterable) {
          this.variables.set(varName, item);
          this.executeBlock(body);
        }
      }
    }
  }

  // Execute a block of code
  private executeBlock(block: string): void {
    const statements = block.split(/[;\n]/).filter(s => s.trim());
    for (const stmt of statements) {
      this.executeLine(stmt);
    }
  }

  // Evaluate condition
  private evaluateCondition(condition: string): boolean {
    condition = condition.trim();
    
    // Handle logical operators
    if (condition.includes(' و ')) {
      const parts = condition.split(' و ');
      return parts.every(p => this.evaluateCondition(p));
    }
    if (condition.includes(' أو ')) {
      const parts = condition.split(' أو ');
      return parts.some(p => this.evaluateCondition(p));
    }
    if (condition.startsWith('ليس ')) {
      return !this.evaluateCondition(condition.substring(4));
    }

    // Handle comparison operators
    for (const op of ['>=', '<=', '!=', '==', '>', '<']) {
      if (condition.includes(op)) {
        const [left, right] = condition.split(op);
        const leftVal = this.evaluateExpression(left);
        const rightVal = this.evaluateExpression(right);

        switch (op) {
          case '==': return leftVal == rightVal;
          case '!=': return leftVal != rightVal;
          case '>': return Number(leftVal) > Number(rightVal);
          case '<': return Number(leftVal) < Number(rightVal);
          case '>=': return Number(leftVal) >= Number(rightVal);
          case '<=': return Number(leftVal) <= Number(rightVal);
        }
      }
    }

    // Boolean values
    if (condition === 'صح' || condition === 'true') return true;
    if (condition === 'خطأ' || condition === 'false') return false;

    // Evaluate as expression
    return Boolean(this.evaluateExpression(condition));
  }

  // Evaluate expression
  private evaluateExpression(expr: string): any {
    expr = expr.trim();

    // String literals
    if ((expr.startsWith('"') && expr.endsWith('"')) ||
        (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    // Boolean literals
    if (expr === 'صح' || expr === 'true') return true;
    if (expr === 'خطأ' || expr === 'false') return false;
    if (expr === 'لا_شيء' || expr === 'null') return null;

    // Numbers
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return parseFloat(expr);
    }

    // List literal
    if (expr.startsWith('[') && expr.endsWith(']')) {
      const inner = expr.slice(1, -1);
      if (!inner.trim()) return [];
      const items = inner.split(',').map(item => this.evaluateExpression(item.trim()));
      return items;
    }

    // Dictionary literal
    if (expr.startsWith('{') && expr.endsWith('}')) {
      const inner = expr.slice(1, -1);
      if (!inner.trim()) return {};
      const obj: any = {};
      const pairs = inner.split(',');
      for (const pair of pairs) {
        const [key, value] = pair.split(':');
        obj[key.trim()] = this.evaluateExpression(value.trim());
      }
      return obj;
    }

    // Property access
    if (expr.includes('.')) {
      const parts = expr.split('.');
      let value = this.variables.get(parts[0]);
      for (let i = 1; i < parts.length; i++) {
        if (value && typeof value === 'object') {
          value = value[parts[i]];
        }
      }
      return value;
    }

    // Index access
    if (expr.includes('[') && expr.includes(']')) {
      const match = expr.match(/(\w+)\[(.+)\]/);
      if (match) {
        const list = this.variables.get(match[1]);
        const index = Number(this.evaluateExpression(match[2]));
        if (Array.isArray(list)) {
          return list[index];
        }
      }
    }

    // Function call
    if (expr.includes('(') && expr.includes(')')) {
      const match = expr.match(/(\w+)\s*\(([^)]*)\)/);
      if (match) {
        const funcName = match[1];
        const args = match[2] ? match[2].split(',').map(a => this.evaluateExpression(a.trim())) : [];

        // Built-in functions
        if (funcName === 'طول' || funcName === 'length') {
          const val = args[0];
          if (typeof val === 'string') return val.length;
          if (Array.isArray(val)) return val.length;
          return 0;
        }
        if (funcName === 'نص' || funcName === 'text' || funcName === 'str') {
          return String(args[0]);
        }
        if (funcName === 'رقم' || funcName === 'number') {
          return Number(args[0]);
        }
        if (funcName === 'مجموع' || funcName === 'sum') {
          if (Array.isArray(args[0])) return args[0].reduce((a: number, b: number) => a + b, 0);
          return 0;
        }
        if (funcName === 'نطاق' || funcName === 'range') {
          const start = args[0] || 0;
          const end = args[1] || args[0];
          const step = args[2] || 1;
          const result = [];
          for (let i = start; i < end; i += step) {
            result.push(i);
          }
          return result;
        }

        // User-defined functions
        const func = this.functions.get(funcName);
        if (func) {
          const oldVars = new Map(this.variables);
          for (let i = 0; i < func.params.length; i++) {
            this.variables.set(func.params[i], args[i]);
          }
          this.executeBlock(func.body);
          this.variables = oldVars;
          return this.variables.get(`__return_${funcName}`);
        }
      }
    }

    // Arithmetic operations
    for (const op of ['+', '-', '*', '/', '%', '^']) {
      // Find the operator not inside quotes or parentheses
      let depth = 0;
      for (let i = expr.length - 1; i >= 0; i--) {
        if (expr[i] === ')') depth++;
        if (expr[i] === '(') depth--;
        if (depth === 0 && expr[i] === op) {
          const left = this.evaluateExpression(expr.substring(0, i));
          const right = this.evaluateExpression(expr.substring(i + 1));
          switch (op) {
            case '+': return (Number(left) || 0) + (Number(right) || 0);
            case '-': return (Number(left) || 0) - (Number(right) || 0);
            case '*': return (Number(left) || 0) * (Number(right) || 0);
            case '/': return (Number(left) || 0) / (Number(right) || 0);
            case '%': return (Number(left) || 0) % (Number(right) || 0);
            case '^': return Math.pow(Number(left) || 0, Number(right) || 0);
          }
        }
      }
    }

    // Variable lookup
    if (this.variables.has(expr)) {
      return this.variables.get(expr);
    }

    // String concatenation with +
    if (expr.includes('+')) {
      const parts = expr.split('+').map(p => this.evaluateExpression(p.trim()));
      if (parts.some(p => typeof p === 'string')) {
        return parts.join('');
      }
    }

    return expr; // Return as-is if nothing matches
  }
}

// Create HTTP server
const interpreter = new AlMarjaaInterpreter();

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (req.method === 'POST' && url.pathname === '/execute') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { code, input } = JSON.parse(body);
        const startTime = Date.now();
        const result = interpreter.execute(code, input);
        const duration = Date.now() - startTime;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: !result.error,
          output: result.output,
          error: result.error,
          duration
        }));
      } catch (error: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Health check
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'almarjaa-runner' }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    service: 'Al-Marjaa Code Runner',
    version: '1.0.0',
    endpoints: {
      'POST /execute': 'Execute Al-Marjaa code',
      'GET /health': 'Health check'
    }
  }));
});

server.listen(PORT, () => {
  console.log(`🚀 Al-Marjaa Runner listening on port ${PORT}`);
});

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { AsyncLocalStorage } from 'async_hooks';

export const adminContext = new AsyncLocalStorage<{ adminId: string }>();

let dbPath = path.join(process.cwd(), 'hospital.db');

if (process.env.VERCEL) {
  const tmpPath = path.join('/tmp', 'hospital.db');
  if (!fs.existsSync(tmpPath)) {
    try {
      const srcPath = path.join(process.cwd(), 'hospital.db');
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, tmpPath);
        console.log('Database successfully copied to /tmp/hospital.db');
      }
    } catch (err) {
      console.error('Failed to copy database to /tmp:', err);
    }
  }
  dbPath = tmpPath;
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Simple SQL query rewriter for multi-tenancy
function rewriteSql(sql: string, adminId: string): { sql: string; addParam: boolean } {
  const upper = sql.toUpperCase();

  // Do not rewrite administrative or structural queries
  if (
    upper.startsWith('CREATE ') ||
    upper.startsWith('ALTER ') ||
    upper.startsWith('PRAGMA ') ||
    upper.startsWith('DROP ')
  ) {
    return { sql, addParam: false };
  }

  // Do not rewrite operations on admins or sqlite system tables
  if (
    upper.includes(' FROM ADMINS') ||
    upper.includes(' INTO ADMINS') ||
    upper.includes(' UPDATE ADMINS') ||
    upper.includes('sqlite_')
  ) {
    return { sql, addParam: false };
  }

  // Suffix separation (ORDER BY, LIMIT, GROUP BY)
  const suffixKeywords = ['ORDER BY', 'LIMIT', 'GROUP BY'];
  let suffixIndex = -1;
  for (const kw of suffixKeywords) {
    const idx = upper.indexOf(' ' + kw);
    if (idx !== -1 && (suffixIndex === -1 || idx < suffixIndex)) {
      suffixIndex = idx;
    }
  }

  const mainPart = suffixIndex !== -1 ? sql.slice(0, suffixIndex) : sql;
  const suffixPart = suffixIndex !== -1 ? sql.slice(suffixIndex) : '';

  let rewrittenMain = mainPart;
  let addParam = true;

  if (upper.includes('INSERT INTO ') || upper.includes('INSERT OR REPLACE INTO ')) {
    const openParen = mainPart.indexOf('(');
    const closeParen = mainPart.indexOf(')');
    const valuesIndex = upper.indexOf(' VALUES');
    const valuesOpenParen = mainPart.indexOf('(', valuesIndex);
    const valuesCloseParen = mainPart.lastIndexOf(')');

    if (openParen !== -1 && closeParen !== -1 && valuesOpenParen !== -1 && valuesCloseParen !== -1) {
      rewrittenMain =
        mainPart.slice(0, closeParen) +
        ', admin_id' +
        mainPart.slice(closeParen, valuesOpenParen) +
        mainPart.slice(valuesOpenParen, valuesCloseParen) +
        ', ?' +
        mainPart.slice(valuesCloseParen);
    } else {
      addParam = false;
    }
  } else {
    // SELECT, UPDATE, DELETE queries
    const whereMatch = mainPart.match(/\bwhere\b/i);
    if (whereMatch) {
      const whereIndex = whereMatch.index!;
      const beforeWhere = mainPart.slice(0, whereIndex);
      const afterWhere = mainPart.slice(whereIndex + 5);
      rewrittenMain = `${beforeWhere} WHERE (${afterWhere}) AND admin_id = ?`;
    } else {
      rewrittenMain = `${mainPart} WHERE admin_id = ?`;
    }
  }

  return { sql: rewrittenMain + suffixPart, addParam };
}

const originalPrepare = db.prepare;
db.prepare = function (this: any, sql: string, ...outerParams: any[]) {
  const store = adminContext.getStore();
  const adminId = store?.adminId;

  if (!adminId) {
    return originalPrepare.call(this, sql, ...outerParams);
  }

  const { sql: rewrittenSql, addParam } = rewriteSql(sql, adminId);
  const stmt = originalPrepare.call(this, rewrittenSql, ...outerParams);

  if (!addParam) {
    return stmt;
  }

  const originalAll = stmt.all;
  stmt.all = function (this: any, ...params: any[]) {
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
      const boundObj = { ...params[0], admin_id: adminId };
      return originalAll.call(this, boundObj);
    }
    return originalAll.call(this, ...params, adminId);
  };

  const originalGet = stmt.get;
  stmt.get = function (this: any, ...params: any[]) {
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
      const boundObj = { ...params[0], admin_id: adminId };
      return originalGet.call(this, boundObj);
    }
    return originalGet.call(this, ...params, adminId);
  };

  const originalRun = stmt.run;
  stmt.run = function (this: any, ...params: any[]) {
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
      const boundObj = { ...params[0], admin_id: adminId };
      return originalRun.call(this, boundObj);
    }
    return originalRun.call(this, ...params, adminId);
  };

  return stmt;
};

export default db;

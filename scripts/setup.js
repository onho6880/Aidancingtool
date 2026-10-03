/**
 * VidAI Studio — Initial setup script
 * Run: node scripts/setup.js
 */

const fs   = require('fs');
const path = require('path');

const DIRS = [
  './data/uploads',
  './data/results',
  './data/db',
];

console.log('🚀 VidAI Studio — Setup\n');

// Create data directories
DIRS.forEach(dir => {
  const abs = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(abs)) {
    fs.mkdirSync(abs, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  } else {
    console.log(`   Exists:  ${dir}`);
  }
});

// Create .env.local from .env.example if missing
const envLocal   = path.resolve(process.cwd(), '.env.local');
const envExample = path.resolve(process.cwd(), '.env.example');

if (!fs.existsSync(envLocal) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envLocal);
  console.log('\n✅ Created .env.local from .env.example');
  console.log('   ⚠️  Điền API keys vào .env.local trước khi chạy app!');
} else if (fs.existsSync(envLocal)) {
  console.log('\n   .env.local đã tồn tại');
}

console.log('\n✨ Setup xong! Bước tiếp theo:');
console.log('   1. Chỉnh sửa .env.local và điền API keys');
console.log('   2. npm run dev     — chạy development');
console.log('   3. npm run worker  — chạy background worker (terminal riêng)');
console.log('   4. Truy cập http://localhost:3000\n');

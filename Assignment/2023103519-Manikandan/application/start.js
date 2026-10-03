const { spawn } = require('child_process');
const path = require('path');

console.log('===========================================================');
console.log('🚀 Starting Enterprise Agentic AI Orchestration Platform');
console.log('   Author: Manikandan (Roll No: 2023103519)');
console.log('===========================================================');

const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

backend.on('close', (code) => {
  console.log(`Backend service exited with code ${code}`);
});

frontend.on('close', (code) => {
  console.log(`Frontend service exited with code ${code}`);
});

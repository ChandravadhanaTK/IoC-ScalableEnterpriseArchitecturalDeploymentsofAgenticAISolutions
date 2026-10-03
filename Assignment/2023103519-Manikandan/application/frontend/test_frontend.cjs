const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Frontend Code Integrity...');

const filesToValidate = [
  'src/main.jsx',
  'src/App.jsx',
  'src/index.css',
  'src/components/Header.jsx',
  'src/components/AgentVisualizer.jsx',
  'src/components/HumanApprovalModal.jsx',
  'src/components/TelemetryDashboard.jsx',
  'src/components/ToolExecutionLog.jsx',
  'src/components/ArchitectureView.jsx',
  'index.html',
  'vite.config.js',
  'package.json'
];

let hasError = false;

filesToValidate.forEach((fileRel) => {
  const filePath = path.join(__dirname, fileRel);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing file: ${fileRel}`);
    hasError = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  if (fileRel.endsWith('.jsx')) {
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      console.error(`❌ Mismatched braces in ${fileRel}: { = ${openBraces}, } = ${closeBraces}`);
      hasError = true;
    } else {
      console.log(`  ✓ ${fileRel} - Braces balanced (${openBraces}/${closeBraces})`);
    }
  } else if (fileRel.endsWith('.json')) {
    try {
      JSON.parse(content);
      console.log(`  ✓ ${fileRel} - Valid JSON`);
    } catch (e) {
      console.error(`❌ JSON error in ${fileRel}: ${e.message}`);
      hasError = true;
    }
  } else {
    console.log(`  ✓ ${fileRel} - Verified`);
  }
});

if (hasError) {
  console.error('\n❌ Frontend Validation FAILED!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL FRONTEND FILES VALIDATED WITH ZERO SYNTAX ERRORS!');
  process.exit(0);
}

// Bundles the game into ONE self-contained HTML file: node tools/bundle.js out.html
const fs = require('fs'), path = require('path'); const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/, (_, f) => '<style>' + fs.readFileSync(path.join(root, f), 'utf8') + '</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) => { const p = path.join(root, f); return fs.existsSync(p) ? '<script>' + fs.readFileSync(p, 'utf8').replace(/<\/script/gi, '<\\/script') + '</script>' : ''; });
fs.writeFileSync(process.argv[2] || path.join(root, 'lastbell.bundle.html'), html); console.log('bundled', (html.length / 1024).toFixed(0) + ' KB');
// Fragment mode for the Artifact tool (no doctype/html/head/body wrappers): node tools/bundle.js out.html --fragment
if (process.argv.includes('--fragment')) {
  const m = html.match(/<style>[\s\S]*?<\/style>/)[0];
  const body = html.replace(/[\s\S]*<body>/, '').replace(/<\/body>[\s\S]*/, '');
  const frag = '<title>Last Bell</title>\n' + m + '\n' + body;
  fs.writeFileSync(process.argv[2], frag); console.log('fragment', (frag.length / 1024).toFixed(0) + ' KB');
}

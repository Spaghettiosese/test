// node shapewatch/tools/build-artifact.mjs <out.html> — bundles the game into one self-contained HTML fragment
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname, out = process.argv[2] || '/tmp/shapewatch-artifact.html';
const js = execFileSync('/tmp/bnd/node_modules/.bin/esbuild', [root + 'src/main.js', '--bundle', '--minify', '--format=iife', '--target=es2022'], { maxBuffer: 1e9 }).toString().replace(/<\/script/g, '<\\/script');
const css = readFileSync(root + 'style.css', 'utf8');
const body = readFileSync(root + 'index.html', 'utf8').split('<body>')[1].split('<script type="module"')[0];
writeFileSync(out, `<title>ShapeWatch</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Barlow:wght@400;500;600;700&display=swap">\n<style>\n${css}\n</style>\n${body}\n<script>\n${js}\n</script>\n`);
console.log('wrote', out);

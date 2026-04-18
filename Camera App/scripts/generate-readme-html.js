const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

const md = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Letter Lens - README</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Nunito, Helvetica, Arial, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
      line-height: 1.6;
      color: #2d2d2d;
      background: #fff8f0;
    }
    h1, h2, h3 { color: #333; }
    h1 { border-bottom: 3px solid #4CC9F0; padding-bottom: 8px; }
    h2 { border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 32px; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    a { color: #4CC9F0; }
    ul { padding-left: 24px; }
    li { margin: 4px 0; }
    .task-list-item { list-style: none; margin-left: -20px; }
    input[type="checkbox"] { margin-right: 6px; }
  </style>
</head>
<body>
${body}
</body>
</html>`;

const outPath = path.join(__dirname, '..', 'README.html');
fs.writeFileSync(outPath, html);
console.log('Generated README.html (' + html.length + ' bytes)');

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const specPath = path.join(process.cwd(), 'public', 'openapi.json');
    let specContent = '{}';
    if (fs.existsSync(specPath)) {
      specContent = fs.readFileSync(specPath, 'utf-8');
    }

    const html = `<!doctype html>
<html lang="en">
  <head>
    <title>WhatToCook API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/app_icon.png" />
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #0b0c10;
      }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      type="application/json"
      data-configuration='{
        "theme": "purple",
        "darkMode": true,
        "showSidebar": true,
        "searchHotKey": "k",
        "metaData": {
          "title": "WhatToCook API Reference",
          "description": "Comprehensive REST API documentation for WhatToCook culinary planning platform"
        },
        "defaultHttpClient": {
          "targetKey": "javascript",
          "clientKey": "fetch"
        }
      }'>
      ${specContent}
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error serving Scalar documentation:', error);
    return new NextResponse('Failed to load documentation', { status: 500 });
  }
}


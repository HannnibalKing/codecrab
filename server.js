const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'tasks.json');

function readTasks() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [
      { id: 'seed-1', text: 'Set project milestones', completed: false },
      { id: 'seed-2', text: 'Review build checklist', completed: true },
      { id: 'seed-3', text: 'Prepare demo handoff', completed: false },
    ];
  }
}

function writeTasks(tasks) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

function serveStaticFile(response, filePath) {
  const safePath = path.normalize(filePath);
  const fullPath = path.join(ROOT, safePath);

  if (!fullPath.startsWith(ROOT)) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(fullPath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';

    response.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  if (url.pathname === '/api/tasks') {
    if (request.method === 'GET') {
      sendJson(response, 200, readTasks());
      return;
    }

    if (request.method === 'PUT') {
      let body = '';
      request.on('data', chunk => {
        body += chunk;
      });

      request.on('end', () => {
        try {
          const parsed = JSON.parse(body || '[]');
          const tasks = Array.isArray(parsed) ? parsed : [];
          writeTasks(tasks);
          sendJson(response, 200, tasks);
        } catch (error) {
          sendJson(response, 400, { error: 'Invalid task payload' });
        }
      });
      return;
    }

    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  serveStaticFile(response, requestedPath);
});

server.listen(PORT, () => {
  console.log(`CodeCrab API ready on http://localhost:${PORT}`);
});

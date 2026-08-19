const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'tasks.json');

function isTask(value) {
  return value && typeof value === 'object'
    && typeof value.id === 'string'
    && typeof value.text === 'string'
    && value.text.trim().length > 0
    && value.text.length <= 120
    && typeof value.completed === 'boolean';
}

function validateTasks(value) {
  if (!Array.isArray(value) || !value.every(isTask)) {
    return { valid: false, error: 'Tasks must contain id, text, and completed fields' };
  }

  const ids = new Set(value.map(task => task.id));
  if (ids.size !== value.length) {
    return { valid: false, error: 'Task ids must be unique' };
  }

  return {
    valid: true,
    tasks: value.map(task => ({ id: task.id, text: task.text.trim(), completed: task.completed })),
  };
}

function readTasks() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const validation = validateTasks(parsed);
    return validation.valid ? validation.tasks : [];
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
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(tasks, null, 2));
  fs.renameSync(temporaryFile, DATA_FILE);
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
  const relativePath = path.relative(ROOT, fullPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
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
    if (request.method === 'GET' && url.searchParams.has('health')) {
      sendJson(response, 200, { status: 'ok', taskCount: readTasks().length });
      return;
    }

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
          const validation = validateTasks(parsed);
          if (!validation.valid) {
            sendJson(response, 400, { error: validation.error });
            return;
          }
          writeTasks(validation.tasks);
          sendJson(response, 200, validation.tasks);
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

module.exports = { isTask, validateTasks, readTasks, writeTasks, server };

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`CodeCrab API ready on http://localhost:${PORT}`);
  });
}

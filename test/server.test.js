const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { server, validateTasks } = require('../server');

function request(port, method, path, payload) {
  return new Promise((resolve, reject) => {
    const body = payload === undefined ? undefined : JSON.stringify(payload);
    const request = http.request({
      port,
      method,
      path,
      headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {},
    }, response => {
      let result = '';
      response.on('data', chunk => { result += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(result) }));
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

test('validates task shape and unique ids', () => {
  assert.equal(validateTasks([{ id: '1', text: 'Ship it', completed: false }]).valid, true);
  assert.equal(validateTasks([{ id: '1', text: '', completed: false }]).valid, false);
  assert.equal(validateTasks([{ id: '1', text: 'A', completed: false }, { id: '1', text: 'B', completed: false }]).valid, false);
});

test('serves health and rejects malformed task payloads', async () => {
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  const health = await request(port, 'GET', '/api/tasks?health=1');
  const invalid = await request(port, 'PUT', '/api/tasks', [{ id: 'bad', text: '', completed: false }]);
  server.close();
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');
  assert.equal(invalid.status, 400);
});

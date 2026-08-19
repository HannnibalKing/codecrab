# CodeCrab

CodeCrab is a lightweight task-tracking and project status dashboard designed to keep work organized and progress visible. It is intentionally simple, fast, and dependency-free so it can run immediately in any browser.

## Features

- Add project tasks
- Mark tasks complete or incomplete
- Filter tasks by all, active, or completed
- Track summary statistics
- Persist tasks in browser local storage
- Responsive layout for desktop and mobile
- Empty-state handling for a clean first-run experience
- Validated API payloads with unique task ids
- Atomic JSON writes to avoid partial task files
- Health endpoint for deployment checks: `GET /api/tasks?health=1`

## Run locally

From the project folder:

```bash
node server.js
```

Then open:

```text
http://localhost:3000
```

For a static-only fallback, you can still run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Project structure

- `index.html` — app shell
- `styles.css` — interface styling
- `app.js` — task logic and storage
- `.gitignore` — excludes editor and OS artifacts

## Project status

This project is now in a clean, usable, and testable state. It includes the core workflow, visible project stats, responsive styling, local persistence, and a polished empty-state experience.

## Future database hook

The app is designed to support a future backend without forcing a rewrite. A `window.CodeCrabDB` adapter can be attached later with `read()`, `write(tasks)`, and `sync(tasks)` methods. If no adapter is present, the app falls back to browser local storage automatically.

A matching Node API is included in `server.js`, which exposes:

- `GET /api/tasks`
- `PUT /api/tasks`
- `GET /api/tasks?health=1`

The API accepts task objects with a string `id`, non-empty `text` up to 120 characters, and boolean `completed`. Invalid shapes and duplicate ids return `400`.

Example frontend adapter:

```js
window.CodeCrabDB = {
  async read() {
    const response = await fetch('/api/tasks');
    return response.json();
  },
  async write(tasks) {
    return fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    });
  },
  async sync(tasks) {
    return this.write(tasks);
  },
};
```

This keeps the current app working while preparing for a real database-backed version later.

## Completion checklist

- [x] App loads from a browser
- [x] Add task flow works
- [x] Toggle task completion works
- [x] Delete task flow works
- [x] Filter tasks works
- [x] Clear completed works
- [x] Local persistence works
- [x] README and project structure are present

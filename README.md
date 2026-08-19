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

## Run locally

From the project folder:

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

## Completion checklist

- [x] App loads from a browser
- [x] Add task flow works
- [x] Toggle task completion works
- [x] Delete task flow works
- [x] Filter tasks works
- [x] Clear completed works
- [x] Local persistence works
- [x] README and project structure are present

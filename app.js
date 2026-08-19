const STORAGE_KEY = 'codecrab.tasks';
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskTemplate = document.getElementById('task-template');
const totalCount = document.getElementById('total-count');
const activeCount = document.getElementById('active-count');
const completedCount = document.getElementById('completed-count');
const filterButtons = [...document.querySelectorAll('.filter')];
const clearCompletedButton = document.getElementById('clear-completed');

const fallbackLocalStorageAdapter = {
  read() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return [
          { id: crypto.randomUUID(), text: 'Set project milestones', completed: false },
          { id: crypto.randomUUID(), text: 'Review build checklist', completed: true },
          { id: crypto.randomUUID(), text: 'Prepare demo handoff', completed: false },
        ];
      }

      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  },
  write(nextTasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
  },
  sync() {
    return Promise.resolve();
  },
};

const databaseHook = window.CodeCrabDB || {
  async read() {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.warn('API unavailable, using local storage fallback:', error);
      return fallbackLocalStorageAdapter.read();
    }
  },
  async write(nextTasks) {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextTasks),
      });

      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.warn('API write failed, using local storage fallback:', error);
      fallbackLocalStorageAdapter.write(nextTasks);
      return nextTasks;
    }
  },
  async sync(tasks) {
    return this.write(tasks);
  },
};

let tasks = [];
let activeFilter = 'all';

async function loadTasks() {
  try {
    const fromDatabase = await Promise.resolve(databaseHook.read());
    tasks = Array.isArray(fromDatabase) ? fromDatabase : [];
  } catch (error) {
    console.warn('Falling back to local storage:', error);
    tasks = fallbackLocalStorageAdapter.read();
  }

  if (!tasks.length) {
    tasks = [
      { id: crypto.randomUUID(), text: 'Set project milestones', completed: false },
      { id: crypto.randomUUID(), text: 'Review build checklist', completed: true },
      { id: crypto.randomUUID(), text: 'Prepare demo handoff', completed: false },
    ];
  }

  render();
}

function saveTasks() {
  Promise.resolve(databaseHook.write(tasks)).catch(error => {
    console.warn('Background sync skipped:', error);
  });
}

function renderStats() {
  const total = tasks.length;
  const done = tasks.filter(task => task.completed).length;
  const active = total - done;

  totalCount.textContent = String(total);
  activeCount.textContent = String(active);
  completedCount.textContent = String(done);
}

function getFilteredTasks() {
  if (activeFilter === 'active') {
    return tasks.filter(task => !task.completed);
  }

  if (activeFilter === 'completed') {
    return tasks.filter(task => task.completed);
  }

  return tasks;
}

function renderTasks() {
  taskList.innerHTML = '';
  const filtered = getFilteredTasks();

  emptyState.hidden = filtered.length > 0;

  filtered.forEach(task => {
    const clone = taskTemplate.content.firstElementChild.cloneNode(true);
    const textNode = clone.querySelector('.task-text');
    const checkbox = clone.querySelector('input');
    const deleteButton = clone.querySelector('.delete-button');

    textNode.textContent = task.text;
    checkbox.checked = task.completed;
    clone.classList.toggle('completed', task.completed);

    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveTasks();
      render();
    });

    deleteButton.addEventListener('click', () => {
      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      render();
    });

    taskList.appendChild(clone);
  });
}

function render() {
  renderStats();
  renderTasks();
}

taskForm.addEventListener('submit', event => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  const alreadyExists = tasks.some(task => task.text.toLowerCase() === text.toLowerCase());
  if (alreadyExists) {
    taskInput.value = '';
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
  });

  taskInput.value = '';
  saveTasks();
  render();
  taskInput.focus();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle('active', item === button));
    renderTasks();
  });
});

clearCompletedButton.addEventListener('click', () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
});

render();

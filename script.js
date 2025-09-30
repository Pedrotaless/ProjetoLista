// script.js — Versão com diagnóstico e tratamento de erros
'use strict';

const STORAGE_KEY = 'todo.tasks';

class TaskManager {
  constructor(listElement) {
    if (!listElement) throw new Error('Elemento de lista não encontrado. Verifique se existe <ul id="task-list"> no HTML.');
    this.listElement = listElement;
    this.tasks = [];
    this.filter = 'all';
    this.useLocalStorage = this._checkLocalStorage();
    this.load();
  }

  _checkLocalStorage() {
    try {
      const testKey = '__todo_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage indisponível — usarei somente memória enquanto a página estiver aberta.', e);
      return false;
    }
  }

  load() {
    if (!this.useLocalStorage) { this.tasks = []; return; }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { this.tasks = []; return; }
    try {
      this.tasks = JSON.parse(raw) || [];
    } catch (e) {
      console.error('Erro ao ler/parsear localStorage. Resetando storage.', e);
      this.tasks = [];
      try { localStorage.removeItem(STORAGE_KEY); } catch (_){}
    }
  }

  save() {
    if (!this.useLocalStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('Falha ao salvar no localStorage (quota ou bloqueio).', e);
    }
  }

  addTask(title, description = '') {
    const t = (title || '').trim();
    if (!t) return null;
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      title: t,
      description: (description || '').trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.tasks.unshift(task);
    this.save();
    console.log('Task adicionada:', task);
    this.render();
    return task;
  }

  deleteTask(id) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    this.save();
    console.log('Task removida (id):', id);
    this.render();
    return true;
  }

  toggleTask(id) {
    const t = this.tasks.find(x => x.id === id);
    if (!t) return false;
    t.completed = !t.completed;
    this.save();
    console.log('Task alternada (id):', id, 'completed=', t.completed);
    this.render();
    return true;
  }

  setFilter(f) {
    this.filter = f;
    this.render();
  }

  filteredTasks() {
    if (this.filter === 'all') return this.tasks;
    if (this.filter === 'pending') return this.tasks.filter(t => !t.completed);
    if (this.filter === 'completed') return this.tasks.filter(t => t.completed);
    return this.tasks;
  }

  createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const dot = document.createElement('span');
    dot.className = 'complete-dot';
    dot.title = task.completed ? 'Reativar tarefa' : 'Marcar como concluída';
    dot.addEventListener('click', () => this.toggleTask(task.id));

    const meta = document.createElement('div');
    meta.className = 'meta';
    const h3 = document.createElement('h3');
    h3.textContent = task.title;
    const p = document.createElement('p');
    p.textContent = task.description || '';
    meta.appendChild(h3);
    meta.appendChild(p);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.textContent = 'Remover';
    delBtn.addEventListener('click', () => {
      const ok = confirm('Deseja realmente remover esta tarefa?');
      if (!ok) return;
      this.deleteTask(task.id);
    });
    actions.appendChild(delBtn);

    li.appendChild(dot);
    li.appendChild(meta);
    li.appendChild(actions);

    return li;
  }

  render() {
    // limpa lista de forma segura
    while (this.listElement.firstChild) this.listElement.removeChild(this.listElement.firstChild);

    const tasks = this.filteredTasks();
    if (!tasks.length) {
      const liEmpty = document.createElement('li');
      liEmpty.className = 'empty';
      liEmpty.textContent = 'Nenhuma tarefa encontrada.';
      this.listElement.appendChild(liEmpty);
      console.log('Render: nenhuma tarefa para mostrar.');
      return;
    }

    const frag = document.createDocumentFragment();
    tasks.forEach(t => frag.appendChild(this.createTaskElement(t)));
    this.listElement.appendChild(frag);
    console.log(`Render: ${tasks.length} tarefa(s) mostrada(s). Filtro="${this.filter}"`);
  }
}

/* --- wiring DOM --- */
document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('task-list');
  const form = document.getElementById('task-form');
  const titleInput = document.getElementById('task-title');
  const descInput = document.getElementById('task-desc');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Verificações básicas de sanidade
  if (!listEl) return console.error('Erro: elemento #task-list não encontrado no DOM.');
  if (!form) return console.error('Erro: formulário #task-form não encontrado no DOM.');

  const manager = new TaskManager(listEl);
  manager.render();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value;
    const desc = descInput.value;
    if (!title || !title.trim()) {
      titleInput.focus();
      return;
    }
    manager.addTask(title, desc);
    form.reset();
    titleInput.focus();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      const f = btn.dataset.filter;
      manager.setFilter(f);
    });
  });
});

'use strict'; 
// Ativa o modo estrito do JavaScript para evitar erros silenciosos e boas práticas de código.

const STORAGE_KEY = 'todo.tasks'; 
// Chave usada para salvar e recuperar as tarefas do localStorage.

/* ------------------------------ CLASSE PRINCIPAL ------------------------------ */
class TaskManager {
  constructor(listElement) {
    // Verifica se o elemento de lista existe
    if (!listElement) throw new Error('Elemento de lista não encontrado.');
    this.listElement = listElement; // Referência ao elemento da lista no HTML
    this.tasks = []; // Array onde as tarefas serão armazenadas
    this.filter = 'all'; // Filtro inicial (todas as tarefas)
    this.useLocalStorage = this._checkLocalStorage(); // Verifica se o navegador suporta localStorage
    this.load(); // Carrega tarefas salvas
  }

  /* --- Verifica se o localStorage está disponível --- */
  _checkLocalStorage() {
    try {
      const testKey = '__todo_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true; // Se funcionou, retorna verdadeiro
    } catch {
      return false; // Caso contrário, desativa o uso do localStorage
    }
  }

  /* --- Carrega as tarefas do localStorage --- */
  load() {
    if (!this.useLocalStorage) { this.tasks = []; return; }
    const raw = localStorage.getItem(STORAGE_KEY); // Busca as tarefas salvas
    this.tasks = raw ? JSON.parse(raw) : []; // Converte JSON em array de objetos
  }

  /* --- Salva as tarefas no localStorage --- */
  save() {
    if (this.useLocalStorage) 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
  }

  /* --- Adiciona uma nova tarefa --- */
  addTask(title, description = '') {
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), // Cria ID único
      title: title.trim(), // Remove espaços extras do título
      description: description.trim(), // Remove espaços da descrição
      completed: false // Define como não concluída
    };
    this.tasks.unshift(task); // Adiciona no início da lista
    this.save(); // Salva no localStorage
    this.render(); // Atualiza a interface
  }

  /* --- Remove uma tarefa pelo ID --- */
  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id); // Filtra e mantém as tarefas diferentes do ID
    this.save();
    this.render();
  }

  /* --- Alterna o estado de conclusão da tarefa --- */
  toggleTask(id) {
    const t = this.tasks.find(x => x.id === id); // Busca a tarefa pelo ID
    if (!t) return; // Se não encontrar, sai da função
    t.completed = !t.completed; // Inverte o estado (true ↔ false)
    this.save();
    this.render();
  }

  /* --- Define qual filtro está ativo (todas, pendentes, concluídas) --- */
  setFilter(f) {
    this.filter = f;
    this.render();
  }

  /* --- Retorna a lista de tarefas de acordo com o filtro selecionado --- */
  filteredTasks() {
    if (this.filter === 'all') return this.tasks; // Todas
    if (this.filter === 'pending') return this.tasks.filter(t => !t.completed); // Pendentes
    if (this.filter === 'completed') return this.tasks.filter(t => t.completed); // Concluídas
    return this.tasks;
  }

  /* --- Cria o elemento visual (HTML) de uma tarefa --- */
  createTaskElement(task) {
    const li = document.createElement('li'); // Cria item da lista
    li.className = 'task-item' + (task.completed ? ' completed' : ''); // Adiciona classe se estiver concluída
    li.dataset.id = task.id; // Armazena o ID da tarefa no HTML

    // ✅ Checkbox de conclusão
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed; // Marca se estiver concluída
    checkbox.addEventListener('change', () => this.toggleTask(task.id)); // Ao clicar, alterna o status

    // Conteúdo da tarefa (título e descrição)
    const meta = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = task.title; // Mostra o título
    const p = document.createElement('p');
    p.textContent = task.description || ''; // Mostra a descrição (ou vazio)
    meta.appendChild(h3);
    meta.appendChild(p);

    // Botão de remover tarefa
    const actions = document.createElement('div');
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Remover';
    delBtn.addEventListener('click', () => {
      if (confirm('Deseja realmente remover esta tarefa?')) this.deleteTask(task.id);
    });
    actions.appendChild(delBtn);

    // Monta o item da lista (li)
    li.appendChild(checkbox);
    li.appendChild(meta);
    li.appendChild(actions);

    return li; // Retorna o elemento pronto
  }

  /* --- Atualiza a lista exibida na tela --- */
  render() {
    // Remove os itens atuais antes de atualizar
    while (this.listElement.firstChild) 
      this.listElement.removeChild(this.listElement.firstChild);

    const tasks = this.filteredTasks(); // Pega as tarefas de acordo com o filtro
    if (!tasks.length) {
      // Caso não haja tarefas, mostra uma mensagem
      const liEmpty = document.createElement('li');
      liEmpty.textContent = 'Nenhuma tarefa encontrada.';
      this.listElement.appendChild(liEmpty);
      return;
    }

    // Adiciona cada tarefa na tela
    tasks.forEach(t => this.listElement.appendChild(this.createTaskElement(t)));
  }
}

/* ------------------------------ INTEGRAÇÃO COM O HTML ------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  // Aguarda o carregamento do DOM
  const listEl = document.getElementById('task-list'); // UL onde as tarefas serão listadas
  const form = document.getElementById('task-form'); // Formulário de adicionar tarefa
  const titleInput = document.getElementById('task-title'); // Campo do título
  const descInput = document.getElementById('task-desc'); // Campo da descrição
  const filterBtns = document.querySelectorAll('.filter-btn'); // Botões de filtro (todos, pendentes, concluídos)

  const manager = new TaskManager(listEl); // Cria o gerenciador de tarefas
  manager.render(); // Exibe as tarefas salvas (se existirem)

  // Evento de envio do formulário
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita recarregar a página
    if (!titleInput.value.trim()) { titleInput.focus(); return; } // Impede envio vazio
    manager.addTask(titleInput.value, descInput.value); // Adiciona a nova tarefa
    form.reset(); // Limpa os campos
    titleInput.focus(); // Retorna o foco para o campo título
  });

  // Eventos dos botões de filtro
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove o estado ativo dos outros botões
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); // Destaca o botão atual

      // Atualiza atributo ARIA (acessibilidade)
      filterBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');

      // Aplica o filtro correspondente
      manager.setFilter(btn.dataset.filter);
    });
  });
});

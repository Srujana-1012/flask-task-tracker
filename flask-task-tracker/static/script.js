let editingTaskId = null;

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  loadStats();
  document.getElementById('taskForm').addEventListener('submit', saveTask);
});

// Load and display tasks
function loadTasks() {
  const status = document.getElementById('statusFilter')?.value || '';
  const priority = document.getElementById('priorityFilter')?.value || '';
  
  let url = '/tasks';
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }

  fetch(url)
    .then(res => res.json())
    .then(tasks => {
      const container = document.getElementById('tasksList');
      
      if (tasks.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <h3>📭 No tasks yet</h3>
            <p>Create your first task to get started!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = tasks.map(task => createTaskCard(task)).join('');
    })
    .catch(error => console.error('Error loading tasks:', error));
}

// Create task card HTML
function createTaskCard(task) {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'Completed';
  const isCompleted = task.status === 'Completed';

  const dueDateText = dueDate 
    ? `📅 ${dueDate.toLocaleDateString()}`
    : '';

  return `
    <div class="task-card ${task.priority.toLowerCase()}-priority">
      <div class="task-header">
        <div class="task-title ${isCompleted ? 'strike' : ''}">${escapeHtml(task.title)}</div>
      </div>

      ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}

      <div class="task-badges">
        <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
        <span class="badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
        ${task.category ? `<span class="badge task-category">${escapeHtml(task.category)}</span>` : ''}
      </div>

      <div class="task-footer">
        <div class="task-date">${dueDateText}</div>
        <div class="task-actions">
          ${task.status !== 'Completed' ? `<button class="btn-icon btn-complete" onclick="updateStatus(${task.id}, 'Completed')" title="Mark Complete">✅</button>` : ''}
          <button class="btn-icon btn-edit" onclick="editTask(${task.id})" title="Edit">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Load stats
function loadStats() {
  fetch('/stats')
    .then(res => res.json())
    .then(stats => {
      document.getElementById('totalTasks').textContent = stats.total;
      document.getElementById('completedTasks').textContent = stats.completed;
      document.getElementById('inProgressTasks').textContent = stats.in_progress;
      document.getElementById('progressFill').style.width = stats.progress + '%';
      document.getElementById('progressText').textContent = stats.progress.toFixed(0) + '%';
    })
    .catch(error => console.error('Error loading stats:', error));
}

// Open add task modal
function openAddTaskModal() {
  editingTaskId = null;
  document.getElementById('modalTitle').textContent = 'Add New Task';
  document.getElementById('taskForm').reset();
  document.getElementById('taskModal').classList.add('active');
}

// Close modal
function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('active');
  editingTaskId = null;
}

// Save task
function saveTask(e) {
  e.preventDefault();

  const taskData = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    priority: document.getElementById('taskPriority').value,
    status: document.getElementById('taskStatus').value,
    category: document.getElementById('taskCategory').value,
    due_date: document.getElementById('taskDueDate').value
  };

  const url = editingTaskId ? `/tasks/${editingTaskId}` : '/tasks';
  const method = editingTaskId ? 'PUT' : 'POST';

  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to save task');
      closeTaskModal();
      loadTasks();
      loadStats();
    })
    .catch(error => {
      alert('Error saving task: ' + error.message);
      console.error('Error:', error);
    });
}

// Edit task
function editTask(id) {
  fetch(`/tasks?status=`)
    .then(res => res.json())
    .then(tasks => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        editingTaskId = task.id;
        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDueDate').value = task.due_date || '';
        document.getElementById('taskModal').classList.add('active');
      }
    })
    .catch(error => console.error('Error loading task:', error));
}

// Delete task
function deleteTask(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    fetch(`/tasks/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete task');
        loadTasks();
        loadStats();
      })
      .catch(error => {
        alert('Error deleting task: ' + error.message);
        console.error('Error:', error);
      });
  }
}

// Update task status
function updateStatus(id, newStatus) {
  fetch(`/tasks/${id}/status/${newStatus}`, { method: 'PATCH' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update status');
      loadTasks();
      loadStats();
    })
    .catch(error => {
      alert('Error updating status: ' + error.message);
      console.error('Error:', error);
    });
}

// Apply filters
function applyFilters() {
  loadTasks();
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('taskModal');
  if (e.target === modal) {
    closeTaskModal();
  }
});

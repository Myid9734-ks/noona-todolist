import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    onValue,
    update,
    remove,
    set
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyArfCfUgiP-58Ex3hkDzdPW_wASix2wXdA",
    authDomain: "noona-todo-backend-10fad.firebaseapp.com",
    projectId: "noona-todo-backend-10fad",
    storageBucket: "noona-todo-backend-10fad.firebasestorage.app",
    messagingSenderId: "157370352994",
    appId: "1:157370352994:web:6f3cb8244600114579d83b",
    databaseURL: "https://noona-todo-backend-10fad-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let todos = [];
let editingId = null;

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

loadTodos();

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

async function addTodo() {
    const text = todoInput.value.trim();

    if (text === '') {
        alert('할일을 입력해주세요!');
        return;
    }

    try {
        const todosRef = ref(db, 'todos');
        const newTodoRef = push(todosRef);

        await set(newTodoRef, {
            text: text,
            completed: false,
            createdAt: Date.now()
        });

        todoInput.value = '';
        todoInput.focus();
    } catch (error) {
        console.error("할일 추가 오류:", error);
        alert('할일 추가에 실패했습니다: ' + error.message);
    }
}

async function deleteTodo(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
        try {
            const todoRef = ref(db, `todos/${id}`);
            await remove(todoRef);
        } catch (error) {
            console.error("할일 삭제 오류:", error);
            alert('할일 삭제에 실패했습니다.');
        }
    }
}

async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        try {
            const todoRef = ref(db, `todos/${id}`);
            await update(todoRef, {
                completed: !todo.completed
            });
        } catch (error) {
            console.error("할일 상태 변경 오류:", error);
            alert('할일 상태 변경에 실패했습니다.');
        }
    }
}

function startEdit(id) {
    editingId = id;
    renderTodos();
}

async function saveEdit(id, newText) {
    const text = newText.trim();

    if (text === '') {
        alert('할일을 입력해주세요!');
        return;
    }

    try {
        const todoRef = ref(db, `todos/${id}`);
        await update(todoRef, {
            text: text
        });
        editingId = null;
        renderTodos();
    } catch (error) {
        console.error("할일 수정 오류:", error);
        alert('할일 수정에 실패했습니다.');
    }
}

function cancelEdit() {
    editingId = null;
    renderTodos();
}

function renderTodos() {
    if (todos.length === 0) {
        todoList.innerHTML = '<li class="empty-state">할일이 없습니다.</li>';
    } else {
        todoList.innerHTML = todos.map(todo => {
            if (editingId === todo.id) {
                return `
                    <li class="todo-item ${todo.completed ? 'completed' : ''}">
                        <input
                            type="text"
                            class="todo-input"
                            value="${escapeHtml(todo.text)}"
                            id="edit-input-${todo.id}"
                        />
                        <div class="todo-actions">
                            <button class="save-btn" onclick="window.saveEditWrapper('${todo.id}')">저장</button>
                            <button class="cancel-btn" onclick="window.cancelEditWrapper()">취소</button>
                        </div>
                    </li>
                `;
            } else {
                return `
                    <li class="todo-item ${todo.completed ? 'completed' : ''}">
                        <input
                            type="checkbox"
                            class="todo-checkbox"
                            ${todo.completed ? 'checked' : ''}
                            onchange="window.toggleTodoWrapper('${todo.id}')"
                        />
                        <span class="todo-text">${escapeHtml(todo.text)}</span>
                        <div class="todo-actions">
                            <button class="edit-btn" onclick="window.startEditWrapper('${todo.id}')">수정</button>
                            <button class="delete-btn" onclick="window.deleteTodoWrapper('${todo.id}')">삭제</button>
                        </div>
                    </li>
                `;
            }
        }).join('');
    }
}

function loadTodos() {
    const todosRef = ref(db, 'todos');

    onValue(todosRef, (snapshot) => {
        todos = [];
        const data = snapshot.val();

        if (data) {
            Object.keys(data).forEach((key) => {
                todos.push({
                    id: key,
                    ...data[key]
                });
            });

            todos.sort((a, b) => b.createdAt - a.createdAt);
        }

        renderTodos();
    }, (error) => {
        console.error("할일 로드 오류:", error);
        alert('데이터 로드에 실패했습니다: ' + error.message);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.toggleTodoWrapper = toggleTodo;
window.deleteTodoWrapper = deleteTodo;
window.startEditWrapper = startEdit;
window.saveEditWrapper = (id) => {
    const input = document.getElementById(`edit-input-${id}`);
    if (input) {
        saveEdit(id, input.value);
    }
};
window.cancelEditWrapper = cancelEdit;

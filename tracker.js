// DOM Elements
const setupForm = document.getElementById('setupForm');
const runningView = document.getElementById('runningView');
const taskNameInput = document.getElementById('taskName');
const taskDescInput = document.getElementById('taskDesc');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const timerDisplay = document.getElementById('timerDisplay');
const runningName = document.getElementById('runningTaskName');
const runningDesc = document.getElementById('runningTaskDesc');
const historyList = document.getElementById('historyList');
const dateDisplay = document.getElementById('dateDisplay');
const totalWorkEl = document.getElementById('totalWork');
const totalBreakEl = document.getElementById('totalBreak');

let timerInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  dateDisplay.textContent = new Date().toLocaleDateString();
  loadHistory();
  checkRunningTask();
});

// 1. Start Timer
startBtn.addEventListener('click', () => {
  const name = taskNameInput.value.trim() || 'Untitled';
  const desc = taskDescInput.value.trim();
  const type = document.querySelector('input[name="taskType"]:checked').value; // 'Task' or 'Break'

  const currentTask = {
    name,
    desc,
    type,
    startTime: Date.now()
  };

  chrome.storage.local.set({ currentTask }, () => {
    checkRunningTask();
  });
});

// 2. Stop Timer
stopBtn.addEventListener('click', () => {
  chrome.storage.local.get(['currentTask', 'history'], (result) => {
    const task = result.currentTask;
    if (!task) return;

    const endTime = Date.now();
    const durationMs = endTime - task.startTime;

    // Create record
    const record = {
      ...task,
      endTime,
      durationMs
    };

    // Save to History (Organized by Date)
    const todayKey = new Date().toLocaleDateString();
    const history = result.history || {};
    
    if (!history[todayKey]) {
      history[todayKey] = [];
    }
    history[todayKey].push(record);

    // Clear current task and save history
    chrome.storage.local.set({ currentTask: null, history }, () => {
      clearInterval(timerInterval);
      checkRunningTask(); // UI update
      loadHistory();      // Update table
    });
  });
});

// 3. UI Logic: Check if task is active
function checkRunningTask() {
  chrome.storage.local.get(['currentTask'], (result) => {
    if (result.currentTask) {
      // Show Timer View
      setupForm.style.display = 'none';
      runningView.style.display = 'block';
      
      runningName.textContent = result.currentTask.type + ": " + result.currentTask.name;
      runningDesc.textContent = result.currentTask.desc;

      // Start ticking
      if (timerInterval) clearInterval(timerInterval);
      updateTimerDisplay(result.currentTask.startTime);
      timerInterval = setInterval(() => {
        updateTimerDisplay(result.currentTask.startTime);
      }, 1000);

    } else {
      // Show Input View
      setupForm.style.display = 'block';
      runningView.style.display = 'none';
      clearInterval(timerInterval);
      taskNameInput.value = '';
      taskDescInput.value = '';
    }
  });
}

function updateTimerDisplay(startTime) {
  const diff = Date.now() - startTime;
  timerDisplay.textContent = formatDuration(diff);
}

// 4. Load History & Stats
function loadHistory() {
  const todayKey = new Date().toLocaleDateString();

  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || {};
    const todaysRecords = history[todayKey] || [];

    historyList.innerHTML = ''; // Clear table

    let workMs = 0;
    let breakMs = 0;

    // Sort by latest first
    todaysRecords.slice().reverse().forEach(item => {
      const row = document.createElement('tr');
      
      // Calculate totals
      if (item.type === 'Task') workMs += item.durationMs;
      else breakMs += item.durationMs;

      // Format time of day
      const timeStr = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      row.innerHTML = `
        <td class="${item.type === 'Task' ? 'tag-task' : 'tag-break'}">${item.type}</td>
        <td>${item.name}</td>
        <td style="color:#666; font-size:0.9em;">${item.desc}</td>
        <td>${formatDuration(item.durationMs)}</td>
        <td>${timeStr}</td>
      `;
      historyList.appendChild(row);
    });

    totalWorkEl.textContent = formatDuration(workMs, true);
    totalBreakEl.textContent = formatDuration(breakMs, true);
  });
}

// Helper: Format ms to HH:MM:SS or Xh Ym
function formatDuration(ms, simple = false) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (simple) {
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  const pad = (num) => num.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
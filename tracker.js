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
const historyList = document.getElementById('historyList'); // Today's table
const dateDisplay = document.getElementById('dateDisplay');
const totalWorkEl = document.getElementById('totalWork');
const totalBreakEl = document.getElementById('totalBreak');
const archiveContainer = document.getElementById('archiveContainer'); // New container

let timerInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  dateDisplay.textContent = new Date().toLocaleDateString('en-GB');
  loadHistory();     // Load today
  loadArchives();    // Load previous days
  checkRunningTask();
});

// 1. Start Timer
startBtn.addEventListener('click', () => {
  const name = taskNameInput.value.trim() || 'Untitled';
  const desc = taskDescInput.value.trim();
  const type = document.querySelector('input[name="taskType"]:checked').value;

  const currentTask = {
    name,
    desc,
    type,
    startTime: Date.now()
  };

  chrome.storage.local.set({ currentTask }, () => {
    if (type === 'Task') {
      chrome.storage.local.set({ focusMode: true });
    } else {
      chrome.storage.local.set({ focusMode: false });
    }
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

    const record = {
      ...task,
      endTime,
      durationMs
    };

    // Save to History 
    const todayKey = new Date().toLocaleDateString('en-GB');
    const history = result.history || {};
    
    if (!history[todayKey]) {
      history[todayKey] = [];
    }
    history[todayKey].push(record);

    chrome.storage.local.set({ currentTask: null, history }, () => {
      chrome.storage.local.set({ focusMode: false });

      clearInterval(timerInterval);
      checkRunningTask(); 
      loadHistory(); // Update 
    });
  });
});

// 3. UI Logic: Check if task is active
function checkRunningTask() {
  chrome.storage.local.get(['currentTask'], (result) => {
    if (result.currentTask) {
      setupForm.style.display = 'none';
      runningView.style.display = 'block';
      
      runningName.textContent = result.currentTask.type + ": " + result.currentTask.name;
      runningDesc.textContent = result.currentTask.desc;

      if (timerInterval) clearInterval(timerInterval);
      updateTimerDisplay(result.currentTask.startTime);
      timerInterval = setInterval(() => {
        updateTimerDisplay(result.currentTask.startTime);
      }, 1000);

    } else {
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

// 4. Load History (TODAY)
function loadHistory() {
  const todayKey = new Date().toLocaleDateString('en-GB');

  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || {};
    const todaysRecords = history[todayKey] || [];

    const stats = calculateDailyStats(todaysRecords);
    
    totalWorkEl.textContent = formatDuration(stats.workMs, true);
    totalBreakEl.textContent = formatDuration(stats.breakMs, true);

    historyList.innerHTML = '';
    const rows = renderHistoryRows(todaysRecords);
    rows.forEach(row => historyList.appendChild(row));
  });
}

// 5. Load Archives
function loadArchives() {
  const todayKey = new Date().toLocaleDateString('en-GB');

  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || {};
    archiveContainer.innerHTML = '';

    const dates = Object.keys(history);

    // Sort: This handles the mix of formats reasonably well for now
    dates.sort((a, b) => {
      // Helper to pad single digits for sorting comparisons
      const standardA = a.split('/').map(p => p.padStart(2, '0')).reverse().join('');
      const standardB = b.split('/').map(p => p.padStart(2, '0')).reverse().join('');
      return standardB.localeCompare(standardA);
    });

    dates.forEach(dateKey => {
      // Skip today
      if (dateKey === todayKey) return;

      const records = history[dateKey];
      const stats = calculateDailyStats(records);

      // --- FIX STARTS HERE ---
      // Determine Display Date:
      // If dateKey is old format (e.g., "2/2/2026"), JS can parse it.
      // If dateKey is new UK format (e.g., "28/01/2026"), JS usually fails to parse "28" as a month.
      let displayDate = dateKey;
      
      const testDate = new Date(dateKey);
      // If it is a valid date (meaning it was saved in the old US-compatible format)
      // AND it doesn't look like the new format (to avoid swapping days/months ambiguously)
      if (!isNaN(testDate.getTime()) && dateKey.indexOf('/') < 3) {
         displayDate = testDate.toLocaleDateString('en-GB');
      }
      // --- FIX ENDS HERE ---

      const details = document.createElement('details');
      const summary = document.createElement('summary');
      
      summary.innerHTML = `
        <span>${displayDate}</span>
        <span class="summary-stats">
          Work: ${formatDuration(stats.workMs, true)} | Break: ${formatDuration(stats.breakMs, true)}
        </span>
      `;

      // Inner Content (Table)
      const contentDiv = document.createElement('div');
      contentDiv.className = 'archive-content';
      
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Desc</th>
            <th>Duration</th>
            <th>Time</th>
          </tr>
        </thead>
      `;
      
      const tbody = document.createElement('tbody');
      const rows = renderHistoryRows(records);
      rows.forEach(row => tbody.appendChild(row));
      
      table.appendChild(tbody);
      contentDiv.appendChild(table);
      details.appendChild(summary);
      details.appendChild(contentDiv);

      archiveContainer.appendChild(details);
    });

    if (archiveContainer.innerHTML === '') {
      archiveContainer.innerHTML = '<p style="text-align:center; color:#999;">No previous history found.</p>';
    }
  });
}


function calculateDailyStats(records) {
  let workMs = 0;
  let breakMs = 0;
  records.forEach(item => {
    if (item.type === 'Task') workMs += item.durationMs;
    else breakMs += item.durationMs;
  });
  return { workMs, breakMs };
}


function renderHistoryRows(records) {
  const rows = [];
  // Sort by latest first
  records.slice().reverse().forEach(item => {
    const row = document.createElement('tr');
    const timeStr = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    row.innerHTML = `
      <td class="${item.type === 'Task' ? 'tag-task' : 'tag-break'}">${item.type}</td>
      <td>${item.name}</td>
      <td style="color:#666; font-size:0.9em;">${item.desc}</td>
      <td>${formatDuration(item.durationMs)}</td>
      <td>${timeStr}</td>
    `;
    rows.push(row);
  });
  return rows;
}


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
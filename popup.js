document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleBtn');
  const statusText = document.getElementById('statusText');
  const trackerBtn = document.getElementById('openTrackerBtn');

  // Open the Tracker Dashboard in a new tab
  trackerBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'tracker.html' });
  });

  chrome.storage.local.get(['focusMode'], (result) => {
    updateUI(result.focusMode);
  });
  
  // Handle Click
  btn.addEventListener('click', () => {
    chrome.storage.local.get(['focusMode'], (result) => {
      const newState = !result.focusMode;
      chrome.storage.local.set({ focusMode: newState });
      updateUI(newState);
    });
  });

  function updateUI(isFocusOn) {
    if (isFocusOn) {
      btn.textContent = 'Turn Focus OFF';
      btn.className = 'btn-toggle on';
      statusText.textContent = 'Focus ACTIVE';
      statusText.style.color = '#F44336';
    } else {
      btn.textContent = 'Turn Focus ON';
      btn.className = 'btn-toggle off';
      statusText.textContent = 'Focus OFF';
      statusText.style.color = '#666';
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleBtn');
  const statusText = document.getElementById('statusText');

  // Load current state
  chrome.storage.local.get(['focusMode'], (result) => {
    updateUI(result.focusMode);
  });

  // Handle click
  btn.addEventListener('click', () => {
    chrome.storage.local.get(['focusMode'], (result) => {
      const newState = !result.focusMode;
      chrome.storage.local.set({ focusMode: newState });
      updateUI(newState);
    });
  });

  function updateUI(isFocusOn) {
    if (isFocusOn) {
      btn.textContent = 'Turn OFF';
      btn.className = 'btn-on';
      statusText.textContent = 'Focus Mode is ACTIVE';
      statusText.style.color = '#F44336';
    } else {
      btn.textContent = 'Turn ON';
      btn.className = 'btn-off';
      statusText.textContent = 'Focus Mode is OFF';
      statusText.style.color = '#666';
    }
  }
});

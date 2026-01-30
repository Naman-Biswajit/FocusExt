const STYLE_ID = 'focus-mode-yt-style';

// CSS to hide the Home feed container but keep Search functional
const cssRules = `
  /* Hide the Home page browse component */
  ytd-browse[page-subtype="home"] {
    display: none !important;
  }
  
  /* Optional: Hide the Shorts tab in the navigation bar to reduce distraction */
  ytd-mini-guide-renderer a[title="Shorts"],
  ytd-guide-entry-renderer a[title="Shorts"] {
    display: none !important;
  }
  
  /* Ensure the page background looks clean when feed is hidden */
  ytd-page-manager {
    margin-top: 0;
  }
`;

function enableYouTubeFocus() {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = cssRules;
    document.documentElement.appendChild(style);
  }
}

function disableYouTubeFocus() {
  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
  }
}

// 1. Check status on page load
chrome.storage.local.get(['focusMode'], (result) => {
  if (result.focusMode) {
    enableYouTubeFocus();
  }
});

// 2. Listen for real-time toggles from the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.focusMode) {
    if (changes.focusMode.newValue) {
      enableYouTubeFocus();
    } else {
      disableYouTubeFocus();
    }
  }
});

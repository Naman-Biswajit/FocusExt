chrome.runtime.onInstalled.addListener(() => {
  // Initialize default state to false
  chrome.storage.local.set({ focusMode: false });
});

// Watch for changes in the storage (toggle clicked)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.focusMode) {
    const isFocusOn = changes.focusMode.newValue;
    updateBlockingRules(isFocusOn);
  }
});

function updateBlockingRules(enable) {
  const ruleSetId = 'ruleset_blocked_sites';
  
  if (enable) {
    // Enable the blocking ruleset
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [ruleSetId]
    });
  } else {
    // Disable the blocking ruleset
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: [ruleSetId]
    });
  }
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {    
    if (changeInfo.url) {
        const url = changeInfo.url;

        if (url.includes("youtube.com/shorts/")) {
            
            console.log("Shorts detected in background. Redirecting...");

            const match = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);

            if (match && match[1]) {
                const videoId = match[1];
                
                const urlObj = new URL(url);
                const timeParam = urlObj.searchParams.get("t");
                let newUrl = `https://www.youtube.com/watch?v=${videoId}`;
                
                if (timeParam) {
                    newUrl += `&t=${timeParam}`;
                }

                chrome.tabs.update(tabId, { url: newUrl });
            }
        }
    }
});
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

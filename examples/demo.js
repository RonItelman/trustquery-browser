import TrustQuery from '/trustquery/src/TrustQuery.js';
import HelpModalManager from '/trustquery/src/HelpModalManager.js';

console.log('[Demo] Initializing TrustQuery...');

// Initialize Help Modal Manager
const helpModal = new HelpModalManager(null); // Pass null initially, update after editor loads

// Initialize TrustQuery
const editor = TrustQuery.init('demo-textarea', {
  // Uses default: /trustquery/tql-triggers.json
  autoLoadCommandMap: true,
  bubbleDelay: 300,

  onWordHover: (matchData) => {
    const messageState = matchData.intent?.handler?.['message-state'] || 'unknown';
    helpModal.logEvent(`Hovered: "${matchData.text}" (${messageState})`);
  },

  onWordClick: (matchData) => {
    const messageState = matchData.intent?.handler?.['message-state'] || 'unknown';
    helpModal.logEvent(`Clicked: "${matchData.text}" (${messageState})`);
    if (matchData.selectedOption) {
      const label = typeof matchData.selectedOption === 'string'
        ? matchData.selectedOption
        : matchData.selectedOption.label;
      helpModal.logEvent(`  → Selected: ${label}`);
    }
  }
});

// Update help modal with editor reference
helpModal.editor = editor;

// Store globally for debugging
window.editor = editor;
window.helpModal = helpModal;

// Setup help button
document.getElementById('help-button').addEventListener('click', () => {
  helpModal.show();
});

// Log initialization after trigger map loads
setTimeout(() => {
  if (editor && editor.commandMap) {
    // Count triggers from tql-triggers format
    let triggerCount = 0;
    if (editor.commandMap['tql-triggers']) {
      const triggers = editor.commandMap['tql-triggers'];
      Object.keys(triggers).forEach(state => {
        if (!state.startsWith('$') && Array.isArray(triggers[state])) {
          triggerCount += triggers[state].length;
        }
      });
    }

    helpModal.logEvent(`TrustQuery initialized with ${triggerCount} triggers`);
    // Modal content will be populated when user opens the modal
  } else {
    helpModal.logEvent('ERROR: Trigger map failed to load');
  }
}, 1000);

console.log('[Demo] TrustQuery initialized:', editor);

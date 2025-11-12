// BubbleManager - Handles hover bubble tooltips for matched words

export default class BubbleManager {
  /**
   * Create bubble manager
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    this.options = {
      bubbleDelay: options.bubbleDelay || 200,
      styleManager: options.styleManager || null,
      commandHandlers: options.commandHandlers || null,
      ...options
    };

    this.currentBubble = null;
    this.hoverTimeout = null;

    console.log('[BubbleManager] Initialized');
  }

  /**
   * Show bubble for a match element
   * @param {HTMLElement} matchEl - Match element
   * @param {Object} matchData - Match data
   */
  showBubble(matchEl, matchData) {
    // Remove any existing bubble
    this.hideBubble();

    // Get bubble content
    const content = this.getBubbleContent(matchData);

    if (!content) {
      return; // No content to show
    }

    // Create bubble
    const bubble = document.createElement('div');
    bubble.className = 'tq-bubble';
    bubble.innerHTML = content;

    // Apply inline styles via StyleManager
    if (this.options.styleManager) {
      this.options.styleManager.applyBubbleStyles(bubble);
    }

    // Add to document
    document.body.appendChild(bubble);
    this.currentBubble = bubble;

    // Position bubble relative to match element
    this.positionBubble(bubble, matchEl);

    // Auto-hide when mouse leaves bubble
    bubble.addEventListener('mouseleave', () => {
      this.hideBubble();
    });

    console.log('[BubbleManager] Bubble shown for:', matchData.text);
  }

  /**
   * Hide current bubble
   */
  hideBubble() {
    if (this.currentBubble) {
      this.currentBubble.remove();
      this.currentBubble = null;
    }
  }

  /**
   * Get bubble content using command handler
   * @param {Object} matchData - Match data including command and intent
   * @returns {string|null} HTML content or null
   */
  getBubbleContent(matchData) {
    // Check for new simplified format first (intent.handler.message)
    if (matchData.intent && matchData.intent.handler) {
      const handler = matchData.intent.handler;
      const messageState = handler['message-state'];
      const message = handler.message || handler['message-content'] || matchData.intent.description;

      if (message) {
        // Build bubble HTML based on message-state
        const stateConfig = {
          'error': { icon: '⛔', title: 'Not Allowed', color: '#991b1b' },
          'warning': { icon: '⚠️', title: 'Warning', color: '#92400e' },
          'info': { icon: 'ℹ️', title: 'Info', color: '#065f46' }
        };

        const config = stateConfig[messageState] || { icon: 'ℹ️', title: 'Info', color: '#2b6cb0' };

        return `
          <div style="color: ${config.color};">
            <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center;">
              <span style="margin-right: 6px;">${config.icon}</span>
              ${config.title}
            </div>
            <div style="font-size: 12px; line-height: 1.4;">
              ${this.escapeHtml(message)}
            </div>
          </div>
        `;
      }
    }

    // Use command handler if available (legacy support)
    if (this.options.commandHandlers && matchData.commandType) {
      const content = this.options.commandHandlers.getBubbleContent(matchData.commandType, matchData);
      if (content) {
        return content;
      }
    }

    // Fallback to legacy method
    const command = matchData.command || {};

    if (command.content) {
      return command.content;
    }

    if (command.bubbleContent) {
      return command.bubbleContent;
    }

    if (command.description) {
      return `<div class="tq-bubble-description">${this.escapeHtml(command.description)}</div>`;
    }

    return null;
  }

  /**
   * Position bubble relative to match element
   * @param {HTMLElement} bubble - Bubble element
   * @param {HTMLElement} matchEl - Match element
   */
  positionBubble(bubble, matchEl) {
    const rect = matchEl.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();

    // Position below match by default
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    // Check if bubble goes off right edge
    if (left + bubbleRect.width > window.innerWidth) {
      left = window.innerWidth - bubbleRect.width - 10;
    }

    // Check if bubble goes off bottom edge
    if (top + bubbleRect.height > window.innerHeight + window.scrollY) {
      // Position above instead
      top = rect.top + window.scrollY - bubbleRect.height - 8;
    }

    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.hideBubble();

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  /**
   * Destroy
   */
  destroy() {
    this.cleanup();
    console.log('[BubbleManager] Destroyed');
  }
}

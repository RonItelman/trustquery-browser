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

    // Add header container based on message-state
    const messageState = matchData.intent?.handler?.['message-state'] || 'info';
    this.createBubbleHeader(bubble, messageState);

    // Add content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tq-bubble-content';
    contentContainer.innerHTML = content;
    bubble.appendChild(contentContainer);

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
   * Create header container for bubble
   * @param {HTMLElement} bubble - Bubble element
   * @param {string} messageState - Message state (error, warning, info)
   */
  createBubbleHeader(bubble, messageState) {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'bubble-header-container';
    headerContainer.setAttribute('data-type', messageState);

    // Create image
    const img = document.createElement('img');
    img.src = `./assets/trustquery-${messageState}.svg`;
    img.style.height = '24px';
    img.style.width = 'auto';

    // Create text span
    const span = document.createElement('span');
    const textMap = {
      'error': 'TrustQuery Stop',
      'warning': 'TrustQuery Clarify',
      'info': 'TrustQuery Quick Link'
    };
    span.textContent = textMap[messageState] || 'TrustQuery';

    // Append to header
    headerContainer.appendChild(img);
    headerContainer.appendChild(span);

    // Apply styles to header via StyleManager
    if (this.options.styleManager) {
      this.options.styleManager.applyBubbleHeaderStyles(headerContainer, messageState);
    }

    bubble.appendChild(headerContainer);
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
      const message = handler.message || handler['message-content'] || matchData.intent.description;

      if (message) {
        // Return just the message text - header is added separately
        return this.escapeHtml(message);
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

    // Position above match by default (since input is at bottom)
    let top = rect.top + window.scrollY - bubbleRect.height - 8;
    let left = rect.left + window.scrollX;

    // If bubble goes off top edge, position below instead
    if (top < window.scrollY) {
      top = rect.bottom + window.scrollY + 8;
    }

    // Check if bubble goes off right edge
    if (left + bubbleRect.width > window.innerWidth) {
      left = window.innerWidth - bubbleRect.width - 10;
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

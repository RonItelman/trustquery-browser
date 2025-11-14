// InteractionHandler - Orchestrates hover bubbles and click interactions on matched words
// Delegates to BubbleManager and DropdownManager for specific functionality

import BubbleManager from './BubbleManager.js';
import DropdownManager from './DropdownManager.js';

export default class InteractionHandler {
  /**
   * Create interaction handler
   * @param {HTMLElement} overlay - Overlay element containing matches
   * @param {Object} options - Configuration
   */
  constructor(overlay, options = {}) {
    this.overlay = overlay;
    this.options = {
      bubbleDelay: options.bubbleDelay || 200,
      onWordClick: options.onWordClick || null,
      onWordHover: options.onWordHover || null,
      styleManager: options.styleManager || null,
      commandHandlers: options.commandHandlers || null,
      textarea: options.textarea || null,
      ...options
    };

    this.hoverTimeout = null;

    // Create manager instances
    this.bubbleManager = new BubbleManager({
      bubbleDelay: this.options.bubbleDelay,
      styleManager: this.options.styleManager,
      commandHandlers: this.options.commandHandlers
    });

    this.dropdownManager = new DropdownManager({
      styleManager: this.options.styleManager,
      textarea: this.options.textarea,
      onWordClick: this.options.onWordClick,
      dropdownOffset: this.options.dropdownOffset
    });

    console.log('[InteractionHandler] Initialized');
  }

  /**
   * Update handlers after overlay re-render
   * Attach event listeners to all .tq-match elements
   */
  update() {
    // Remove old handlers (if any)
    this.cleanup();

    // Find all match elements
    const matches = this.overlay.querySelectorAll('.tq-match');

    matches.forEach(matchEl => {
      const behavior = matchEl.getAttribute('data-behavior');

      // Hover events for bubbles
      matchEl.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, matchEl));
      matchEl.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, matchEl));

      // Click events for dropdowns/actions
      matchEl.addEventListener('click', (e) => this.handleClick(e, matchEl));

      // Add hover class for CSS styling
      matchEl.classList.add('tq-hoverable');

      // Auto-show dropdown for dropdown-behavior matches
      if (behavior === 'dropdown') {
        const matchData = this.getMatchData(matchEl);
        // Only show if this isn't the currently active dropdown match
        if (!this.dropdownManager.activeDropdownMatch ||
            this.dropdownManager.activeDropdownMatch.textContent !== matchEl.textContent) {
          this.dropdownManager.showDropdown(matchEl, matchData);
        }
      }
    });

    console.log('[InteractionHandler] Updated with', matches.length, 'interactive elements');
  }

  /**
   * Handle mouse enter on a match
   * @param {Event} e - Mouse event
   * @param {HTMLElement} matchEl - Match element
   */
  handleMouseEnter(e, matchEl) {
    const behavior = matchEl.getAttribute('data-behavior');

    // Only show bubble if behavior is 'bubble' or 'hover'
    if (behavior === 'bubble' || behavior === 'hover') {
      // Clear any existing timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }

      // Delay bubble appearance
      this.hoverTimeout = setTimeout(() => {
        const matchData = this.getMatchData(matchEl);
        this.bubbleManager.showBubble(matchEl, matchData);
      }, this.options.bubbleDelay);
    }

    // Callback
    if (this.options.onWordHover) {
      const matchData = this.getMatchData(matchEl);
      this.options.onWordHover(matchData);
    }
  }

  /**
   * Handle mouse leave from a match
   * @param {Event} e - Mouse event
   * @param {HTMLElement} matchEl - Match element
   */
  handleMouseLeave(e, matchEl) {
    // Clear hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    // Don't immediately hide bubble - let user hover over it
    // Bubble will auto-hide when mouse leaves bubble area
  }

  /**
   * Handle click on a match
   * @param {Event} e - Click event
   * @param {HTMLElement} matchEl - Match element
   */
  handleClick(e, matchEl) {
    e.preventDefault();
    e.stopPropagation();

    const behavior = matchEl.getAttribute('data-behavior');
    const matchData = this.getMatchData(matchEl);

    console.log('[InteractionHandler] Match clicked:', matchData);

    // Handle different behaviors
    if (behavior === 'dropdown') {
      // Toggle dropdown - close if already open for this match, otherwise show
      if (this.dropdownManager.activeDropdownMatch === matchEl) {
        this.dropdownManager.hideDropdown();
      } else {
        this.dropdownManager.showDropdown(matchEl, matchData);
      }
    } else if (behavior === 'action') {
      // Custom action callback
      if (this.options.onWordClick) {
        this.options.onWordClick(matchData);
      }
    }

    // Always trigger callback (unless it's a dropdown toggle to close)
    if (this.options.onWordClick && !(behavior === 'dropdown' && this.dropdownManager.activeDropdownMatch === matchEl)) {
      this.options.onWordClick(matchData);
    }
  }

  /**
   * Hide dropdown (exposed for external use, e.g., when textarea loses focus)
   */
  hideDropdown() {
    this.dropdownManager.hideDropdown();
  }

  /**
   * Extract match data from element
   * @param {HTMLElement} matchEl - Match element
   * @returns {Object} Match data
   */
  getMatchData(matchEl) {
    // Parse intent JSON if available
    let intent = null;
    const intentStr = matchEl.getAttribute('data-intent');
    if (intentStr) {
      try {
        intent = JSON.parse(intentStr);
      } catch (e) {
        console.warn('[InteractionHandler] Failed to parse intent JSON:', e);
      }
    }

    return {
      text: matchEl.getAttribute('data-match-text'),
      line: parseInt(matchEl.getAttribute('data-line')),
      col: parseInt(matchEl.getAttribute('data-col')),
      commandType: matchEl.getAttribute('data-command-type'),
      commandPath: matchEl.getAttribute('data-command-path'),
      intentPath: matchEl.getAttribute('data-intent-path'),
      intent: intent,
      command: {
        id: matchEl.getAttribute('data-command-id'),
        type: matchEl.getAttribute('data-command-type'),
        behavior: matchEl.getAttribute('data-behavior')
      },
      element: matchEl
    };
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    this.bubbleManager.cleanup();
    this.dropdownManager.cleanup();

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  /**
   * Destroy handler
   */
  destroy() {
    this.cleanup();
    this.bubbleManager.destroy();
    this.dropdownManager.destroy();
    console.log('[InteractionHandler] Destroyed');
  }
}

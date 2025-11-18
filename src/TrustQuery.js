// TrustQuery - Lightweight library to make textareas interactive
// Turns matching words into interactive elements with hover bubbles and click actions

import OverlayRenderer from './OverlayRenderer.js';
import CommandScanner from './CommandScanner.js';
import InteractionHandler from './InteractionHandler.js';
import StyleManager from './StyleManager.js';
import CommandHandlerRegistry from './CommandHandlers.js';
import AutoGrow from './AutoGrow.js';
import ValidationStateManager from './ValidationStateManager.js';
import MobileKeyboardHandler from './MobileKeyboardHandler.js';

export default class TrustQuery {
  // Store all instances
  static instances = new Map();

  /**
   * Initialize TrustQuery on a textarea
   * @param {string|HTMLElement} textareaId - ID or element of textarea
   * @param {Object} options - Configuration options
   * @returns {TrustQuery} Instance
   */
  static init(textareaId, options = {}) {
    const textarea = typeof textareaId === 'string'
      ? document.getElementById(textareaId)
      : textareaId;

    if (!textarea) {
      console.error('[TrustQuery] Textarea not found:', textareaId);
      return null;
    }

    // Check if already initialized
    const existingInstance = TrustQuery.instances.get(textarea);
    if (existingInstance) {
      console.warn('[TrustQuery] Already initialized on this textarea, returning existing instance');
      return existingInstance;
    }

    // Create new instance
    const instance = new TrustQuery(textarea, options);
    TrustQuery.instances.set(textarea, instance);

    console.log('[TrustQuery] Initialized successfully on:', textarea.id || textarea);
    return instance;
  }

  /**
   * Get existing instance
   * @param {string|HTMLElement} textareaId - ID or element
   * @returns {TrustQuery|null} Instance or null
   */
  static getInstance(textareaId) {
    const textarea = typeof textareaId === 'string'
      ? document.getElementById(textareaId)
      : textareaId;
    return TrustQuery.instances.get(textarea) || null;
  }

  /**
   * Create a TrustQuery instance
   * @param {HTMLElement} textarea - Textarea element
   * @param {Object} options - Configuration
   */
  constructor(textarea, options = {}) {
    this.textarea = textarea;

    // Normalize options (support both old and new API)
    this.options = this.normalizeOptions(options);

    this.commandMap = null;
    this.isReady = false;
    this.features = {};

    // Initialize components
    this.init();
  }

  /**
   * Normalize options - support both old and new API
   * @param {Object} options - Raw options
   * @returns {Object} Normalized options
   */
  normalizeOptions(options) {
    // New API structure
    const triggerMap = options.triggerMap || {};
    const features = options.features || {};
    const ui = options.ui || {};
    const events = options.events || {};

    // Build normalized config (backward compatible)
    return {
      // Trigger map configuration
      commandMapUrl: triggerMap.url || options.commandMapUrl || null,
      commandMap: triggerMap.data || options.commandMap || null,
      autoLoadCommandMap: options.autoLoadCommandMap !== false,
      triggerMapSource: triggerMap.source || (triggerMap.url ? 'url' : triggerMap.data ? 'inline' : null),
      triggerMapApi: triggerMap.api || null,

      // Features
      autoGrow: features.autoGrow || false,
      autoGrowMaxHeight: features.maxHeight || 300,
      debug: features.debug || false,

      // UI settings
      theme: ui.theme || options.theme || 'light',
      bubbleDelay: ui.bubbleDelay !== undefined ? ui.bubbleDelay : (options.bubbleDelay || 200),
      dropdownOffset: ui.dropdownOffset !== undefined ? ui.dropdownOffset : (options.dropdownOffset || 28),

      // Events (callbacks)
      onWordClick: events.onWordClick || options.onWordClick || null,
      onWordHover: events.onWordHover || options.onWordHover || null,
      onValidationChange: events.onValidationChange || options.onValidationChange || null,

      // Theme/style options (passed to StyleManager)
      backgroundColor: ui.backgroundColor || options.backgroundColor,
      textColor: ui.textColor || options.textColor,
      caretColor: ui.caretColor || options.caretColor,
      borderColor: ui.borderColor || options.borderColor,
      borderColorFocus: ui.borderColorFocus || options.borderColorFocus,
      matchBackgroundColor: ui.matchBackgroundColor || options.matchBackgroundColor,
      matchTextColor: ui.matchTextColor || options.matchTextColor,
      matchHoverBackgroundColor: ui.matchHoverBackgroundColor || options.matchHoverBackgroundColor,
      fontFamily: ui.fontFamily || options.fontFamily,
      fontSize: ui.fontSize || options.fontSize,
      lineHeight: ui.lineHeight || options.lineHeight,

      ...options
    };
  }

  /**
   * Initialize all components
   */
  async init() {
    console.log('[TrustQuery] Starting initialization...');

    // Initialize command handler registry
    this.commandHandlers = new CommandHandlerRegistry();

    // Initialize style manager (handles all inline styling)
    this.styleManager = new StyleManager(this.options);

    // Create wrapper and overlay structure
    this.createOverlayStructure();

    // Initialize renderer
    this.renderer = new OverlayRenderer(this.overlay, {
      theme: this.options.theme,
      commandHandlers: this.commandHandlers, // Pass handlers for styling
      debug: this.options.debug // Pass debug flag
    });

    // Initialize scanner (will be configured when command map loads)
    this.scanner = new CommandScanner({
      debug: this.options.debug
    });

    // Initialize interaction handler
    this.interactionHandler = new InteractionHandler(this.overlay, {
      bubbleDelay: this.options.bubbleDelay,
      dropdownOffset: this.options.dropdownOffset,
      onWordClick: this.options.onWordClick,
      onWordHover: this.options.onWordHover,
      styleManager: this.styleManager, // Pass style manager for bubbles/dropdowns
      commandHandlers: this.commandHandlers, // Pass handlers for bubble content
      textarea: this.textarea, // Pass textarea for on-select display updates
      debug: this.options.debug // Pass debug flag
    });

    // Initialize validation state manager
    this.validationStateManager = new ValidationStateManager({
      onValidationChange: this.options.onValidationChange,
      debug: this.options.debug
    });

    // Initialize features
    this.initializeFeatures();

    // Setup textarea event listeners
    this.setupTextareaListeners();

    // Load command map
    if (this.options.autoLoadCommandMap) {
      await this.loadCommandMap();
    } else if (this.options.commandMap) {
      this.updateCommandMap(this.options.commandMap);
    }

    // Initial render
    this.render();

    this.isReady = true;

    // Auto-focus textarea to show cursor
    setTimeout(() => {
      this.textarea.focus();
    }, 100);

    console.log('[TrustQuery] Initialization complete');
  }

  /**
   * Initialize optional features based on configuration
   */
  initializeFeatures() {
    // Auto-grow textarea feature
    if (this.options.autoGrow) {
      this.features.autoGrow = new AutoGrow(this.textarea, {
        maxHeight: this.options.autoGrowMaxHeight,
        minHeight: 44
      });
      console.log('[TrustQuery] AutoGrow feature enabled');
    }

    // Mobile keyboard handler (enabled by default, can be disabled via options)
    if (this.options.mobileKeyboard !== false) {
      this.features.mobileKeyboard = new MobileKeyboardHandler({
        textarea: this.textarea,
        wrapper: this.wrapper,
        debug: this.options.debug
      });
      this.features.mobileKeyboard.init();
      console.log('[TrustQuery] Mobile keyboard handler enabled');
    }

    // Debug logging feature
    if (this.options.debug) {
      this.enableDebugLogging();
      console.log('[TrustQuery] Debug logging enabled');
    }
  }

  /**
   * Enable debug logging for events
   */
  enableDebugLogging() {
    const originalOnWordHover = this.options.onWordHover;
    const originalOnWordClick = this.options.onWordClick;

    this.options.onWordHover = (matchData) => {
      console.log('[TrustQuery Debug] Word Hover:', matchData);
      if (originalOnWordHover) originalOnWordHover(matchData);
    };

    this.options.onWordClick = (matchData) => {
      console.log('[TrustQuery Debug] Word Click:', matchData);
      if (originalOnWordClick) originalOnWordClick(matchData);
    };
  }

  /**
   * Create the overlay structure
   */
  createOverlayStructure() {
    // Create wrapper to contain both textarea and overlay
    const wrapper = document.createElement('div');
    wrapper.className = 'tq-wrapper';

    // Wrap textarea
    this.textarea.parentNode.insertBefore(wrapper, this.textarea);
    wrapper.appendChild(this.textarea);

    // Add TrustQuery class to textarea
    this.textarea.classList.add('tq-textarea');

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'tq-overlay';
    wrapper.appendChild(this.overlay);

    // Store wrapper reference
    this.wrapper = wrapper;

    // Apply all inline styles via StyleManager
    this.styleManager.applyAllStyles(wrapper, this.textarea, this.overlay);

    // Show textarea now that structure is ready (prevents FOUC)
    this.textarea.style.opacity = '1';

    console.log('[TrustQuery] Overlay structure created with inline styles');
  }

  /**
   * Setup textarea event listeners
   */
  setupTextareaListeners() {
    // Input event - re-render on content change
    this.textarea.addEventListener('input', () => {
      this.render();
    });

    // Scroll event - sync overlay scroll with textarea
    this.textarea.addEventListener('scroll', () => {
      this.overlay.scrollTop = this.textarea.scrollTop;
      this.overlay.scrollLeft = this.textarea.scrollLeft;
    });

    // Keyboard event logging for debugging selection issues
    this.textarea.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isSelectAll = (e.metaKey || e.ctrlKey) && e.key === 'a';

      if (isCmdOrCtrl || isSelectAll) {
        console.log('[TrustQuery] ===== KEYBOARD EVENT =====');
        console.log('[TrustQuery] Key pressed:', {
          key: e.key,
          code: e.code,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          isSelectAll: isSelectAll
        });
        console.log('[TrustQuery] Active element:', document.activeElement.tagName, document.activeElement.id || '(no id)');
        console.log('[TrustQuery] Textarea state BEFORE:', {
          value: this.textarea.value,
          valueLength: this.textarea.value.length,
          selectionStart: this.textarea.selectionStart,
          selectionEnd: this.textarea.selectionEnd,
          selectedText: this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd)
        });

        if (isSelectAll) {
          // Log state after select all (use setTimeout to let browser process the event)
          setTimeout(() => {
            console.log('[TrustQuery] Textarea state AFTER CMD+A:', {
              selectionStart: this.textarea.selectionStart,
              selectionEnd: this.textarea.selectionEnd,
              selectedText: this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd),
              selectedLength: this.textarea.selectionEnd - this.textarea.selectionStart
            });
            console.log('[TrustQuery] ===== KEYBOARD EVENT END =====');
          }, 0);
        } else {
          console.log('[TrustQuery] ===== KEYBOARD EVENT END =====');
        }
      }
    });

    // Selection change event
    this.textarea.addEventListener('select', (e) => {
      console.log('[TrustQuery] ===== SELECTION CHANGE EVENT =====');
      console.log('[TrustQuery] Selection:', {
        selectionStart: this.textarea.selectionStart,
        selectionEnd: this.textarea.selectionEnd,
        selectedText: this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd),
        selectedLength: this.textarea.selectionEnd - this.textarea.selectionStart
      });
    });

    // Context menu event - prevent keyboard-triggered context menu
    this.textarea.addEventListener('contextmenu', (e) => {
      console.log('[TrustQuery] ===== CONTEXTMENU EVENT =====');
      console.log('[TrustQuery] Context menu triggered:', {
        type: e.type,
        isTrusted: e.isTrusted,
        button: e.button,
        buttons: e.buttons,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        target: e.target.tagName
      });

      // Prevent context menu if triggered by keyboard (button === -1)
      // This prevents the macOS context menu from opening after CMD+A
      if (e.button === -1 && e.buttons === 0) {
        console.log('[TrustQuery] Preventing keyboard-triggered context menu');
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      console.log('[TrustQuery] Allowing mouse-triggered context menu');
    });

    // Also prevent context menu on overlay (it interferes with text selection)
    this.overlay.addEventListener('contextmenu', (e) => {
      console.log('[TrustQuery] ===== CONTEXTMENU EVENT ON OVERLAY =====');
      console.log('[TrustQuery] Context menu on overlay - preventing');

      // Always prevent context menu on overlay
      // The overlay should be transparent to user interactions
      e.preventDefault();
      e.stopPropagation();
    });

    // Focus/blur events - add/remove focus class
    this.textarea.addEventListener('focus', (e) => {
      console.log('[TrustQuery] ===== FOCUS EVENT =====');
      console.log('[TrustQuery] Textarea focused. Active element:', document.activeElement.tagName, document.activeElement.id || '(no id)');
      console.log('[TrustQuery] Current selection:', {
        selectionStart: this.textarea.selectionStart,
        selectionEnd: this.textarea.selectionEnd
      });
      this.wrapper.classList.add('tq-focused');
    });

    this.textarea.addEventListener('blur', (e) => {
      console.log('[TrustQuery] ===== BLUR EVENT =====');
      console.log('[TrustQuery] Textarea blurred. Related target:', e.relatedTarget?.tagName || '(none)');
      console.log('[TrustQuery] Blur event details:', {
        type: e.type,
        isTrusted: e.isTrusted,
        eventPhase: e.eventPhase,
        target: e.target.tagName,
        currentTarget: e.currentTarget.tagName
      });
      console.log('[TrustQuery] Stack trace at blur:');
      console.trace();

      // Close dropdown when textarea loses focus (unless interacting with dropdown)
      if (this.interactionHandler) {
        // Use setTimeout to let the new focus target be set and check if clicking on dropdown
        setTimeout(() => {
          const activeElement = document.activeElement;
          const isDropdownRelated = activeElement && (
            activeElement.classList.contains('tq-dropdown-filter') ||
            activeElement.closest('.tq-dropdown') // Check if clicking anywhere in dropdown
          );

          console.log('[TrustQuery] After blur - active element:', activeElement?.tagName || '(none)', 'isDropdownRelated:', isDropdownRelated);

          // Only close if not interacting with dropdown
          if (!isDropdownRelated) {
            this.interactionHandler.hideDropdown();
          }

          // Remove focus class only if we're truly leaving the component
          if (!isDropdownRelated) {
            this.wrapper.classList.remove('tq-focused');
          }
        }, 0);
      }
    });

    console.log('[TrustQuery] Textarea listeners attached');
  }

  /**
   * Load command map (static tql-triggers.json or from URL)
   */
  async loadCommandMap() {
    try {
      // Default to static file if no URL provided
      const url = this.options.commandMapUrl || '/trustquery/tql-triggers.json';

      console.log('[TrustQuery] Loading trigger map from:', url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.updateCommandMap(data);

      console.log('[TrustQuery] Trigger map loaded successfully');
    } catch (error) {
      console.error('[TrustQuery] Failed to load trigger map:', error);
    }
  }

  /**
   * Update command map
   * @param {Object} commandMap - New command map
   */
  updateCommandMap(commandMap) {
    this.commandMap = commandMap;
    this.scanner.setCommandMap(commandMap);
    console.log('[TrustQuery] Command map updated');

    // Re-render with new command map
    if (this.isReady) {
      this.render();
    }
  }

  /**
   * Render the overlay with styled text
   */
  render() {
    const text = this.textarea.value;

    // Scan text for matches
    const matches = this.scanner.scan(text);

    // Render overlay with matches
    this.renderer.render(text, matches);

    // Update interaction handler with new elements
    this.interactionHandler.update();

    // Update validation state
    if (this.validationStateManager) {
      this.validationStateManager.update(matches);
    }
  }

  /**
   * Destroy instance and cleanup
   */
  destroy() {
    console.log('[TrustQuery] Destroying instance');

    // Remove event listeners
    this.textarea.removeEventListener('input', this.render);
    this.textarea.removeEventListener('scroll', this.syncScroll);

    // Cleanup interaction handler
    if (this.interactionHandler) {
      this.interactionHandler.destroy();
    }

    // Cleanup mobile keyboard handler
    if (this.features.mobileKeyboard) {
      this.features.mobileKeyboard.destroy();
    }

    // Cleanup auto-grow
    if (this.features.autoGrow) {
      this.features.autoGrow.destroy();
    }

    // Unwrap textarea
    const parent = this.wrapper.parentNode;
    parent.insertBefore(this.textarea, this.wrapper);
    parent.removeChild(this.wrapper);

    // Remove from instances
    TrustQuery.instances.delete(this.textarea);

    console.log('[TrustQuery] Destroyed');
  }

  /**
   * Get current value
   */
  getValue() {
    return this.textarea.value;
  }

  /**
   * Set value
   */
  setValue(value) {
    this.textarea.value = value;
    this.render();
  }
}

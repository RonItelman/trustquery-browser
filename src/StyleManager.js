// StyleManager - Handles all inline styling for textarea, wrapper, and overlay
// Makes TrustQuery completely self-contained without requiring external CSS

export default class StyleManager {
  /**
   * Create style manager
   * @param {Object} options - Theme and style options
   */
  constructor(options = {}) {
    this.options = {
      // Theme colors
      backgroundColor: options.backgroundColor || '#fff',
      textColor: options.textColor || '#333',
      caretColor: options.caretColor || '#000',
      borderColor: options.borderColor || '#ddd',
      borderColorFocus: options.borderColorFocus || '#4a90e2',

      // Match colors (can be overridden)
      matchBackgroundColor: options.matchBackgroundColor || 'rgba(74, 144, 226, 0.15)',
      matchTextColor: options.matchTextColor || '#2b6cb0',
      matchHoverBackgroundColor: options.matchHoverBackgroundColor || 'rgba(74, 144, 226, 0.25)',

      // Font settings (optional, will use textarea's if not specified)
      fontFamily: options.fontFamily || null,
      fontSize: options.fontSize || null,
      lineHeight: options.lineHeight || null,

      ...options
    };

    console.log('[StyleManager] Initialized with theme:', this.options);
  }

  /**
   * Apply all styles to wrapper, textarea, and overlay
   * @param {HTMLElement} wrapper - Wrapper element
   * @param {HTMLElement} textarea - Textarea element
   * @param {HTMLElement} overlay - Overlay element
   */
  applyAllStyles(wrapper, textarea, overlay) {
    // Get computed styles from original textarea
    const computedStyle = window.getComputedStyle(textarea);

    // Apply styles to each element
    this.applyWrapperStyles(wrapper, computedStyle);
    this.applyTextareaStyles(textarea, computedStyle);
    this.applyOverlayStyles(overlay, computedStyle);

    // Apply focus handlers
    this.setupFocusStyles(wrapper, textarea);

    console.log('[StyleManager] All styles applied');
  }

  /**
   * Apply wrapper styles (container for both textarea and overlay)
   * @param {HTMLElement} wrapper - Wrapper element
   * @param {CSSStyleDeclaration} computedStyle - Computed styles from textarea
   */
  applyWrapperStyles(wrapper, computedStyle) {
    Object.assign(wrapper.style, {
      position: 'relative',
      display: 'block',
      width: '100%',
      background: this.options.backgroundColor,
      border: `1px solid ${this.options.borderColor}`,
      borderRadius: '4px',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
    });
  }

  /**
   * Apply textarea styles (transparent text, visible caret)
   * @param {HTMLElement} textarea - Textarea element
   * @param {CSSStyleDeclaration} computedStyle - Original computed styles
   */
  applyTextareaStyles(textarea, computedStyle) {
    // Use provided font settings or fall back to computed/defaults
    const fontFamily = this.options.fontFamily || computedStyle.fontFamily || "'Courier New', monospace";
    const fontSize = this.options.fontSize || computedStyle.fontSize || '14px';
    const lineHeight = this.options.lineHeight || computedStyle.lineHeight || '1.5';
    const padding = computedStyle.padding || '12px';

    // Store existing transition if any (for FOUC prevention)
    const existingTransition = textarea.style.transition;

    Object.assign(textarea.style, {
      fontFamily,
      fontSize,
      lineHeight,
      padding,
      border: 'none',
      borderRadius: '0',
      background: 'transparent',
      color: this.options.textColor, // Set color for caret visibility
      WebkitTextFillColor: 'transparent', // Make text transparent but keep caret
      caretColor: this.options.caretColor,
      resize: 'none',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: '0', // Below overlay so hover events reach overlay matches
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      outline: 'none',
      margin: '0',
      transition: existingTransition // Preserve opacity transition from HTML
    });

    // Add CSS to make placeholder visible (not affected by -webkit-text-fill-color)
    this.ensurePlaceholderStyles();

    // Store computed values for overlay to use
    this._textareaStyles = {
      fontFamily,
      fontSize,
      lineHeight,
      padding
    };
  }

  /**
   * Apply overlay styles (must match textarea exactly for alignment)
   * @param {HTMLElement} overlay - Overlay element
   * @param {CSSStyleDeclaration} computedStyle - Computed styles from textarea
   */
  applyOverlayStyles(overlay, computedStyle) {
    // Use the stored textarea styles to ensure perfect alignment
    const { fontFamily, fontSize, lineHeight, padding } = this._textareaStyles;

    Object.assign(overlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      fontFamily,
      fontSize,
      lineHeight,
      padding,
      color: this.options.textColor,
      pointerEvents: 'none', // Let clicks pass through to textarea (except on match spans with pointer-events: auto)
      overflow: 'hidden',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      zIndex: '1', // Above textarea so match spans can receive hover/click events
      boxSizing: 'border-box',
      margin: '0'
    });
  }

  /**
   * Setup focus styles (apply on focus, remove on blur)
   * @param {HTMLElement} wrapper - Wrapper element
   * @param {HTMLElement} textarea - Textarea element
   */
  setupFocusStyles(wrapper, textarea) {
    textarea.addEventListener('focus', () => {
      wrapper.style.borderColor = this.options.borderColorFocus;
      wrapper.style.boxShadow = `0 0 0 3px ${this.options.borderColorFocus}1a`; // 1a = 10% opacity
    });

    textarea.addEventListener('blur', () => {
      wrapper.style.borderColor = this.options.borderColor;
      wrapper.style.boxShadow = 'none';
    });
  }

  /**
   * Apply match (highlighted word) styles
   * @param {HTMLElement} matchElement - Span element for matched word
   * @param {string} matchType - Type of match (keyword, mention, command, etc.)
   */
  applyMatchStyles(matchElement, matchType = 'default') {
    // Base match styles
    Object.assign(matchElement.style, {
      pointerEvents: 'auto', // Enable interactions
      cursor: 'pointer',
      padding: '2px 4px',
      margin: '-2px -4px',
      borderRadius: '3px',
      transition: 'background-color 0.15s ease',
      backgroundColor: this.options.matchBackgroundColor,
      color: this.options.matchTextColor
    });

    // Hover styles (on mouseover)
    matchElement.addEventListener('mouseenter', () => {
      matchElement.style.backgroundColor = this.options.matchHoverBackgroundColor;
    });

    matchElement.addEventListener('mouseleave', () => {
      matchElement.style.backgroundColor = this.options.matchBackgroundColor;
    });
  }

  /**
   * Apply bubble (tooltip) styles
   * @param {HTMLElement} bubble - Bubble element
   */
  applyBubbleStyles(bubble) {
    Object.assign(bubble.style, {
      position: 'absolute',
      background: '#ffffff',
      border: `1px solid ${this.options.borderColor}`,
      borderRadius: '6px',
      padding: '0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '10000',
      maxWidth: '300px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      lineHeight: '1.4',
      color: this.options.textColor,
      pointerEvents: 'auto',
      opacity: '1',
      overflow: 'hidden',
      animation: 'tq-bubble-appear 0.15s ease-out'
    });

    // Add animation keyframes if not already added
    this.ensureAnimationStyles();

    // Style the content container
    const contentContainer = bubble.querySelector('.tq-bubble-content');
    if (contentContainer) {
      Object.assign(contentContainer.style, {
        padding: '8px 12px',
        fontSize: '12px',
        lineHeight: '1.4'
      });
    }
  }

  /**
   * Apply bubble header styles
   * @param {HTMLElement} header - Header container element
   * @param {string} messageState - Message state (error, warning, info)
   */
  applyBubbleHeaderStyles(header, messageState) {
    const colorMap = {
      'error': '#991b1b',
      'warning': '#92400e',
      'info': '#065f46'
    };

    const bgColorMap = {
      'error': '#fee2e2',
      'warning': '#fef3c7',
      'info': '#d1fae5'
    };

    const color = colorMap[messageState] || '#2b6cb0';
    const bgColor = bgColorMap[messageState] || '#e0f2fe';

    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 12px',
      backgroundColor: bgColor,
      color: color,
      fontWeight: '600',
      fontSize: '13px',
      borderBottom: `1px solid ${this.options.borderColor}`
    });
  }

  /**
   * Apply dropdown (menu) styles
   * @param {HTMLElement} dropdown - Dropdown element
   */
  applyDropdownStyles(dropdown) {
    Object.assign(dropdown.style, {
      position: 'absolute',
      background: '#ffffff',
      border: `1px solid ${this.options.borderColor}`,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '10000',
      minWidth: '150px',
      maxWidth: '300px',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      opacity: '1',
      animation: 'tq-dropdown-appear 0.15s ease-out'
    });

    this.ensureAnimationStyles();
  }

  /**
   * Apply dropdown header styles
   * @param {HTMLElement} header - Header container element
   * @param {string} messageState - Message state (error, warning, info)
   */
  applyDropdownHeaderStyles(header, messageState) {
    const colorMap = {
      'error': '#991b1b',
      'warning': '#92400e',
      'info': '#065f46'
    };

    const bgColorMap = {
      'error': '#fee2e2',
      'warning': '#fef3c7',
      'info': '#d1fae5'
    };

    const color = colorMap[messageState] || '#2b6cb0';
    const bgColor = bgColorMap[messageState] || '#e0f2fe';

    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 12px',
      backgroundColor: bgColor,
      color: color,
      fontWeight: '600',
      fontSize: '13px',
      borderBottom: `1px solid ${this.options.borderColor}`
    });
  }

  /**
   * Apply dropdown item styles
   * @param {HTMLElement} item - Dropdown item element
   */
  applyDropdownItemStyles(item) {
    Object.assign(item.style, {
      padding: '8px 12px',
      cursor: 'pointer',
      color: this.options.textColor,
      transition: 'background-color 0.1s ease'
    });

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f0f4f8';
    });

    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });

    item.addEventListener('mousedown', () => {
      item.style.backgroundColor = '#e2e8f0';
    });
  }

  /**
   * Apply dropdown filter input styles
   * @param {HTMLElement} filterInput - Filter input element
   */
  applyDropdownFilterStyles(filterInput) {
    Object.assign(filterInput.style, {
      width: '100%',
      padding: '8px 12px',
      border: 'none',
      borderBottom: `1px solid ${this.options.borderColor}`,
      outline: 'none',
      fontSize: '14px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: this.options.textColor,
      backgroundColor: '#f7fafc',
      boxSizing: 'border-box'
    });

    // Focus styles
    filterInput.addEventListener('focus', () => {
      filterInput.style.backgroundColor = '#fff';
      filterInput.style.borderBottomColor = this.options.borderColorFocus;
    });

    filterInput.addEventListener('blur', () => {
      filterInput.style.backgroundColor = '#f7fafc';
      filterInput.style.borderBottomColor = this.options.borderColor;
    });
  }

  /**
   * Ensure animation keyframes are added to document (only once)
   */
  ensureAnimationStyles() {
    if (document.getElementById('tq-animations')) {
      return; // Already added
    }

    const style = document.createElement('style');
    style.id = 'tq-animations';
    style.textContent = `
      @keyframes tq-bubble-appear {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes tq-dropdown-appear {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .tq-dropdown-item-selected {
        background-color: #e2e8f0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Ensure placeholder styles are added to document (only once)
   */
  ensurePlaceholderStyles() {
    if (document.getElementById('tq-placeholder-styles')) {
      return; // Already added
    }

    const style = document.createElement('style');
    style.id = 'tq-placeholder-styles';
    style.textContent = `
      .tq-textarea::placeholder {
        color: #a0aec0 !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #a0aec0 !important;
      }

      .tq-textarea::-webkit-input-placeholder {
        color: #a0aec0 !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #a0aec0 !important;
      }

      .tq-textarea::-moz-placeholder {
        color: #a0aec0 !important;
        opacity: 1 !important;
      }

      .tq-textarea:-ms-input-placeholder {
        color: #a0aec0 !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update theme colors dynamically
   * @param {Object} newColors - New color options
   */
  updateTheme(newColors) {
    Object.assign(this.options, newColors);
    console.log('[StyleManager] Theme updated:', this.options);
  }
}

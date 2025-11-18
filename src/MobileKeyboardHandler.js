// MobileKeyboardHandler - Handles mobile virtual keyboard behavior
// Detects keyboard appearance and adjusts layout to keep textarea visible

export default class MobileKeyboardHandler {
  /**
   * Create mobile keyboard handler
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      textarea: options.textarea || null,
      wrapper: options.wrapper || null,
      debug: options.debug || false,
      ...options
    };

    this.isKeyboardVisible = false;
    this.lastViewportHeight = window.innerHeight;
    this.visualViewport = window.visualViewport;

    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Initialized');
    }
  }

  /**
   * Initialize keyboard detection
   */
  init() {
    if (!this.options.textarea) {
      console.warn('[MobileKeyboardHandler] No textarea provided');
      return;
    }

    // Use Visual Viewport API if available (preferred method)
    if (this.visualViewport) {
      this.visualViewport.addEventListener('resize', this.handleViewportResize);
      this.visualViewport.addEventListener('scroll', this.handleViewportScroll);

      if (this.options.debug) {
        console.log('[MobileKeyboardHandler] Using Visual Viewport API');
      }
    } else {
      // Fallback to window resize
      window.addEventListener('resize', this.handleWindowResize);

      if (this.options.debug) {
        console.log('[MobileKeyboardHandler] Using window resize fallback');
      }
    }

    // Handle focus events
    this.options.textarea.addEventListener('focus', this.handleFocus);
    this.options.textarea.addEventListener('blur', this.handleBlur);
  }

  /**
   * Handle Visual Viewport resize (keyboard appearance/disappearance)
   */
  handleViewportResize = () => {
    if (!this.visualViewport) return;

    const viewportHeight = this.visualViewport.height;
    const windowHeight = window.innerHeight;

    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Viewport resize:', {
        viewportHeight,
        windowHeight,
        scale: this.visualViewport.scale
      });
    }

    // Keyboard is visible if viewport height is significantly smaller than window height
    const wasKeyboardVisible = this.isKeyboardVisible;
    this.isKeyboardVisible = viewportHeight < windowHeight * 0.75;

    if (this.isKeyboardVisible !== wasKeyboardVisible) {
      if (this.isKeyboardVisible) {
        this.onKeyboardShow();
      } else {
        this.onKeyboardHide();
      }
    }

    // Always adjust layout when viewport changes
    if (this.isKeyboardVisible) {
      this.adjustLayout();
    }
  };

  /**
   * Handle Visual Viewport scroll
   */
  handleViewportScroll = () => {
    if (this.isKeyboardVisible) {
      // Ensure textarea stays in view during scroll
      this.ensureTextareaVisible();
    }
  };

  /**
   * Handle window resize (fallback)
   */
  handleWindowResize = () => {
    const currentHeight = window.innerHeight;
    const heightDifference = this.lastViewportHeight - currentHeight;

    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Window resize:', {
        lastHeight: this.lastViewportHeight,
        currentHeight,
        difference: heightDifference
      });
    }

    // Significant decrease in height suggests keyboard appeared
    if (heightDifference > 150) {
      if (!this.isKeyboardVisible) {
        this.isKeyboardVisible = true;
        this.onKeyboardShow();
      }
    }
    // Significant increase suggests keyboard hidden
    else if (heightDifference < -150) {
      if (this.isKeyboardVisible) {
        this.isKeyboardVisible = false;
        this.onKeyboardHide();
      }
    }

    this.lastViewportHeight = currentHeight;
  };

  /**
   * Handle textarea focus
   */
  handleFocus = () => {
    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Textarea focused');
    }

    // Delay to allow keyboard to appear
    setTimeout(() => {
      this.ensureTextareaVisible();
    }, 300);
  };

  /**
   * Handle textarea blur
   */
  handleBlur = () => {
    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Textarea blurred');
    }
  };

  /**
   * Called when keyboard appears
   */
  onKeyboardShow() {
    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Keyboard shown');
    }

    this.adjustLayout();
    this.ensureTextareaVisible();
  }

  /**
   * Called when keyboard hides
   */
  onKeyboardHide() {
    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Keyboard hidden');
    }

    // Reset wrapper height to auto
    if (this.options.wrapper) {
      this.options.wrapper.style.maxHeight = '';
    }
  }

  /**
   * Adjust layout to accommodate keyboard
   */
  adjustLayout() {
    if (!this.visualViewport || !this.options.wrapper) return;

    const viewportHeight = this.visualViewport.height;

    // Set wrapper max-height to visible viewport height minus some padding
    const maxHeight = viewportHeight - 20; // 20px padding
    this.options.wrapper.style.maxHeight = `${maxHeight}px`;
    this.options.wrapper.style.overflow = 'auto';

    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Adjusted wrapper height:', maxHeight);
    }
  }

  /**
   * Ensure textarea is visible above the keyboard
   */
  ensureTextareaVisible() {
    if (!this.options.textarea) return;

    // Scroll textarea into view
    this.options.textarea.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Scrolled textarea into view');
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    if (this.visualViewport) {
      this.visualViewport.removeEventListener('resize', this.handleViewportResize);
      this.visualViewport.removeEventListener('scroll', this.handleViewportScroll);
    } else {
      window.removeEventListener('resize', this.handleWindowResize);
    }

    if (this.options.textarea) {
      this.options.textarea.removeEventListener('focus', this.handleFocus);
      this.options.textarea.removeEventListener('blur', this.handleBlur);
    }

    if (this.options.debug) {
      console.log('[MobileKeyboardHandler] Destroyed');
    }
  }
}

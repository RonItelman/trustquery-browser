// AutoGrow - Automatically grows textarea height based on content

export default class AutoGrow {
  /**
   * Create auto-grow feature
   * @param {HTMLElement} textarea - Textarea element
   * @param {Object} options - Configuration
   */
  constructor(textarea, options = {}) {
    this.textarea = textarea;
    this.options = {
      maxHeight: options.maxHeight || 300,
      minHeight: options.minHeight || 44,
      ...options
    };

    this.initialize();
    console.log('[AutoGrow] Initialized with max height:', this.options.maxHeight);
  }

  /**
   * Initialize auto-grow functionality
   */
  initialize() {
    // Set initial min-height
    this.textarea.style.minHeight = `${this.options.minHeight}px`;

    // Listen for input changes
    this.textarea.addEventListener('input', () => this.adjust());

    // Listen for keyboard events (for line breaks)
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        setTimeout(() => this.adjust(), 0);
      }
    });

    // Initial adjustment
    this.adjust();
  }

  /**
   * Adjust textarea height based on content
   */
  adjust() {
    // Reset height to calculate new height
    this.textarea.style.height = 'auto';

    // Calculate new height (respecting max height)
    const newHeight = Math.min(
      Math.max(this.textarea.scrollHeight, this.options.minHeight),
      this.options.maxHeight
    );

    this.textarea.style.height = newHeight + 'px';
  }

  /**
   * Destroy auto-grow (remove listeners and reset styles)
   */
  destroy() {
    this.textarea.style.height = '';
    this.textarea.style.minHeight = '';
    console.log('[AutoGrow] Destroyed');
  }
}

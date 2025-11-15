// ValidationStateManager - Tracks validation state and triggers callbacks

export default class ValidationStateManager {
  /**
   * Create validation state manager
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    this.options = {
      onValidationChange: options.onValidationChange || null,
      ...options
    };

    this.state = {
      hasBlockingError: false,
      errors: [],      // matches with message-state: 'error'
      warnings: [],    // matches with message-state: 'warning'
      info: []         // matches with message-state: 'info'
    };

    console.log('[ValidationStateManager] Initialized');
  }

  /**
   * Update validation state based on current matches
   * @param {Array} matches - Current matches from scanner
   */
  update(matches) {
    // Reset state
    const newState = {
      hasBlockingError: false,
      errors: [],
      warnings: [],
      info: []
    };

    // Categorize current matches
    matches.forEach(match => {
      const messageState = match.intent?.handler?.['message-state'];
      const blockSubmit = match.intent?.handler?.['block-submit'] === true;

      if (blockSubmit) {
        newState.hasBlockingError = true;
      }

      switch (messageState) {
        case 'error':
          newState.errors.push(match);
          break;
        case 'warning':
          newState.warnings.push(match);
          break;
        case 'info':
          newState.info.push(match);
          break;
      }
    });

    // Check if state changed
    const stateChanged =
      this.state.hasBlockingError !== newState.hasBlockingError ||
      this.state.errors.length !== newState.errors.length ||
      this.state.warnings.length !== newState.warnings.length ||
      this.state.info.length !== newState.info.length;

    if (stateChanged) {
      this.state = newState;

      // Trigger callback
      if (this.options.onValidationChange) {
        this.options.onValidationChange(this.state);
      }

      console.log('[ValidationStateManager] State changed:', {
        hasBlockingError: newState.hasBlockingError,
        errors: newState.errors.length,
        warnings: newState.warnings.length,
        info: newState.info.length
      });
    }
  }

  /**
   * Get current validation state
   * @returns {Object} Current validation state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Reset validation state to empty
   */
  reset() {
    this.update([]);
  }

  /**
   * Check if there are blocking errors
   * @returns {boolean} True if there are blocking errors
   */
  hasBlockingErrors() {
    return this.state.hasBlockingError;
  }
}

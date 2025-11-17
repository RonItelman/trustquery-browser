// CommandHandlers - Handler registry for different command types
// Each command type has specific styling and behavior

export class CommandHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  /**
   * Register default handlers
   */
  registerDefaultHandlers() {
    this.register('not-allowed', new NotAllowedHandler());
    this.register('show-warning', new ShowWarningHandler());
    this.register('user-select-oneOf-and-warn', new UserSelectWithWarningHandler());
    this.register('user-select-oneOf', new UserSelectHandler());
    this.register('api-json-table', new ApiJsonTableHandler());
    this.register('api-md-table', new ApiMdTableHandler());
    this.register('display-menu', new DisplayMenuHandler());
    this.register('display-menu-with-uri', new DisplayMenuWithUriHandler());
  }

  /**
   * Register a handler
   * @param {string} commandType - Command type (e.g., 'not-allowed', 'show-warning')
   * @param {CommandHandler} handler - Handler instance
   */
  register(commandType, handler) {
    this.handlers.set(commandType, handler);
    console.log(`[CommandHandlerRegistry] Registered handler: ${commandType}`);
  }

  /**
   * Get handler for a command type
   * @param {string} commandType - Command type
   * @returns {CommandHandler|null} Handler or null
   */
  getHandler(commandType) {
    return this.handlers.get(commandType) || null;
  }

  /**
   * Get styles for a command type (or based on message-state)
   * @param {string} commandType - Command type
   * @param {Object} matchData - Match data including intent/handler
   * @returns {Object} Style configuration
   */
  getStyles(commandType, matchData = null) {
    // If matchData is provided, check message-state first
    if (matchData && matchData.intent && matchData.intent.handler) {
      const messageState = matchData.intent.handler['message-state'];
      if (messageState) {
        return this.getStylesForMessageState(messageState);
      }
    }

    // Fall back to command type handler
    const handler = this.getHandler(commandType);
    return handler ? handler.getStyles() : this.getDefaultStyles();
  }

  /**
   * Get styles based on message-state
   * @param {string} messageState - Message state (error, warning, info)
   * @returns {Object} Style configuration
   */
  getStylesForMessageState(messageState) {
    const stateStyles = {
      'error': {
        backgroundColor: 'rgba(220, 38, 38, 0.15)', // Red
        color: '#991b1b',
        textDecoration: 'none',
        borderBottom: '2px solid #dc2626',
        borderRadius: '0',
        cursor: 'not-allowed'
      },
      'warning': {
        backgroundColor: 'rgba(245, 158, 11, 0.15)', // Orange
        color: '#92400e',
        textDecoration: 'none',
        borderBottom: '2px solid #f59e0b',
        borderRadius: '0',
        cursor: 'help'
      },
      'info': {
        backgroundColor: 'rgba(16, 185, 129, 0.15)', // Green
        color: '#065f46',
        textDecoration: 'none',
        borderBottom: '2px solid #10b981',
        borderRadius: '0',
        cursor: 'pointer'
      }
    };

    return stateStyles[messageState] || this.getDefaultStyles();
  }

  /**
   * Get bubble content for a match
   * @param {string} commandType - Command type
   * @param {Object} matchData - Match data including intent info
   * @returns {string} HTML content for bubble
   */
  getBubbleContent(commandType, matchData) {
    const handler = this.getHandler(commandType);
    return handler ? handler.getBubbleContent(matchData) : null;
  }

  /**
   * Get default styles (fallback)
   */
  getDefaultStyles() {
    return {
      backgroundColor: 'rgba(74, 144, 226, 0.15)',
      color: '#2b6cb0',
      textDecoration: 'none',
      borderBottom: 'none'
    };
  }
}

/**
 * Base handler class
 */
class CommandHandler {
  getStyles() {
    return {};
  }

  getBubbleContent(matchData) {
    return null;
  }

  shouldBlockSubmit(matchData) {
    return false;
  }
}

/**
 * Handler for not-allowed commands (errors/forbidden)
 * Red background, red underline
 */
class NotAllowedHandler extends CommandHandler {
  getStyles() {
    return {
      backgroundColor: 'rgba(220, 38, 38, 0.15)', // Red background
      color: '#991b1b', // Dark red text
      textDecoration: 'none',
      borderBottom: '2px solid #dc2626', // Red underline
      borderRadius: '0', // No radius to avoid curved bottom border
      cursor: 'not-allowed'
    };
  }

  getBubbleContent(matchData) {
    const intent = matchData.intent || {};
    const handler = intent.handler || {};

    const description = intent.description || 'Not allowed';
    const message = handler['message-content'] || description;

    return `
      <div style="color: #991b1b;">
        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center;">
          <span style="margin-right: 6px;">⛔</span>
          Not Allowed
        </div>
        <div style="font-size: 12px; line-height: 1.4;">
          ${this.escapeHtml(message)}
        </div>
      </div>
    `;
  }

  shouldBlockSubmit(matchData) {
    const handler = matchData.intent?.handler || {};
    return handler['block-submit'] === true;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Handler for show-warning commands
 * Yellow/orange background, orange underline
 */
class ShowWarningHandler extends CommandHandler {
  getStyles() {
    return {
      backgroundColor: 'rgba(245, 158, 11, 0.15)', // Amber/orange background
      color: '#92400e', // Dark amber text
      textDecoration: 'none',
      borderBottom: '2px solid #f59e0b', // Orange underline
      borderRadius: '0', // No radius to avoid curved bottom border
      cursor: 'help'
    };
  }

  getBubbleContent(matchData) {
    const intent = matchData.intent || {};
    const handler = intent.handler || {};

    const description = intent.description || 'Warning';
    const message = handler['message-content'] || description;

    return `
      <div style="color: #92400e;">
        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center;">
          <span style="margin-right: 6px;">⚠️</span>
          Warning
        </div>
        <div style="font-size: 12px; line-height: 1.4;">
          ${this.escapeHtml(message)}
        </div>
      </div>
    `;
  }

  shouldBlockSubmit(matchData) {
    const handler = matchData.intent?.handler || {};
    return handler['block-submit'] === true;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Handler for user-select-oneOf-and-warn commands
 * Shows warning + dropdown
 */
class UserSelectWithWarningHandler extends CommandHandler {
  getStyles() {
    return {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      color: '#92400e',
      textDecoration: 'none',
      borderBottom: '2px solid #f59e0b',
      cursor: 'pointer'
    };
  }

  getBubbleContent(matchData) {
    // Will show dropdown on click instead of bubble
    return null;
  }
}

/**
 * Handler for user-select-oneOf commands
 * Shows dropdown without warning
 */
class UserSelectHandler extends CommandHandler {
  getStyles() {
    return {
      backgroundColor: 'rgba(59, 130, 246, 0.15)', // Blue background
      color: '#1e40af', // Dark blue text
      textDecoration: 'none',
      borderBottom: '2px solid #3b82f6', // Blue underline
      cursor: 'pointer'
    };
  }

  getBubbleContent(matchData) {
    // Will show dropdown on click instead of bubble
    return null;
  }
}

/**
 * Handler for api-json-table commands
 */
class ApiJsonTableHandler extends CommandHandler {
  getStyles() {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.15)', // Green background
      color: '#065f46', // Dark green text
      textDecoration: 'none',
      borderBottom: '2px solid #10b981',
      cursor: 'pointer'
    };
  }

  getBubbleContent(matchData) {
    const intent = matchData.intent || {};
    const description = intent.description || 'Click to view data';

    return `
      <div style="color: #065f46;">
        <div style="font-weight: 600; margin-bottom: 4px;">
          📊 Data Table
        </div>
        <div style="font-size: 12px;">
          ${this.escapeHtml(description)}
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Handler for api-md-table commands
 */
class ApiMdTableHandler extends CommandHandler {
  getStyles() {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      color: '#065f46',
      textDecoration: 'none',
      borderBottom: '2px solid #10b981',
      cursor: 'pointer'
    };
  }

  getBubbleContent(matchData) {
    const intent = matchData.intent || {};
    const description = intent.description || 'Click to view data';

    return `
      <div style="color: #065f46;">
        <div style="font-weight: 600; margin-bottom: 4px;">
          📊 Data Table
        </div>
        <div style="font-size: 12px;">
          ${this.escapeHtml(description)}
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Handler for display-menu category
 * Shows dropdown menu with selectable options
 */
class DisplayMenuHandler extends CommandHandler {
  getStyles() {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.15)', // Green background
      color: '#065f46', // Dark green text
      textDecoration: 'none',
      borderBottom: '2px solid #10b981', // Green underline
      cursor: 'pointer'
    };
  }

  getBubbleContent(matchData) {
    // Display menu shows dropdown, not bubble
    return null;
  }
}

/**
 * Handler for display-menu-with-uri category
 * Shows dropdown menu with selectable options and clickable URI links
 */
class DisplayMenuWithUriHandler extends CommandHandler {
  getStyles() {
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.15)', // Green background
      color: '#065f46', // Dark green text
      textDecoration: 'none',
      borderBottom: '2px solid #10b981', // Green underline
      cursor: 'pointer'
    };
  }

  getBubbleContent(matchData) {
    // Display menu with URI shows dropdown, not bubble
    return null;
  }
}

export default CommandHandlerRegistry;

// OverlayRenderer - Renders text with styled matches in a line-based overlay
// Much simpler than grid approach - each line is a div, matches are spans

export default class OverlayRenderer {
  /**
   * Create a renderer
   * @param {HTMLElement} overlay - Overlay container element
   * @param {Object} options - Rendering options
   */
  constructor(overlay, options = {}) {
    this.overlay = overlay;
    this.options = {
      theme: options.theme || 'light',
      commandHandlers: options.commandHandlers || null,
      ...options
    };

    console.log('[OverlayRenderer] Initialized');
  }

  /**
   * Render text with matches
   * @param {string} text - Text content
   * @param {Array} matches - Array of match objects from CommandScanner
   */
  render(text, matches = []) {
    // Split text into lines
    const lines = text.split('\n');

    // Build HTML for each line
    const linesHTML = lines.map((line, lineIndex) => {
      return this.renderLine(line, lineIndex, matches);
    }).join('');

    // Update overlay
    this.overlay.innerHTML = linesHTML;

    console.log('[OverlayRenderer] Rendered', lines.length, 'lines with', matches.length, 'matches');
  }

  /**
   * Render a single line with matches
   * @param {string} line - Line text
   * @param {number} lineIndex - Line number (0-indexed)
   * @param {Array} matches - All matches from scanner
   * @returns {string} HTML for line
   */
  renderLine(line, lineIndex, matches) {
    // Find matches on this line
    const lineMatches = this.getMatchesForLine(line, lineIndex, matches);

    if (lineMatches.length === 0) {
      // No matches - render plain line
      return `<div class="tq-line">${this.escapeHtml(line) || '&nbsp;'}</div>`;
    }

    // Sort matches by start position
    lineMatches.sort((a, b) => a.start - b.start);

    // Build HTML with matches as spans
    let html = '<div class="tq-line">';
    let lastIndex = 0;

    for (const match of lineMatches) {
      // Add text before match
      if (match.start > lastIndex) {
        html += this.escapeHtml(line.substring(lastIndex, match.start));
      }

      // Add match as styled span
      const matchText = line.substring(match.start, match.end);
      const classes = this.getMatchClasses(match);
      const dataAttrs = this.getMatchDataAttributes(match);
      const inlineStyles = this.getMatchInlineStyles(match);

      html += `<span class="${classes}" ${dataAttrs} style="${inlineStyles}">${this.escapeHtml(matchText)}</span>`;

      lastIndex = match.end;
    }

    // Add remaining text after last match
    if (lastIndex < line.length) {
      html += this.escapeHtml(line.substring(lastIndex));
    }

    // Handle empty lines
    if (line.length === 0) {
      html += '&nbsp;';
    }

    html += '</div>';

    return html;
  }

  /**
   * Get matches that apply to a specific line
   * @param {string} line - Line text
   * @param {number} lineIndex - Line number
   * @param {Array} matches - All matches
   * @returns {Array} Matches for this line with adjusted positions
   */
  getMatchesForLine(line, lineIndex, matches) {
    const lineMatches = [];

    // Calculate absolute position of this line in the full text
    // (we'll need to know line starts to filter matches)
    // For now, matches already have line info from scanner

    for (const match of matches) {
      if (match.line === lineIndex) {
        lineMatches.push({
          ...match,
          start: match.col, // Column position on this line
          end: match.col + match.length
        });
      }
    }

    return lineMatches;
  }

  /**
   * Get CSS classes for a match
   * @param {Object} match - Match object
   * @returns {string} Space-separated class names
   */
  getMatchClasses(match) {
    const classes = ['tq-match'];

    // Add command type as class
    if (match.command && match.command.type) {
      classes.push(`tq-match-${match.command.type}`);
    }

    // Add behavior as class (bubble, dropdown, etc.)
    if (match.command && match.command.behavior) {
      classes.push(`tq-behavior-${match.command.behavior}`);
    }

    return classes.join(' ');
  }

  /**
   * Get data attributes for a match
   * @param {Object} match - Match object
   * @returns {string} Data attributes string
   */
  getMatchDataAttributes(match) {
    const attrs = [];

    // Store match text
    attrs.push(`data-match-text="${this.escapeAttr(match.text)}"`);

    // Store command info
    if (match.command) {
      attrs.push(`data-command-id="${this.escapeAttr(match.command.id || '')}"`);
      attrs.push(`data-command-type="${this.escapeAttr(match.command.commandType || '')}"`);
      attrs.push(`data-command-path="${this.escapeAttr(match.command.commandPath || '')}"`);
      attrs.push(`data-intent-path="${this.escapeAttr(match.command.intentPath || '')}"`);

      // Store intent info as JSON for InteractionHandler
      if (match.command.intent) {
        attrs.push(`data-intent='${this.escapeAttr(JSON.stringify(match.command.intent))}'`);
      }

      // Determine behavior based on handler properties
      if (match.command.intent && match.command.intent.handler) {
        const handler = match.command.intent.handler;
        if (handler.options && Array.isArray(handler.options) && handler.options.length > 0) {
          attrs.push(`data-behavior="dropdown"`);
        } else if (handler.message || handler['message-content'] || match.command.intent.description) {
          attrs.push(`data-behavior="bubble"`);
        }
      }
    }

    // Store position info
    attrs.push(`data-line="${match.line}"`);
    attrs.push(`data-col="${match.col}"`);

    return attrs.join(' ');
  }

  /**
   * Get inline styles for a match based on command type or message-state
   * @param {Object} match - Match object
   * @returns {string} Inline style string
   */
  getMatchInlineStyles(match) {
    if (!this.options.commandHandlers || !match.command) {
      return 'pointer-events: auto; cursor: pointer;';
    }

    const commandType = match.command.commandType;

    // Create matchData with intent info for message-state lookup
    const matchData = {
      intent: match.command.intent,
      commandType: commandType
    };

    const styles = this.options.commandHandlers.getStyles(commandType, matchData);

    // Convert style object to CSS string
    const styleStr = Object.entries(styles)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');

    return styleStr + '; pointer-events: auto;';
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape attribute value
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeAttr(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

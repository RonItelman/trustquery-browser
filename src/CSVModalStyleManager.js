// CSVModalStyleManager - Handles styling for CSV modal
// Single responsibility: apply consistent styles to CSV modal elements

export default class CSVModalStyleManager {
  /**
   * Create CSV modal style manager
   * @param {Object} options - Style options
   */
  constructor(options = {}) {
    this.options = {
      // Modal colors
      backdropColor: options.backdropColor || 'rgba(0, 0, 0, 0.5)',
      modalBackground: options.modalBackground || '#ffffff',

      // Header colors
      headerBackground: options.headerBackground || '#f8fafc',
      headerBorder: options.headerBorder || '#e2e8f0',

      // Table colors
      tableBorder: options.tableBorder || '#e2e8f0',
      headerCellBackground: options.headerCellBackground || '#f1f5f9',
      cellBorder: options.cellBorder || '#e2e8f0',

      // Highlight colors (matching textarea triggers)
      errorHighlight: options.errorHighlight || '#fee2e2',
      errorBorder: options.errorBorder || '#ef4444',
      warningHighlight: options.warningHighlight || '#fef3c7',
      warningBorder: options.warningBorder || '#f59e0b',
      infoHighlight: options.infoHighlight || '#dbeafe',
      infoBorder: options.infoBorder || '#3b82f6',

      ...options
    };
  }

  /**
   * Apply backdrop styles
   * @param {HTMLElement} backdrop - Backdrop element
   */
  applyBackdropStyles(backdrop) {
    Object.assign(backdrop.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: this.options.backdropColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000',
      padding: '20px'
    });
  }

  /**
   * Apply modal styles
   * @param {HTMLElement} modal - Modal element
   */
  applyModalStyles(modal) {
    Object.assign(modal.style, {
      backgroundColor: this.options.modalBackground,
      borderRadius: '8px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      maxWidth: '90vw',
      maxHeight: '90vh',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    });
  }

  /**
   * Apply header styles
   * @param {HTMLElement} header - Header element
   */
  applyHeaderStyles(header) {
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: `1px solid ${this.options.headerBorder}`,
      backgroundColor: this.options.headerBackground,
      flexShrink: '0'
    });
  }

  /**
   * Apply title styles
   * @param {HTMLElement} title - Title element
   */
  applyTitleStyles(title) {
    Object.assign(title.style, {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b'
    });
  }

  /**
   * Apply close button styles
   * @param {HTMLElement} button - Close button element
   */
  applyCloseButtonStyles(button) {
    Object.assign(button.style, {
      background: 'transparent',
      border: 'none',
      fontSize: '28px',
      color: '#64748b',
      cursor: 'pointer',
      lineHeight: '1',
      padding: '0',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'background-color 0.2s, color 0.2s'
    });

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#f1f5f9';
      button.style.color = '#1e293b';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
      button.style.color = '#64748b';
    });
  }

  /**
   * Apply table container styles (scrollable)
   * @param {HTMLElement} container - Table container element
   */
  applyTableContainerStyles(container) {
    Object.assign(container.style, {
      flex: '1',
      overflow: 'auto',
      padding: '20px'
    });
  }

  /**
   * Apply table styles
   * @param {HTMLElement} table - Table element
   */
  applyTableStyles(table) {
    Object.assign(table.style, {
      borderCollapse: 'collapse',
      width: '100%',
      fontSize: '14px',
      backgroundColor: '#ffffff'
    });
  }

  /**
   * Apply header cell styles
   * @param {HTMLElement} cell - Header cell element
   */
  applyHeaderCellStyles(cell) {
    Object.assign(cell.style, {
      padding: '12px 16px',
      textAlign: 'left',
      fontWeight: '600',
      backgroundColor: this.options.headerCellBackground,
      border: `1px solid ${this.options.tableBorder}`,
      color: '#1e293b',
      position: 'sticky',
      top: '0',
      zIndex: '10',
      whiteSpace: 'nowrap'
    });
  }

  /**
   * Apply data cell styles
   * @param {HTMLElement} cell - Data cell element
   */
  applyDataCellStyles(cell) {
    Object.assign(cell.style, {
      padding: '10px 16px',
      border: `1px solid ${this.options.cellBorder}`,
      color: '#334155',
      whiteSpace: 'nowrap'
    });
  }

  /**
   * Apply match highlighting styles to cell content
   * @param {HTMLElement} span - Span element
   * @param {string} messageState - Message state (error, warning, info)
   */
  applyCellMatchStyles(span, messageState) {
    const colorMap = {
      'error': {
        background: this.options.errorHighlight,
        border: this.options.errorBorder
      },
      'warning': {
        background: this.options.warningHighlight,
        border: this.options.warningBorder
      },
      'info': {
        background: this.options.infoHighlight,
        border: this.options.infoBorder
      }
    };

    const colors = colorMap[messageState] || colorMap.info;

    Object.assign(span.style, {
      backgroundColor: colors.background,
      borderBottom: `2px solid ${colors.border}`,
      padding: '2px 4px',
      borderRadius: '3px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'inline-block'
    });

    // Hover effect
    span.addEventListener('mouseenter', () => {
      span.style.backgroundColor = this.adjustBrightness(colors.background, -10);
    });

    span.addEventListener('mouseleave', () => {
      span.style.backgroundColor = colors.background;
    });
  }

  /**
   * Adjust color brightness
   * @param {string} color - Hex color
   * @param {number} amount - Amount to adjust (-255 to 255)
   * @returns {string} - Adjusted color
   */
  adjustBrightness(color, amount) {
    // Simple brightness adjustment for hex colors
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Update theme colors dynamically
   * @param {Object} newColors - New color options
   */
  updateTheme(newColors) {
    Object.assign(this.options, newColors);
  }
}

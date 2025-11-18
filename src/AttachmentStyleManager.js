// AttachmentStyleManager - Handles all styling for attachment cards
// Single responsibility: apply consistent inline styles to attachment UI elements

export default class AttachmentStyleManager {
  /**
   * Create attachment style manager
   * @param {Object} options - Style options
   */
  constructor(options = {}) {
    this.options = {
      // Card colors
      cardBackground: options.cardBackground || '#f0f9ff', // Light blue background
      cardBorder: options.cardBorder || '#e2e8f0',

      // Text colors
      headerColor: options.headerColor || '#1e293b',
      metaColor: options.metaColor || '#64748b',

      // Remove button colors
      removeBackground: options.removeBackground || '#ef4444',
      removeBackgroundHover: options.removeBackgroundHover || '#dc2626',

      ...options
    };
  }

  /**
   * Apply wrapper styles (container for icon + card)
   * @param {HTMLElement} wrapper - Wrapper element
   */
  applyWrapperStyles(wrapper) {
    Object.assign(wrapper.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '6px'
    });
  }

  /**
   * Apply icon placeholder styles
   * @param {HTMLElement} placeholder - Icon placeholder element
   * @param {boolean} hasIcon - Whether icon is present
   */
  applyIconPlaceholderStyles(placeholder, hasIcon) {
    Object.assign(placeholder.style, {
      width: '24px',
      minWidth: '24px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0'
    });
  }

  /**
   * Apply icon styles
   * @param {HTMLElement} icon - Icon element
   */
  applyIconStyles(icon) {
    if (!icon) return;

    Object.assign(icon.style, {
      width: '20px',
      height: '20px',
      cursor: 'pointer',
      transition: 'transform 0.2s'
    });

    // Hover effect - slight scale
    icon.addEventListener('mouseenter', () => {
      icon.style.transform = 'scale(1.1)';
    });

    icon.addEventListener('mouseleave', () => {
      icon.style.transform = 'scale(1)';
    });
  }

  /**
   * Apply card styles (reduced padding to prevent cutoff)
   * @param {HTMLElement} card - Card element
   */
  applyCardStyles(card) {
    Object.assign(card.style, {
      position: 'relative',
      background: this.options.cardBackground,
      border: `1px solid ${this.options.cardBorder}`,
      borderRadius: '6px',
      padding: '6px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      boxSizing: 'border-box',
      maxHeight: '48px',
      overflow: 'hidden',
      flex: '1' // Take remaining space in wrapper
    });
  }

  /**
   * Apply remove button styles (dark icon, no background)
   * @param {HTMLElement} button - Remove button element
   */
  applyRemoveButtonStyles(button) {
    Object.assign(button.style, {
      position: 'absolute',
      top: '4px', // Adjusted for reduced padding
      right: '6px',
      background: 'transparent',
      color: '#64748b',
      border: 'none',
      borderRadius: '3px',
      width: '18px',
      height: '18px',
      fontSize: '18px',
      lineHeight: '1',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s',
      padding: '0',
      fontWeight: '400'
    });

    // Hover effect - darker color
    button.addEventListener('mouseenter', () => {
      button.style.color = '#1e293b'; // Darker on hover
    });

    button.addEventListener('mouseleave', () => {
      button.style.color = '#64748b'; // Back to gray
    });
  }

  /**
   * Apply header (file name) styles - smaller size
   * @param {HTMLElement} header - Header element
   */
  applyHeaderStyles(header) {
    Object.assign(header.style, {
      fontWeight: '600',
      fontSize: '11px', // Further reduced from 12px to 11px
      color: this.options.headerColor,
      paddingRight: '22px',
      wordBreak: 'break-word',
      lineHeight: '1.2' // Tighter line height
    });
  }

  /**
   * Apply metadata row styles
   * @param {HTMLElement} metaRow - Metadata row element
   */
  applyMetaStyles(metaRow) {
    Object.assign(metaRow.style, {
      display: 'flex',
      gap: '10px', // Slightly reduced from 12px
      fontSize: '10px', // Reduced from 11px
      color: this.options.metaColor,
      lineHeight: '1.2'
    });
  }

  /**
   * Update theme colors dynamically
   * @param {Object} newColors - New color options
   */
  updateTheme(newColors) {
    Object.assign(this.options, newColors);
  }
}

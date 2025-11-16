// DropdownManager - Handles dropdown menus with filtering, keyboard navigation, and selection

export default class DropdownManager {
  /**
   * Create dropdown manager
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    this.options = {
      styleManager: options.styleManager || null,
      textarea: options.textarea || null,
      onWordClick: options.onWordClick || null,
      dropdownOffset: options.dropdownOffset || 10, // Configurable offset from trigger word
      ...options
    };

    this.activeDropdown = null;
    this.activeDropdownMatch = null;
    this.dropdownOptions = null;
    this.dropdownMatchData = null;
    this.selectedDropdownIndex = 0;
    this.keyboardHandler = null;

    if (this.options.debug) {
      console.log('[DropdownManager] Initialized with offset:', this.options.dropdownOffset);
    }
  }

  /**
   * Show dropdown for a match
   * @param {HTMLElement} matchEl - Match element
   * @param {Object} matchData - Match data
   */
  showDropdown(matchEl, matchData) {
    // Close any existing dropdown
    this.hideDropdown();

    const command = matchData.command;

    // Get dropdown options - check intent.handler.options first (new format)
    const options = matchData.intent?.handler?.options || command.options || command.dropdownOptions || [];

    if (options.length === 0) {
      console.warn('[DropdownManager] No dropdown options for:', matchData.text);
      return;
    }

    // Store reference to match element
    this.activeDropdownMatch = matchEl;
    this.selectedDropdownIndex = 0;

    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'tq-dropdown';

    // Apply inline styles via StyleManager
    if (this.options.styleManager) {
      this.options.styleManager.applyDropdownStyles(dropdown);
    }

    // Add header container based on message-state
    const messageState = matchData.intent?.handler?.['message-state'] || 'info';
    this.createHeaderContainer(dropdown, messageState);

    // Add description row if message exists
    const message = matchData.intent?.handler?.message;
    if (message) {
      this.createDescriptionRow(dropdown, message, messageState);
    }

    // Check if filter is enabled
    const hasFilter = matchData.intent?.handler?.filter === true;

    // Add filter input if enabled
    if (hasFilter) {
      this.createFilterInput(dropdown, matchData);
    }

    // Create dropdown items
    this.createDropdownItems(dropdown, options, matchData);

    // Prevent textarea blur when clicking dropdown (except filter input)
    dropdown.addEventListener('mousedown', (e) => {
      // Allow filter input to receive focus naturally
      if (!e.target.classList.contains('tq-dropdown-filter')) {
        e.preventDefault(); // Prevent blur on textarea for items
      }
    });

    // Add to document
    document.body.appendChild(dropdown);
    this.activeDropdown = dropdown;
    this.dropdownOptions = options;
    this.dropdownMatchData = matchData;

    // Position dropdown
    this.positionDropdown(dropdown, matchEl);

    // Setup keyboard navigation
    this.setupKeyboardHandlers();

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', this.closeDropdownHandler);
    }, 0);

    if (this.options.debug) {
      console.log('[DropdownManager] Dropdown shown with', options.length, 'options');
    }
  }

  /**
   * Create header container for dropdown
   * @param {HTMLElement} dropdown - Dropdown element
   * @param {string} messageState - Message state (error, warning, info)
   */
  createHeaderContainer(dropdown, messageState) {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'bubble-header-container';
    headerContainer.setAttribute('data-type', messageState);

    // Create image
    const img = document.createElement('img');
    img.src = `./assets/trustquery-${messageState}.svg`;
    img.style.height = '24px';
    img.style.width = 'auto';

    // Create text span
    const span = document.createElement('span');
    const textMap = {
      'error': 'TrustQuery Stop',
      'warning': 'TrustQuery Clarify',
      'info': 'TrustQuery Quick Link'
    };
    span.textContent = textMap[messageState] || 'TrustQuery';

    // Append to header
    headerContainer.appendChild(img);
    headerContainer.appendChild(span);

    // Apply styles to header via StyleManager
    if (this.options.styleManager) {
      this.options.styleManager.applyDropdownHeaderStyles(headerContainer, messageState);
    }

    dropdown.appendChild(headerContainer);
  }

  /**
   * Create description row for dropdown
   * @param {HTMLElement} dropdown - Dropdown element
   * @param {string} message - Description message
   * @param {string} messageState - Message state (error, warning, info)
   */
  createDescriptionRow(dropdown, message, messageState) {
    const descriptionRow = document.createElement('div');
    descriptionRow.className = 'tq-dropdown-description';
    descriptionRow.textContent = message;

    // Apply styles to description via StyleManager
    if (this.options.styleManager) {
      this.options.styleManager.applyDropdownDescriptionStyles(descriptionRow, messageState);
    }

    dropdown.appendChild(descriptionRow);
  }

  /**
   * Create filter input for dropdown
   * @param {HTMLElement} dropdown - Dropdown element
   * @param {Object} matchData - Match data
   */
  createFilterInput(dropdown, matchData) {
    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.className = 'tq-dropdown-filter';
    filterInput.placeholder = 'Filter options...';

    // Apply inline styles via StyleManager
    if (this.options.styleManager) {
      this.options.styleManager.applyDropdownFilterStyles(filterInput);
    }

    // Filter click handling is managed by dropdown and closeDropdownHandler
    // No special mousedown/blur handling needed - filter focuses naturally

    // Filter options as user types
    filterInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const items = dropdown.querySelectorAll('.tq-dropdown-item');
      let firstVisibleIndex = -1;

      items.forEach((item, index) => {
        const text = item.textContent.toLowerCase();
        const matches = text.includes(query);
        item.style.display = matches ? 'block' : 'none';

        // Track first visible item for selection
        if (matches && firstVisibleIndex === -1) {
          firstVisibleIndex = index;
        }
      });

      // Update selected index to first visible item
      if (firstVisibleIndex !== -1) {
        this.selectedDropdownIndex = firstVisibleIndex;
        this.updateDropdownSelection();
      }
    });

    // Prevent dropdown keyboard navigation from affecting filter input
    filterInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        // Move focus to dropdown items
        filterInput.blur();
        this.options.textarea.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.selectCurrentDropdownItem();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.hideDropdown();
      }
    });

    dropdown.appendChild(filterInput);

    // Don't auto-focus - keep focus on textarea for natural typing/arrow key flow
  }

  /**
   * Create dropdown items
   * @param {HTMLElement} dropdown - Dropdown element
   * @param {Array} options - Dropdown options
   * @param {Object} matchData - Match data
   */
  createDropdownItems(dropdown, options, matchData) {
    options.forEach((option, index) => {
      // Check if this is a user-input option
      if (typeof option === 'object' && option['user-input'] === true) {
        this.createUserInputOption(dropdown, option, matchData);
        return;
      }

      const item = document.createElement('div');
      item.className = 'tq-dropdown-item';
      item.textContent = typeof option === 'string' ? option : option.label || option.value;

      // Highlight first item by default
      if (index === 0) {
        item.classList.add('tq-dropdown-item-selected');
      }

      // Apply inline styles to item via StyleManager
      if (this.options.styleManager) {
        this.options.styleManager.applyDropdownItemStyles(item);
      }

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleDropdownSelect(option, matchData);
        this.hideDropdown();
      });
      dropdown.appendChild(item);
    });
  }

  /**
   * Create user input option
   * @param {HTMLElement} dropdown - Dropdown element
   * @param {Object} option - Option with user-input flag
   * @param {Object} matchData - Match data
   */
  createUserInputOption(dropdown, option, matchData) {
    const container = document.createElement('div');
    container.className = 'tq-dropdown-user-input-container tq-dropdown-item';
    container.setAttribute('data-user-input', 'true');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tq-dropdown-user-input';
    input.placeholder = option.placeholder || 'Enter custom value...';

    container.appendChild(input);

    // Apply styles via StyleManager
    if (this.options.styleManager) {
      this.options.styleManager.applyUserInputStyles(container, input);
    }

    // Click on container focuses input
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      input.focus();
    });

    // Handle submit on Enter key
    const handleSubmit = () => {
      const value = input.value.trim();
      if (value) {
        const customOption = {
          label: value,
          'on-select': {
            display: value
          }
        };
        this.handleDropdownSelect(customOption, matchData);
        this.hideDropdown();
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.hideDropdown();
      } else if (e.key === 'ArrowDown') {
        // Navigate to next item
        e.preventDefault();
        e.stopPropagation();
        this.moveDropdownSelection(1);
        this.options.textarea.focus();
      } else if (e.key === 'ArrowUp') {
        // Navigate to previous item
        e.preventDefault();
        e.stopPropagation();
        this.moveDropdownSelection(-1);
        this.options.textarea.focus();
      }
    });

    dropdown.appendChild(container);
  }

  /**
   * Hide current dropdown
   */
  hideDropdown() {
    if (this.activeDropdown) {
      this.activeDropdown.remove();
      this.activeDropdown = null;
      this.activeDropdownMatch = null;
      this.dropdownOptions = null;
      this.dropdownMatchData = null;
      this.selectedDropdownIndex = 0;
      document.removeEventListener('click', this.closeDropdownHandler);
      document.removeEventListener('keydown', this.keyboardHandler);
    }
  }

  /**
   * Close dropdown handler (bound to document)
   */
  closeDropdownHandler = (e) => {
    // Only close if clicking outside the dropdown
    if (this.activeDropdown && !this.activeDropdown.contains(e.target)) {
      this.hideDropdown();
    }
  }

  /**
   * Position dropdown relative to match element
   * @param {HTMLElement} dropdown - Dropdown element
   * @param {HTMLElement} matchEl - Match element
   */
  positionDropdown(dropdown, matchEl) {
    const rect = matchEl.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    const offset = this.options.dropdownOffset;

    // Position above match by default (since input is at bottom)
    let top = rect.top + window.scrollY - dropdownRect.height - offset;
    let left = rect.left + window.scrollX;

    // If dropdown goes off top edge, position below instead
    if (top < window.scrollY) {
      top = rect.bottom + window.scrollY + offset;
    }

    // Check if dropdown goes off right edge
    if (left + dropdownRect.width > window.innerWidth) {
      left = window.innerWidth - dropdownRect.width - 10;
    }

    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
  }

  /**
   * Setup keyboard handlers for dropdown navigation
   */
  setupKeyboardHandlers() {
    // Remove old handler if exists
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }

    // Create new handler
    this.keyboardHandler = (e) => {
      // Only handle if dropdown is active
      if (!this.activeDropdown) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.moveDropdownSelection(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.moveDropdownSelection(-1);
          break;
        case 'Enter':
          e.preventDefault();
          this.selectCurrentDropdownItem();
          break;
        case 'Escape':
          e.preventDefault();
          this.hideDropdown();
          break;
      }
    };

    // Attach handler
    document.addEventListener('keydown', this.keyboardHandler);
  }

  /**
   * Move dropdown selection up or down
   * @param {number} direction - 1 for down, -1 for up
   */
  moveDropdownSelection(direction) {
    if (!this.activeDropdown || !this.dropdownOptions) {
      return;
    }

    const items = this.activeDropdown.querySelectorAll('.tq-dropdown-item');
    const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');

    if (visibleItems.length === 0) {
      return;
    }

    // Find current selected visible index
    let currentVisibleIndex = visibleItems.findIndex((item, index) => {
      return Array.from(items).indexOf(item) === this.selectedDropdownIndex;
    });

    // Move to next/prev visible item
    currentVisibleIndex += direction;

    // Wrap around visible items only
    if (currentVisibleIndex < 0) {
      currentVisibleIndex = visibleItems.length - 1;
    } else if (currentVisibleIndex >= visibleItems.length) {
      currentVisibleIndex = 0;
    }

    // Update selected index to the actual index
    this.selectedDropdownIndex = Array.from(items).indexOf(visibleItems[currentVisibleIndex]);

    // Update visual selection
    this.updateDropdownSelection();
  }

  /**
   * Update visual selection in dropdown
   */
  updateDropdownSelection() {
    if (!this.activeDropdown) {
      return;
    }

    const items = this.activeDropdown.querySelectorAll('.tq-dropdown-item');
    items.forEach((item, index) => {
      if (index === this.selectedDropdownIndex) {
        item.classList.add('tq-dropdown-item-selected');
        // Scroll into view if needed
        item.scrollIntoView({ block: 'nearest' });

        // If this is a user input item, focus the input
        if (item.getAttribute('data-user-input') === 'true') {
          const input = item.querySelector('.tq-dropdown-user-input');
          if (input) {
            setTimeout(() => input.focus(), 0);
          }
        }
      } else {
        item.classList.remove('tq-dropdown-item-selected');

        // If this is a user input item, blur the input when navigating away
        if (item.getAttribute('data-user-input') === 'true') {
          const input = item.querySelector('.tq-dropdown-user-input');
          if (input) {
            input.blur();
          }
        }
      }
    });
  }

  /**
   * Select the currently highlighted dropdown item
   */
  selectCurrentDropdownItem() {
    if (!this.dropdownOptions || !this.dropdownMatchData) {
      return;
    }

    const items = this.activeDropdown.querySelectorAll('.tq-dropdown-item');
    const selectedItem = items[this.selectedDropdownIndex];

    // Check if this is a user input item
    if (selectedItem && selectedItem.getAttribute('data-user-input') === 'true') {
      // Focus the input field instead of selecting
      const input = selectedItem.querySelector('.tq-dropdown-user-input');
      if (input) {
        input.focus();
      }
      return;
    }

    const selectedOption = this.dropdownOptions[this.selectedDropdownIndex];
    this.handleDropdownSelect(selectedOption, this.dropdownMatchData);
    this.hideDropdown();
  }

  /**
   * Handle dropdown option selection
   * @param {*} option - Selected option
   * @param {Object} matchData - Match data
   */
  handleDropdownSelect(option, matchData) {
    if (this.options.debug) {
      console.log('[DropdownManager] Dropdown option selected:', option, 'for:', matchData.text);
    }

    // Check if option has on-select.display
    if (option['on-select'] && option['on-select'].display && this.options.textarea) {
      const displayText = option['on-select'].display;
      const textarea = this.options.textarea;
      const text = textarea.value;

      // Find the trigger text position
      const lines = text.split('\n');
      const line = lines[matchData.line];

      if (line) {
        // Append to trigger text with "/" separator
        const before = line.substring(0, matchData.col);
        const after = line.substring(matchData.col + matchData.text.length);
        const newText = matchData.text + '/' + displayText;
        lines[matchData.line] = before + newText + after;

        // Update textarea
        textarea.value = lines.join('\n');

        // Trigger input event to re-render
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);

        if (this.options.debug) {
          console.log('[DropdownManager] Appended to', matchData.text, '→', newText);
        }
      }
    }

    // Trigger callback
    if (this.options.onWordClick) {
      this.options.onWordClick({
        ...matchData,
        selectedOption: option
      });
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.hideDropdown();
  }

  /**
   * Destroy
   */
  destroy() {
    this.cleanup();
    if (this.options.debug) {
      console.log('[DropdownManager] Destroyed');
    }
  }
}

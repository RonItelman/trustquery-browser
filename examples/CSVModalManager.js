// CSVModalManager - Handles CSV modal display with trigger matching
// Single responsibility: manage CSV modal lifecycle and rendering

export default class CSVModalManager {
  /**
   * Create CSV modal manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      styleManager: options.styleManager || null,
      commandScanner: options.commandScanner || null,
      dropdownManager: options.dropdownManager || null,
      onCellClick: options.onCellClick || null,
      debug: options.debug || false,
      ...options
    };

    this.modal = null;
    this.currentCSVData = null;
    this.parsedData = null;

    if (this.options.debug) {
      console.log('[CSVModalManager] Initialized');
    }
  }

  /**
   * Parse CSV text into 2D array
   * @param {string} csvText - Raw CSV text
   * @returns {Array} - 2D array of cells
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      // Simple CSV parsing (handles basic cases)
      return line.split(',').map(cell => cell.trim());
    });
  }

  /**
   * Check if a cell value matches any triggers
   * @param {string} cellValue - Cell content
   * @returns {Object|null} - Match data or null
   */
  checkCellForTriggers(cellValue) {
    if (!this.options.commandScanner || !cellValue) {
      return null;
    }

    const commandMap = this.options.commandScanner.commandMap;
    if (!commandMap || !commandMap['tql-triggers']) {
      return null;
    }

    // Check all trigger states (error, warning, info)
    const triggers = commandMap['tql-triggers'];
    const allTriggers = [
      ...(triggers.error || []),
      ...(triggers.warning || []),
      ...(triggers.info || [])
    ];

    // Check each trigger
    for (const trigger of allTriggers) {
      // Handle 'match' type triggers
      if (trigger.type === 'match' && trigger.match) {
        for (const matchText of trigger.match) {
          if (cellValue.toLowerCase() === matchText.toLowerCase()) {
            return {
              text: cellValue,
              trigger,
              matchType: 'exact',
              messageState: trigger.handler?.['message-state'] || 'info'
            };
          }
        }
      }

      // Handle 'csv-match-column' type triggers (for CSV headers)
      if (trigger.type === 'csv-match-column' && trigger.match) {
        for (const matchText of trigger.match) {
          if (cellValue.toLowerCase() === matchText.toLowerCase()) {
            return {
              text: cellValue,
              trigger,
              matchType: 'csv-column',
              messageState: trigger.handler?.['message-state'] || 'info'
            };
          }
        }
      }

      // Handle 'regex' type triggers
      if (trigger.type === 'regex' && trigger.regex) {
        for (const pattern of trigger.regex) {
          const regex = new RegExp(pattern);
          if (regex.test(cellValue)) {
            return {
              text: cellValue,
              trigger,
              matchType: 'regex',
              messageState: trigger.handler?.['message-state'] || 'info'
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Create table cell with optional trigger highlighting
   * @param {string} cellValue - Cell content
   * @param {boolean} isHeader - Whether this is a header cell
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @returns {HTMLElement} - Table cell element
   */
  createCell(cellValue, isHeader, rowIndex, colIndex) {
    const cell = document.createElement(isHeader ? 'th' : 'td');

    // Check for trigger matches
    const match = this.checkCellForTriggers(cellValue);

    if (match) {
      // Create highlighted span
      const span = document.createElement('span');
      span.className = 'tq-csv-match';
      span.textContent = cellValue;
      span.setAttribute('data-message-state', match.messageState);
      span.setAttribute('data-row', rowIndex);
      span.setAttribute('data-col', colIndex);

      // Apply highlighting styles
      if (this.options.styleManager) {
        this.options.styleManager.applyCellMatchStyles(span, match.messageState);
      }

      // Add click handler to show dropdown
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleCellMatchClick(span, match, rowIndex, colIndex);
      });

      cell.appendChild(span);
    } else {
      cell.textContent = cellValue;
    }

    // Apply cell styles
    if (this.options.styleManager) {
      if (isHeader) {
        this.options.styleManager.applyHeaderCellStyles(cell);
      } else {
        this.options.styleManager.applyDataCellStyles(cell);
      }
    }

    return cell;
  }

  /**
   * Handle click on matched cell
   * @param {HTMLElement} cellEl - Cell element
   * @param {Object} match - Match data
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   */
  handleCellMatchClick(cellEl, match, rowIndex, colIndex) {
    if (!this.options.dropdownManager) {
      return;
    }

    // Create match data for dropdown
    const matchData = {
      text: match.text,
      command: {
        id: `csv-cell-${rowIndex}-${colIndex}`,
        matchType: match.matchType,
        messageState: match.messageState,
        category: match.trigger.category,
        intent: {
          category: match.trigger.category,
          handler: match.trigger.handler
        },
        handler: match.trigger.handler
      },
      intent: {
        category: match.trigger.category,
        handler: match.trigger.handler
      },
      // Store cell position for updates
      csvCellPosition: {
        rowIndex,
        colIndex,
        isHeader: rowIndex === 0
      }
    };

    // Show dropdown
    this.options.dropdownManager.showDropdown(cellEl, matchData);

    if (this.options.debug) {
      console.log('[CSVModalManager] Showing dropdown for cell:', match.text, 'at', rowIndex, colIndex);
    }
  }

  /**
   * Update column header with selected option
   * @param {number} colIndex - Column index
   * @param {string} appendText - Text to append (e.g., "/PST")
   */
  updateColumnHeader(colIndex, appendText) {
    if (!this.parsedData || !this.parsedData[0]) {
      return;
    }

    // Update parsed data
    const originalHeader = this.parsedData[0][colIndex];

    // Remove any existing suffix (text after /)
    const baseHeader = originalHeader.split('/')[0];
    this.parsedData[0][colIndex] = baseHeader + appendText;

    // Update the displayed table
    this.refreshTable();

    if (this.options.debug) {
      console.log('[CSVModalManager] Updated column', colIndex, 'from', originalHeader, 'to', this.parsedData[0][colIndex]);
    }
  }

  /**
   * Refresh the table display
   */
  refreshTable() {
    if (!this.modal || !this.parsedData) {
      return;
    }

    // Find table container
    const tableContainer = this.modal.querySelector('.tq-csv-table-container');
    if (!tableContainer) {
      return;
    }

    // Clear and rebuild table
    tableContainer.innerHTML = '';
    const table = this.createTable(this.parsedData);
    tableContainer.appendChild(table);
  }

  /**
   * Create HTML table from parsed CSV data
   * @param {Array} data - 2D array of cells
   * @returns {HTMLElement} - Table element
   */
  createTable(data) {
    const table = document.createElement('table');
    table.className = 'tq-csv-table';

    // Create header row
    if (data.length > 0) {
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');

      data[0].forEach((cellValue, colIndex) => {
        const cell = this.createCell(cellValue, true, 0, colIndex);
        headerRow.appendChild(cell);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);
    }

    // Create data rows
    if (data.length > 1) {
      const tbody = document.createElement('tbody');

      for (let i = 1; i < data.length; i++) {
        const row = document.createElement('tr');

        data[i].forEach((cellValue, colIndex) => {
          const cell = this.createCell(cellValue, false, i, colIndex);
          row.appendChild(cell);
        });

        tbody.appendChild(row);
      }

      table.appendChild(tbody);
    }

    // Apply table styles
    if (this.options.styleManager) {
      this.options.styleManager.applyTableStyles(table);
    }

    return table;
  }

  /**
   * Show CSV modal
   * @param {Object} csvData - { file, text, metadata }
   */
  show(csvData) {
    // Close any existing modal
    this.hide();

    this.currentCSVData = csvData;
    this.parsedData = this.parseCSV(csvData.text);

    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'tq-csv-modal-backdrop';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'tq-csv-modal';

    // Create header
    const header = document.createElement('div');
    header.className = 'tq-csv-modal-header';

    const title = document.createElement('div');
    title.className = 'tq-csv-modal-title';
    title.textContent = csvData.file.name;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tq-csv-modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Create table container (scrollable)
    const tableContainer = document.createElement('div');
    tableContainer.className = 'tq-csv-table-container';

    // Create table
    const table = this.createTable(this.parsedData);
    tableContainer.appendChild(table);

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(tableContainer);

    // Apply styles
    if (this.options.styleManager) {
      this.options.styleManager.applyBackdropStyles(backdrop);
      this.options.styleManager.applyModalStyles(modal);
      this.options.styleManager.applyHeaderStyles(header);
      this.options.styleManager.applyTitleStyles(title);
      this.options.styleManager.applyCloseButtonStyles(closeBtn);
      this.options.styleManager.applyTableContainerStyles(tableContainer);
    }

    // Add to document
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    this.modal = backdrop;

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.hide();
      }
    });

    // Close on Escape key
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    if (this.options.debug) {
      console.log('[CSVModalManager] Modal shown for:', csvData.file.name);
    }
  }

  /**
   * Hide modal
   */
  hide() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      this.currentCSVData = null;
      this.parsedData = null;
    }

    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    if (this.options.debug) {
      console.log('[CSVModalManager] Modal hidden');
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.hide();
    if (this.options.debug) {
      console.log('[CSVModalManager] Destroyed');
    }
  }
}

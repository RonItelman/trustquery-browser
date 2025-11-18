// AttachmentManager - Handles CSV file attachments with drag & drop
// Single responsibility: manage attachment state and file operations

export default class AttachmentManager {
  /**
   * Create attachment manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      container: options.container || null,
      dropZone: options.dropZone || null,
      styleManager: options.styleManager || null,
      commandScanner: options.commandScanner || null, // For scanning CSV columns
      dropdownManager: options.dropdownManager || null, // For showing dropdown on warning click
      onAttachmentAdd: options.onAttachmentAdd || null,
      onAttachmentRemove: options.onAttachmentRemove || null,
      debug: options.debug || false,
      ...options
    };

    this.attachedFiles = new Map(); // Store attached files

    if (this.options.debug) {
      console.log('[AttachmentManager] Initialized');
    }
  }

  /**
   * Initialize drag & drop handlers
   */
  init() {
    if (!this.options.container || !this.options.dropZone) {
      console.warn('[AttachmentManager] Missing container or dropZone');
      return;
    }

    this.setupDragAndDrop();

    if (this.options.debug) {
      console.log('[AttachmentManager] Drag & drop initialized');
    }
  }

  /**
   * Setup drag & drop event handlers
   */
  setupDragAndDrop() {
    const dropZone = this.options.dropZone;

    dropZone.addEventListener('dragover', this.handleDragOver);
    dropZone.addEventListener('dragleave', this.handleDragLeave);
    dropZone.addEventListener('drop', this.handleDrop);
  }

  /**
   * Handle drag over event
   */
  handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.options.dropZone.style.background = '#f0f9ff';
    this.options.dropZone.style.borderColor = '#3b82f6';
  };

  /**
   * Handle drag leave event
   */
  handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.options.dropZone.style.background = '';
    this.options.dropZone.style.borderColor = '';
  };

  /**
   * Handle drop event
   */
  handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.options.dropZone.style.background = '';
    this.options.dropZone.style.borderColor = '';

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await this.addAttachment(file);
    }
  };

  /**
   * Parse CSV and extract metadata
   * @param {string} csvText - CSV file content
   * @returns {Object} - { rows, columns, headers }
   */
  parseCSVMetadata(csvText) {
    const lines = csvText.trim().split('\n');
    const rows = lines.length;

    // Parse first row as headers
    const firstLine = lines[0] || '';
    const headers = firstLine.split(',').map(h => h.trim());
    const columns = headers.length;

    return { rows, columns, headers };
  }

  /**
   * Scan CSV headers for trigger matches
   * @param {Array} headers - CSV column headers
   * @returns {Array} - Array of matches
   */
  scanCSVHeaders(headers) {
    if (!this.options.commandScanner) {
      return [];
    }

    const matches = [];

    // Get CSV-specific triggers from command map
    const commandMap = this.options.commandScanner.commandMap;
    if (!commandMap || !commandMap['tql-triggers']) {
      return [];
    }

    // Check warning triggers for csv-match-column type
    const warnings = commandMap['tql-triggers'].warning || [];
    const csvTriggers = warnings.filter(t => t.type === 'csv-match-column');

    // Check each header against CSV triggers
    headers.forEach((header, index) => {
      csvTriggers.forEach(trigger => {
        if (trigger.match && trigger.match.includes(header)) {
          matches.push({
            header,
            columnIndex: index,
            trigger,
            intent: {
              category: trigger.category,
              handler: trigger.handler
            }
          });
        }
      });
    });

    return matches;
  }

  /**
   * Format file size in KB
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size
   */
  formatFileSize(bytes) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  /**
   * Create attachment wrapper with icon placeholder and card
   * @param {File} file - File object
   * @param {Object} metadata - { rows, columns, headers }
   * @param {Array} matches - CSV header matches
   * @returns {HTMLElement} - Wrapper element
   */
  createAttachmentCard(file, metadata, matches = []) {
    // Create wrapper container
    const wrapper = document.createElement('div');
    wrapper.className = 'tq-attachment-wrapper';

    // Create icon placeholder
    const iconPlaceholder = document.createElement('div');
    iconPlaceholder.className = 'tq-attachment-icon-placeholder';

    // Add warning/error/info icon if matches found
    let icon = null;
    if (matches.length > 0) {
      const match = matches[0];
      const messageState = match.intent?.handler?.['message-state'] || 'warning';

      // Map message state to icon filename
      const iconMap = {
        'error': 'trustquery-error.svg',
        'warning': 'trustquery-warning.svg',
        'info': 'trustquery-info.svg'
      };

      icon = document.createElement('img');
      icon.className = 'tq-attachment-icon';
      icon.src = `./assets/${iconMap[messageState] || iconMap.warning}`;
      icon.title = `CSV column ${messageState} - click to review`;

      // Handle icon click - show dropdown (using mousedown to prevent double-firing)
      icon.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleWarningClick(icon, matches, wrapper);
      });

      iconPlaceholder.appendChild(icon);
    }

    // Create card
    const card = document.createElement('div');
    card.className = 'tq-attachment-card';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'tq-attachment-remove';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => this.removeAttachment(file.name, wrapper);

    // File name header
    const fileNameHeader = document.createElement('div');
    fileNameHeader.className = 'tq-attachment-header';
    fileNameHeader.textContent = file.name;

    // Metadata row
    const metaRow = document.createElement('div');
    metaRow.className = 'tq-attachment-meta';

    const sizeSpan = document.createElement('span');
    sizeSpan.textContent = this.formatFileSize(file.size);

    const rowsSpan = document.createElement('span');
    rowsSpan.textContent = `${metadata.rows} rows`;

    const colsSpan = document.createElement('span');
    colsSpan.textContent = `${metadata.columns} cols`;

    metaRow.appendChild(sizeSpan);
    metaRow.appendChild(rowsSpan);
    metaRow.appendChild(colsSpan);

    card.appendChild(removeBtn);
    card.appendChild(fileNameHeader);
    card.appendChild(metaRow);

    // Apply styles via StyleManager
    if (this.options.styleManager) {
      this.options.styleManager.applyWrapperStyles(wrapper);
      this.options.styleManager.applyIconPlaceholderStyles(iconPlaceholder, matches.length > 0);
      this.options.styleManager.applyIconStyles(icon);
      this.options.styleManager.applyCardStyles(card);
      this.options.styleManager.applyRemoveButtonStyles(removeBtn);
      this.options.styleManager.applyHeaderStyles(fileNameHeader);
      this.options.styleManager.applyMetaStyles(metaRow);
    }

    // Assemble structure
    wrapper.appendChild(iconPlaceholder);
    wrapper.appendChild(card);

    return wrapper;
  }

  /**
   * Handle warning icon click - show dropdown
   * @param {HTMLElement} iconEl - Warning icon element
   * @param {Array} matches - CSV header matches
   * @param {HTMLElement} card - Card element
   */
  handleWarningClick(iconEl, matches, card) {
    if (!this.options.dropdownManager || matches.length === 0) {
      return;
    }

    // Use the first match (could be enhanced to handle multiple)
    const match = matches[0];

    // Create match data similar to text matches
    const matchData = {
      text: match.header,
      command: {
        id: `csv-column-${match.columnIndex}`,
        match: match.header,
        matchType: 'csv-column',
        messageState: match.intent.handler['message-state'] || 'warning',
        category: match.intent.category,
        intent: match.intent,
        handler: match.intent.handler
      },
      intent: match.intent
    };

    // Show dropdown using DropdownManager
    this.options.dropdownManager.showDropdown(iconEl, matchData);

    if (this.options.debug) {
      console.log('[AttachmentManager] Showing dropdown for CSV column:', match.header);
    }
  }

  /**
   * Add attachment to container
   * @param {File} file - File to attach
   */
  async addAttachment(file) {
    if (!file.name.endsWith('.csv')) {
      alert('Only CSV files are supported');
      return;
    }

    // Check if already attached
    if (this.attachedFiles.has(file.name)) {
      console.warn('[AttachmentManager] File already attached:', file.name);
      return;
    }

    // Read file to get metadata
    const text = await file.text();
    const metadata = this.parseCSVMetadata(text);

    // Scan CSV headers for trigger matches
    const matches = this.scanCSVHeaders(metadata.headers || []);

    // Create wrapper with card and icon
    const wrapper = this.createAttachmentCard(file, metadata, matches);

    // Store file reference with matches
    this.attachedFiles.set(file.name, { file, wrapper, metadata, matches });

    // Add to container
    this.options.container.appendChild(wrapper);
    this.options.container.classList.add('has-attachments');

    // Trigger callback
    if (this.options.onAttachmentAdd) {
      this.options.onAttachmentAdd({ file, metadata, matches });
    }

    if (this.options.debug) {
      console.log('[AttachmentManager] Added:', file.name, metadata, 'matches:', matches);
    }
  }

  /**
   * Remove attachment
   * @param {string} fileName - File name to remove
   * @param {HTMLElement} wrapper - Wrapper element
   */
  removeAttachment(fileName, wrapper) {
    wrapper.remove();
    const attachment = this.attachedFiles.get(fileName);
    this.attachedFiles.delete(fileName);

    // Remove has-attachments class if no attachments left
    if (this.attachedFiles.size === 0) {
      this.options.container.classList.remove('has-attachments');
    }

    // Trigger callback
    if (this.options.onAttachmentRemove && attachment) {
      this.options.onAttachmentRemove({ file: attachment.file, metadata: attachment.metadata });
    }

    if (this.options.debug) {
      console.log('[AttachmentManager] Removed:', fileName);
    }
  }

  /**
   * Get all attached files
   * @returns {Array} - Array of { file, metadata }
   */
  getAttachments() {
    return Array.from(this.attachedFiles.values());
  }

  /**
   * Clear all attachments
   */
  clearAll() {
    this.attachedFiles.forEach((attachment, fileName) => {
      this.removeAttachment(fileName, attachment.wrapper);
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.options.dropZone) {
      this.options.dropZone.removeEventListener('dragover', this.handleDragOver);
      this.options.dropZone.removeEventListener('dragleave', this.handleDragLeave);
      this.options.dropZone.removeEventListener('drop', this.handleDrop);
    }

    this.clearAll();

    if (this.options.debug) {
      console.log('[AttachmentManager] Destroyed');
    }
  }
}

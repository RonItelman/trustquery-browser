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
   * @returns {Object} - { rows, columns }
   */
  parseCSVMetadata(csvText) {
    const lines = csvText.trim().split('\n');
    const rows = lines.length;

    // Count columns from first row
    const firstLine = lines[0] || '';
    const columns = firstLine.split(',').length;

    return { rows, columns };
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
   * Create attachment card element
   * @param {File} file - File object
   * @param {Object} metadata - { rows, columns }
   * @returns {HTMLElement} - Card element
   */
  createAttachmentCard(file, metadata) {
    const card = document.createElement('div');
    card.className = 'tq-attachment-card';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'tq-attachment-remove';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = () => this.removeAttachment(file.name, card);

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
      this.options.styleManager.applyCardStyles(card);
      this.options.styleManager.applyRemoveButtonStyles(removeBtn);
      this.options.styleManager.applyHeaderStyles(fileNameHeader);
      this.options.styleManager.applyMetaStyles(metaRow);
    }

    return card;
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

    // Create card
    const card = this.createAttachmentCard(file, metadata);

    // Store file reference
    this.attachedFiles.set(file.name, { file, card, metadata });

    // Add to container
    this.options.container.appendChild(card);
    this.options.container.classList.add('has-attachments');

    // Trigger callback
    if (this.options.onAttachmentAdd) {
      this.options.onAttachmentAdd({ file, metadata });
    }

    if (this.options.debug) {
      console.log('[AttachmentManager] Added:', file.name, metadata);
    }
  }

  /**
   * Remove attachment
   * @param {string} fileName - File name to remove
   * @param {HTMLElement} card - Card element
   */
  removeAttachment(fileName, card) {
    card.remove();
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
      this.removeAttachment(fileName, attachment.card);
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

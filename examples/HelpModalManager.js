// HelpModalManager - Manages help modal with event log, trigger map, and documentation

export default class HelpModalManager {
  constructor(editor) {
    this.editor = editor;
    this.modal = null;
    this.eventLog = [];

    console.log('[HelpModalManager] Initialized');
  }

  /**
   * Create and show the help modal
   */
  show() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      // Update content when reopening
      this.updateTriggerMap();
      this.updateTriggersList();
      return;
    }

    // Create modal structure
    this.createModal();

    // Show the modal
    this.modal.style.display = 'flex';

    // Populate with content
    this.updateTriggerMap();
    this.updateTriggersList();
  }

  /**
   * Hide the modal
   */
  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  /**
   * Create modal DOM structure
   */
  createModal() {
    // Modal overlay
    this.modal = document.createElement('div');
    this.modal.className = 'tq-help-modal';

    // Modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'tq-help-modal-content';

    // Header
    const header = document.createElement('div');
    header.className = 'tq-help-modal-header';

    const title = document.createElement('h2');
    title.className = 'tq-help-modal-title';
    title.textContent = 'TrustQuery Help';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tq-help-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Body container
    const body = document.createElement('div');
    body.className = 'tq-help-modal-body';

    // Create sections
    body.appendChild(this.createEventLogSection());
    body.appendChild(this.createHowItWorksSection());
    body.appendChild(this.createTriggersSection());
    body.appendChild(this.createTriggerMapSection());

    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    this.modal.appendChild(modalContent);

    // Close on ESC key (no outside click since it's fullscreen)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.style.display !== 'none') {
        this.hide();
      }
    });

    document.body.appendChild(this.modal);
  }

  /**
   * Create Event Log section
   */
  createEventLogSection() {
    const section = document.createElement('div');
    section.className = 'tq-help-section';

    const heading = document.createElement('h3');
    heading.className = 'tq-help-section-title';
    heading.textContent = 'Event Log';

    this.eventLogContainer = document.createElement('div');
    this.eventLogContainer.className = 'tq-event-log-container';
    this.eventLogContainer.innerHTML = '<div>Waiting for events...</div>';

    section.appendChild(heading);
    section.appendChild(this.eventLogContainer);
    return section;
  }

  /**
   * Create How It Works section
   */
  createHowItWorksSection() {
    const section = document.createElement('div');
    section.className = 'tq-help-section';

    const heading = document.createElement('h3');
    heading.className = 'tq-help-section-title';
    heading.textContent = 'How It Works';

    const description = document.createElement('p');
    description.className = 'tq-help-description';
    description.innerHTML = 'TrustQuery scans your text for matching patterns from the trigger map loaded from <code>/trustquery/tql-triggers.json</code>.';

    const list = document.createElement('ul');
    list.className = 'tq-help-list';
    list.innerHTML = `
      <li><strong>Hover</strong> over highlighted words to see tooltips with additional information</li>
      <li><strong>Click</strong> on dropdown triggers (like <code>@analytics</code> or <code>@client</code>) to open selection menus</li>
      <li><strong>Keyboard navigation</strong>: Use ↑/↓ arrow keys to navigate dropdowns, Enter to select, ESC to close</li>
      <li><strong>Color coding</strong>: Red = errors (PII), Orange = warnings (ambiguous dates), Green = info (available options)</li>
    `;

    section.appendChild(heading);
    section.appendChild(description);
    section.appendChild(list);
    return section;
  }

  /**
   * Create Triggers section
   */
  createTriggersSection() {
    const section = document.createElement('div');
    section.className = 'tq-help-section';

    const heading = document.createElement('h3');
    heading.className = 'tq-help-section-title';
    heading.textContent = 'Triggers';

    this.triggersListContainer = document.createElement('div');
    this.triggersListContainer.className = 'tq-triggers-list-container';
    this.triggersListContainer.innerHTML = '<div style="color: #718096;">Loading triggers...</div>';

    section.appendChild(heading);
    section.appendChild(this.triggersListContainer);
    return section;
  }

  /**
   * Create Trigger Map section
   */
  createTriggerMapSection() {
    const section = document.createElement('div');
    section.className = 'tq-help-section';

    const heading = document.createElement('h3');
    heading.className = 'tq-help-section-title';
    heading.textContent = 'Trigger Map';

    this.triggerMapContainer = document.createElement('div');
    this.triggerMapContainer.className = 'tq-trigger-map-container';
    this.triggerMapContainer.innerHTML = '<div style="color: #718096;">Loading trigger map...</div>';

    section.appendChild(heading);
    section.appendChild(this.triggerMapContainer);
    return section;
  }

  /**
   * Log an event
   * @param {string} message - Event message
   */
  logEvent(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLog.push({ timestamp, message });

    if (this.eventLogContainer) {
      const line = document.createElement('div');
      line.textContent = `[${timestamp}] ${message}`;
      this.eventLogContainer.appendChild(line);
      this.eventLogContainer.scrollTop = this.eventLogContainer.scrollHeight;
    }
  }

  /**
   * Update trigger map display
   */
  updateTriggerMap() {
    if (!this.triggerMapContainer || !this.editor || !this.editor.commandMap) {
      return;
    }

    const formatted = JSON.stringify(this.editor.commandMap, null, 2);
    this.triggerMapContainer.innerHTML = `<pre>${this.escapeHtml(formatted)}</pre>`;
  }

  /**
   * Update triggers list
   */
  updateTriggersList() {
    if (!this.triggersListContainer) {
      return;
    }

    if (!this.editor || !this.editor.commandMap || !this.editor.commandMap['tql-triggers']) {
      this.triggersListContainer.innerHTML = '<div style="color: #742a2a;">No triggers found</div>';
      return;
    }

    const triggers = this.editor.commandMap['tql-triggers'];
    let html = '';

    // Color coding for states
    const stateColors = {
      'error': '#991b1b',
      'warning': '#92400e',
      'info': '#065f46'
    };

    // Process each state
    ['error', 'warning', 'info'].forEach(state => {
      if (triggers[state] && triggers[state].length > 0) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<h4 style="color: ${stateColors[state]};">${state}</h4>`;
        html += `<ul>`;

        triggers[state].forEach(trigger => {
          const type = trigger.type || 'unknown';
          const category = trigger.category || 'general';
          const message = trigger.handler?.message || trigger.description || 'No message';

          // Format the trigger patterns
          let patterns = '';
          if (type === 'regex' && trigger.regex) {
            patterns = `<code>${this.escapeHtml(trigger.regex.join(', '))}</code>`;
          } else if (type === 'match' && trigger.match) {
            patterns = trigger.match.map(m => `"${this.escapeHtml(m)}"`).join(', ');
          }

          html += `<li>`;
          html += `<strong>${patterns}</strong>: `;
          html += `type: <em>${type}</em> | `;
          html += `category: <em>${category}</em>`;
          html += `<br><span>${this.escapeHtml(message)}</span>`;
          html += `</li>`;
        });

        html += `</ul></div>`;
      }
    });

    this.triggersListContainer.innerHTML = html;
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy the modal
   */
  destroy() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}

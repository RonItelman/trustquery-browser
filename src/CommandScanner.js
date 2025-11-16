// CommandScanner - Scans text for word matches based on command map
// Uses simple string matching (not regex) for simplicity and performance

export default class CommandScanner {
  constructor(options = {}) {
    this.commandMap = null;
    this.commands = [];
    this.debug = options.debug || false;
    console.log('[CommandScanner] Initialized');
  }

  /**
   * Set command map
   * @param {Object} commandMap - Command map object
   */
  setCommandMap(commandMap) {
    this.commandMap = commandMap;
    this.commands = this.parseCommandMap(commandMap);
    console.log('[CommandScanner] Command map set with', this.commands.length, 'commands');
  }

  /**
   * Parse simplified TQL triggers format
   * Format: { "tql-triggers": { "error": [...], "warning": [...], "info": [...] } }
   * @param {Object} triggerMap - Trigger map from tql-triggers.json
   * @returns {Array} Array of command objects
   */
  parseCommandMap(triggerMap) {
    const commands = [];

    // Extract tql-triggers
    const triggers = triggerMap['tql-triggers'] || triggerMap;

    if (!triggers || typeof triggers !== 'object') {
      console.warn('[CommandScanner] Invalid trigger map structure');
      return commands;
    }

    // Iterate through each message state (error, warning, info)
    Object.keys(triggers).forEach(messageState => {
      // Skip metadata fields
      if (messageState.startsWith('$')) {
        return;
      }

      const triggerList = triggers[messageState];

      if (!Array.isArray(triggerList)) {
        return;
      }

      // Process each trigger in this state
      triggerList.forEach((trigger, index) => {
        const handler = trigger.handler || {};
        const description = trigger.description || handler.message || '';
        const category = trigger.category || 'general';

        // Create intent object compatible with handlers
        const intent = {
          description: description,
          handler: {
            ...handler,
            'message-state': messageState // Add message-state for styling
          },
          category: category
        };

        // Handle regex patterns
        if (trigger.type === 'regex' && trigger.regex) {
          trigger.regex.forEach(pattern => {
            commands.push({
              id: `${messageState}-${category}-${index}`,
              match: pattern,
              matchType: 'regex',
              messageState: messageState,
              category: category,
              intent: intent,
              handler: intent.handler,
              caseSensitive: true,
              wholeWord: false
            });
          });
        }

        // Handle string matches
        if (trigger.type === 'match' && trigger.match) {
          trigger.match.forEach(matchStr => {
            commands.push({
              id: `${messageState}-${category}-${index}`,
              match: matchStr,
              matchType: 'string',
              messageState: messageState,
              category: category,
              intent: intent,
              handler: intent.handler,
              caseSensitive: false, // Case insensitive for natural language
              wholeWord: true // Whole word matching
            });
          });
        }
      });
    });

    // Sort by length (longest first) to match longer patterns first
    commands.sort((a, b) => b.match.length - a.match.length);

    return commands;
  }

  /**
   * Scan text for all matches
   * @param {string} text - Text to scan
   * @returns {Array} Array of match objects with position info
   */
  scan(text) {
    if (!this.commands || this.commands.length === 0) {
      return [];
    }

    const matches = [];
    const lines = text.split('\n');

    // Scan each line
    lines.forEach((line, lineIndex) => {
      const lineMatches = this.scanLine(line, lineIndex);
      matches.push(...lineMatches);
    });

    // Only log when matches are found
    if (matches.length > 0) {
      console.log(`[CommandScanner] Found ${matches.length} matches`);
    }

    return matches;
  }

  /**
   * Scan a single line for matches
   * @param {string} line - Line text
   * @param {number} lineIndex - Line number (0-indexed)
   * @returns {Array} Matches on this line
   */
  scanLine(line, lineIndex) {
    const matches = [];
    const matchedRanges = []; // Track matched positions to avoid overlaps

    for (const command of this.commands) {
      const commandMatches = this.findMatches(line, command, lineIndex);

      // Filter out overlapping matches
      for (const match of commandMatches) {
        if (!this.overlapsExisting(match, matchedRanges)) {
          matches.push(match);
          matchedRanges.push({ start: match.col, end: match.col + match.length });
        }
      }
    }

    // Sort matches by column position
    matches.sort((a, b) => a.col - b.col);

    return matches;
  }

  /**
   * Find all matches of a command in a line
   * @param {string} line - Line text
   * @param {Object} command - Command to search for
   * @param {number} lineIndex - Line number
   * @returns {Array} Matches
   */
  findMatches(line, command, lineIndex) {
    const matches = [];

    // Handle regex patterns
    if (command.matchType === 'regex') {
      try {
        const regex = new RegExp(command.match, 'g');
        let match;

        while ((match = regex.exec(line)) !== null) {
          if (this.debug) {
            console.log('[CommandScanner] Regex match debug:', {
              pattern: command.match,
              line: line,
              'match[0]': match[0],
              'match[0].length': match[0].length,
              index: match.index
            });
          }

          matches.push({
            text: match[0],
            line: lineIndex,
            col: match.index,
            length: match[0].length,
            command: command
          });
        }
      } catch (e) {
        console.warn('[CommandScanner] Invalid regex pattern:', command.match, e);
      }

      return matches;
    }

    // Handle string patterns (original logic)
    const searchText = command.caseSensitive ? line : line.toLowerCase();
    const pattern = command.caseSensitive ? command.match : command.match.toLowerCase();

    let startIndex = 0;

    while (true) {
      const index = searchText.indexOf(pattern, startIndex);

      if (index === -1) {
        break; // No more matches
      }

      // Check if this is a whole word match (if required)
      if (command.wholeWord && !this.isWholeWordMatch(line, index, pattern.length)) {
        startIndex = index + 1;
        continue;
      }

      // Create match object
      matches.push({
        text: line.substring(index, index + pattern.length),
        line: lineIndex,
        col: index,
        length: pattern.length,
        command: command
      });

      startIndex = index + pattern.length;
    }

    return matches;
  }

  /**
   * Check if match is a whole word (not part of a larger word)
   * @param {string} text - Text to check
   * @param {number} start - Start index of match
   * @param {number} length - Length of match
   * @returns {boolean} True if whole word
   */
  isWholeWordMatch(text, start, length) {
    const end = start + length;

    // Check character before
    if (start > 0) {
      const before = text[start - 1];
      if (this.isWordChar(before)) {
        return false;
      }
    }

    // Check character after - treat "/" as a word boundary (resolved trigger)
    if (end < text.length) {
      const after = text[end];
      if (this.isWordChar(after) || after === '/') {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if character is a word character (alphanumeric or underscore)
   * @param {string} char - Character to check
   * @returns {boolean} True if word character
   */
  isWordChar(char) {
    return /[a-zA-Z0-9_]/.test(char);
  }

  /**
   * Check if a match overlaps with existing matches
   * @param {Object} match - New match to check
   * @param {Array} existingRanges - Array of {start, end} ranges
   * @returns {boolean} True if overlaps
   */
  overlapsExisting(match, existingRanges) {
    const matchStart = match.col;
    const matchEnd = match.col + match.length;

    for (const range of existingRanges) {
      // Check for overlap
      if (matchStart < range.end && matchEnd > range.start) {
        return true;
      }
    }

    return false;
  }
}

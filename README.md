# TrustQuery Browser

Turn any textarea into an interactive trigger-based editor with bubbles, dropdowns, and real-time validation. Zero dependencies.

**Features:**
- 🚫 Block PII (emails, phone numbers) before submission
- ⚠️ Warn on ambiguous inputs (dates, temporal references)
- 🔗 Quick-link to entities (clients, analytics, teams)
- ⌨️ Full keyboard navigation
- 🎨 Inline styling (no external CSS required)
- 📦 Zero dependencies

## Installation

```bash
npm install @trustquery/browser
```

## Quick Start

```javascript
import TrustQuery from '@trustquery/browser';

TrustQuery.init('my-textarea', {
  triggerMap: {
    source: 'url',
    url: '/tql-triggers.json'
  },
  features: {
    autoGrow: true,
    maxHeight: 300
  },
  events: {
    onWordClick: (matchData) => {
      console.log('Clicked:', matchData);
    }
  }
});
```

## Configuration

### Trigger Map (Required)

```javascript
triggerMap: {
  source: 'url',           // 'url', 'inline', or 'api'
  url: '/tql-triggers.json' // Path to trigger configuration
}
```

### Features (Optional)

```javascript
features: {
  autoGrow: true,    // Auto-expand textarea
  maxHeight: 300,    // Max height in pixels
  debug: false       // Enable debug logging
}
```

### UI Settings (Optional)

```javascript
ui: {
  bubbleDelay: 300,      // Hover delay in ms
  dropdownOffset: 28     // Dropdown spacing in px
}
```

### Events (Optional)

```javascript
events: {
  onWordHover: (matchData) => { /* ... */ },
  onWordClick: (matchData) => { /* ... */ },
  onValidationChange: (validationState) => {
    // Fires when validation state changes
    // validationState: {
    //   hasBlockingError: boolean,
    //   errors: Array,    // matches with message-state: 'error'
    //   warnings: Array,  // matches with message-state: 'warning'
    //   info: Array       // matches with message-state: 'info'
    // }

    // Example: Disable submit button on blocking errors
    submitButton.disabled = validationState.hasBlockingError;
  }
}
```

## Trigger Map Format

Create a `tql-triggers.json` file:

```json
{
  "tql-triggers": {
    "error": [
      {
        "type": "regex",
        "regex": ["\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"],
        "handler": {
          "block-submit": true,
          "message-state": "error",
          "message": "Email addresses are not allowed"
        }
      }
    ],
    "warning": [
      {
        "type": "match",
        "match": ["yesterday", "last week"],
        "handler": {
          "message-state": "warning",
          "message": "Dates can be ambiguous"
        }
      }
    ],
    "info": [
      {
        "type": "match",
        "match": ["@client"],
        "handler": {
          "message-state": "info",
          "filter": true,
          "message": "Select a client:",
          "options": [
            {
              "label": "Blackrock",
              "on-select": { "display": "Blackrock" }
            }
          ]
        }
      }
    ]
  }
}
```

## CDN Usage

```html
<script type="module">
  import TrustQuery from 'https://unpkg.com/@trustquery/browser';
  TrustQuery.init('my-textarea', {
    triggerMap: { source: 'url', url: '/tql-triggers.json' }
  });
</script>
```

## Examples

- **Basic:** See `examples/basic.html` for minimal setup
- **Advanced:** See `examples/advanced.html` for full-featured chat UI demo
- **Triggers:** See `examples/tql-triggers.json` for configuration examples

## Browser Support

Modern browsers with ES modules support (Chrome, Firefox, Safari, Edge).

## License

MIT

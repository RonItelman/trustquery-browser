# TrustQuery Browser

Turn any textarea into an interactive trigger-based editor with bubbles, dropdowns, and keyboard navigation.

## Installation

```bash
npm install @trustquery/browser
```

## Quick Start

```javascript
import TrustQuery from '@trustquery/browser';

TrustQuery.init('my-textarea', {
  commandMapUrl: '/triggers.json'
});
```

## CDN Usage

```html
<script type="module">
  import TrustQuery from 'https://unpkg.com/@trustquery/browser';
  TrustQuery.init('my-textarea', { ... });
</script>
```

## Examples

See `examples/basic.html` for a minimal example and `examples/advanced.html` for a full-featured demo.

## Trigger Format

See `examples/tql-triggers.json` for trigger schema examples.

## License

MIT

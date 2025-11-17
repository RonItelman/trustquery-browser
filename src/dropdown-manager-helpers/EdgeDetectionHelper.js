// EdgeDetectionHelper - Calculates dropdown positioning to prevent overflow off viewport edges

export default class EdgeDetectionHelper {
  /**
   * Calculate optimal position for dropdown to prevent viewport overflow
   * @param {Object} options - Positioning options
   * @param {DOMRect} options.matchRect - Bounding rect of the match element
   * @param {DOMRect} options.dropdownRect - Bounding rect of the dropdown
   * @param {number} options.offset - Offset from match element (default: 28)
   * @param {number} options.padding - Padding from viewport edges (default: 10)
   * @returns {Object} - { top, left } position in pixels
   */
  static calculatePosition({ matchRect, dropdownRect, offset = 28, padding = 10 }) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    console.log('[EdgeDetectionHelper] Calculation inputs:');
    console.log('  Match rect:', { left: matchRect.left, top: matchRect.top, width: matchRect.width });
    console.log('  Dropdown rect:', { width: dropdownRect.width, height: dropdownRect.height });
    console.log('  Viewport:', { width: viewportWidth, height: viewportHeight });
    console.log('  Scroll:', { x: window.scrollX, y: window.scrollY });

    // Calculate initial position (above match by default, since input is at bottom)
    let top = matchRect.top + window.scrollY - dropdownRect.height - offset;
    let left = matchRect.left + window.scrollX;

    console.log('  Initial position:', { left, top });

    // Vertical positioning: Check if dropdown goes off top edge
    if (top < window.scrollY) {
      // Position below match instead
      top = matchRect.bottom + window.scrollY + offset;
      console.log('  Adjusted for top overflow, new top:', top);
    }

    // Horizontal positioning: Check if dropdown goes off right edge
    const rightEdge = left + dropdownRect.width;
    const viewportRightEdge = viewportWidth + window.scrollX;

    console.log('  Right edge check:', { rightEdge, viewportRightEdge: viewportRightEdge - padding });

    if (rightEdge > viewportRightEdge - padding) {
      // Calculate how much we overflow past the right edge
      const overflow = rightEdge - (viewportRightEdge - padding);
      console.log('  Right overflow detected:', overflow, 'px');

      // Shift left by the overflow amount
      left = left - overflow;
      console.log('  Adjusted left position:', left);

      // Ensure we don't go off the left edge either
      const minLeft = window.scrollX + padding;
      if (left < minLeft) {
        console.log('  Hit left edge, clamping to:', minLeft);
        left = minLeft;
      }
    }

    // Also check left edge (in case match is near left edge)
    const minLeft = window.scrollX + padding;
    if (left < minLeft) {
      console.log('  Left edge adjustment:', minLeft);
      left = minLeft;
    }

    console.log('[EdgeDetectionHelper] Final position:', { left, top });

    return { top, left };
  }

  /**
   * Check if dropdown would overflow the right edge
   * @param {DOMRect} matchRect - Match element rect
   * @param {DOMRect} dropdownRect - Dropdown rect
   * @param {number} padding - Padding from edge
   * @returns {boolean} - True if would overflow
   */
  static wouldOverflowRight(matchRect, dropdownRect, padding = 10) {
    const left = matchRect.left + window.scrollX;
    const rightEdge = left + dropdownRect.width;
    const viewportRightEdge = window.innerWidth + window.scrollX;

    return rightEdge > viewportRightEdge - padding;
  }

  /**
   * Check if dropdown would overflow the top edge
   * @param {DOMRect} matchRect - Match element rect
   * @param {DOMRect} dropdownRect - Dropdown rect
   * @param {number} offset - Offset from match
   * @returns {boolean} - True if would overflow
   */
  static wouldOverflowTop(matchRect, dropdownRect, offset = 28) {
    const top = matchRect.top + window.scrollY - dropdownRect.height - offset;
    return top < window.scrollY;
  }

  /**
   * Calculate overflow amount on the right edge
   * @param {DOMRect} matchRect - Match element rect
   * @param {DOMRect} dropdownRect - Dropdown rect
   * @param {number} padding - Padding from edge
   * @returns {number} - Overflow amount in pixels (0 if no overflow)
   */
  static calculateRightOverflow(matchRect, dropdownRect, padding = 10) {
    const left = matchRect.left + window.scrollX;
    const rightEdge = left + dropdownRect.width;
    const viewportRightEdge = window.innerWidth + window.scrollX;

    const overflow = rightEdge - (viewportRightEdge - padding);
    return Math.max(0, overflow);
  }
}

export function makeResizable(separator, firstElement, secondElement, getDirection = () => 'horizontal') {
  let isResizing = false;
  let startX, startY, startFlexBasis;

  const onMouseDown = (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Get the current flex-basis or width/height
    const rect = firstElement.getBoundingClientRect();
    const currentDirection = typeof getDirection === 'function' ? getDirection() : getDirection;
    startFlexBasis = currentDirection === 'horizontal' ? rect.width : rect.height;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Prevent text selection
    document.body.style.userSelect = 'none';
    document.body.style.cursor = currentDirection === 'horizontal' ? 'col-resize' : 'row-resize';
  };

  const onMouseMove = (e) => {
    if (!isResizing) return;
    
    const currentDirection = typeof getDirection === 'function' ? getDirection() : getDirection;

    if (currentDirection === 'horizontal') {
      const dx = e.clientX - startX;
      // Calculate new basis in pixels
      const newBasis = Math.max(100, Math.min(startFlexBasis + dx, window.innerWidth - 100)); // Minimum 100px
      firstElement.style.flex = `0 0 ${newBasis}px`;
    } else {
      const dy = e.clientY - startY;
      const newBasis = Math.max(100, Math.min(startFlexBasis + dy, window.innerHeight - 100));
      firstElement.style.flex = `0 0 ${newBasis}px`;
    }
  };

  const onMouseUp = () => {
    if (isResizing) {
      isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  };

  separator.addEventListener('mousedown', onMouseDown);

  return () => {
    separator.removeEventListener('mousedown', onMouseDown);
  };
}

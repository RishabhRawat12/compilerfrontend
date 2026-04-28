export function makeResizable(separator, firstElement, secondElement, getDirection = () => 'horizontal') {
  let isResizing = false;
  let startPos = 0;
  let startSize = 0;

  const onMouseDown = (e) => {
    isResizing = true;

    const direction = typeof getDirection === 'function' ? getDirection() : getDirection;

    startPos = direction === 'horizontal' ? e.clientX : e.clientY;

    const rect = firstElement.getBoundingClientRect();
    startSize = direction === 'horizontal' ? rect.width : rect.height;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
  };

  const onMouseMove = (e) => {
    if (!isResizing) return;

    const direction = typeof getDirection === 'function' ? getDirection() : getDirection;

    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - startPos;

    const parent = firstElement.parentElement;
    const parentRect = parent.getBoundingClientRect();

    const totalSize = direction === 'horizontal'
      ? parentRect.width
      : parentRect.height;

    const minSize = 150; // better minimum
    const maxSize = totalSize - 150;

    let newSize = startSize + delta;
    newSize = Math.max(minSize, Math.min(newSize, maxSize));

    firstElement.style.flex = `0 0 ${newSize}px`;
    secondElement.style.flex = `1 1 auto`;
  };

  const onMouseUp = () => {
    if (!isResizing) return;

    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  separator.addEventListener('mousedown', onMouseDown);

  return () => {
    separator.removeEventListener('mousedown', onMouseDown);
  };
}
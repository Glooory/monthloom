export function clientDeltaToSceneDelta(args: {
  clientDeltaX: number;
  clientDeltaY: number;
  renderedWidth: number;
  renderedHeight: number;
  sceneWidth: number;
  sceneHeight: number;
}): Readonly<{ x: number; y: number }> {
  const {
    clientDeltaX,
    clientDeltaY,
    renderedWidth,
    renderedHeight,
    sceneWidth,
    sceneHeight,
  } = args;

  if (renderedWidth <= 0 || renderedHeight <= 0) {
    return { x: 0, y: 0 };
  }

  const scaleX = sceneWidth / renderedWidth;
  const scaleY = sceneHeight / renderedHeight;

  return {
    x: clientDeltaX * scaleX,
    y: clientDeltaY * scaleY,
  };
}

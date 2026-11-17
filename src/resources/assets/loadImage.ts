export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0
      ? resolve(image) : reject(new Error("Image has invalid dimensions"));
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

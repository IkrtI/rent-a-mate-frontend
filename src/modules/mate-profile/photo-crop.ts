export function drawSquareCrop(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  zoom: number,
  horizontal: number,
  vertical: number,
) {
  const size = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
  const sourceX = ((image.naturalWidth - size) * horizontal) / 100;
  const sourceY = ((image.naturalHeight - size) * vertical) / 100;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo editing is unavailable in this browser.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, sourceX, sourceY, size, size, 0, 0, canvas.width, canvas.height);
}

export function cropBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("We couldn’t prepare this photo. Choose another image."));
      },
      "image/jpeg",
      0.9,
    );
  });
}

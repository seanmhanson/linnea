async function stripImageMetadata(file: File): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Failed to load image for metadata stripping"));
      element.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is not available");
    }

    context.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to re-encode image"));
            return;
          }

          resolve(blob);
        },
        file.type || "image/jpeg",
        1
      );
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export { stripImageMetadata };

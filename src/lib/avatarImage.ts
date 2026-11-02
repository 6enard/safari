const AVATAR_SIZE_PX = 256;
const AVATAR_JPEG_QUALITY = 0.85;

export function imageFileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE_PX;
      canvas.height = AVATAR_SIZE_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process this image.'));
        return;
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);
      resolve(canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('That file could not be opened. Please choose a photo.'));
    };
    img.src = objectUrl;
  });
}

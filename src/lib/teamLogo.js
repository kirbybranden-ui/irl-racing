const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_SAVED_LOGO_BYTES = 256 * 1024;

function openImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be opened. Export it as PNG, JPEG or WebP and try again."));
    image.src = url;
  });
}
const encode = (canvas, type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));
const asDataUrl = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("The prepared logo could not be read. Try choosing the file again."));
  reader.readAsDataURL(blob);
});

export async function prepareTeamLogo(file) {
  const supported = ["image/png", "image/jpeg", "image/webp"];
  if (!(supported.includes(file.type) || (!file.type && /\.(png|jpe?g|webp)$/i.test(file.name)))) {
    throw new Error("Choose a PNG, JPEG or WebP image. Export HEIC or other formats as PNG or JPEG first.");
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Choose a logo smaller than 20 MB. Larger logos can be exported at a smaller size first.");
  const url = URL.createObjectURL(file);
  try {
    const image = await openImage(url);
    const width = image.naturalWidth, height = image.naturalHeight;
    if (!width || !height) throw new Error("Choose an image with valid dimensions.");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the logo. Try another browser or a smaller PNG.");
    let scale = Math.min(1, 1024 / Math.max(width, height));
    for (let attempt = 0; attempt < 12; attempt += 1) {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      // PNG preserves transparency and sharp edges; WebP is tried for larger artwork.
      const png = await encode(canvas, "image/png");
      if (png?.size > 0 && png.size <= MAX_SAVED_LOGO_BYTES) return await asDataUrl(png);
      for (const quality of [0.92, 0.82, 0.72]) {
        const webp = await encode(canvas, "image/webp", quality);
        // Browsers without WebP encoding may return PNG instead.
        if (webp?.size > 0 && ["image/png", "image/webp"].includes(webp.type) && webp.size <= MAX_SAVED_LOGO_BYTES) return await asDataUrl(webp);
      }
      scale *= 0.75;
    }
    throw new Error("This logo could not be reduced enough. Try exporting a smaller PNG or JPEG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

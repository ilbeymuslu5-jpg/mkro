/** Longest edge of the stored avatar. Displayed at most at 112px, so 256 covers retina. */
const OUTPUT_SIZE = 256

/** Guards against a multi-megabyte data URL being pushed into state and storage. */
const MAX_INPUT_BYTES = 12 * 1024 * 1024

export class ImageError extends Error {}

/**
 * Reads a picked file, centre-crops it to a square and scales it down to a
 * JPEG data URL. Doing this in the browser keeps the stored avatar a few tens
 * of kilobytes instead of the original camera file.
 */
export async function fileToSquareDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('Bu bir görsel dosyası değil. PNG, JPG veya WebP seç.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('Görsel 12 MB’tan büyük. Daha küçük bir dosya seç.')
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    if (side === 0) throw new ImageError('Görsel okunamadı.')

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE

    const context = canvas.getContext('2d')
    if (!context) throw new ImageError('Tarayıcı görseli işleyemedi.')

    context.imageSmoothingQuality = 'high'
    context.drawImage(
      image,
      (image.naturalWidth - side) / 2,
      (image.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new ImageError('Görsel açılamadı. Dosya bozuk olabilir.'))
    image.src = src
  })
}

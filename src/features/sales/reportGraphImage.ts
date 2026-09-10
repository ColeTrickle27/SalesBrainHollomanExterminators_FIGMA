/** Report copies are bounded JPEGs; the saved graph and editor export stay unchanged. */
export function reportGraphDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error("The graph image has invalid dimensions.")
  const scale = Math.min(1, 2000 / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

export async function reportGraphJpeg(png: Blob): Promise<Blob> {
  if (png.type !== "image/png") throw new Error("The graph image could not be read. Please try again.")
  return reportImageJpeg(png)
}

export async function reportImageJpeg(image: Blob): Promise<Blob> {
  const signature = new Uint8Array(await image.slice(0, 12).arrayBuffer())
  const isPng = image.type === "image/png" && signature.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => signature[index] === byte)
  const isJpeg = image.type === "image/jpeg" && signature[0] === 255 && signature[1] === 216 && signature[2] === 255
  const isWebp = image.type === "image/webp" && [82, 73, 70, 70].every((byte, index) => signature[index] === byte) && [87, 69, 66, 80].every((byte, index) => signature[index + 8] === byte)
  if (!isPng && !isJpeg && !isWebp) throw new Error("The report image could not be read. Your original photo is unchanged.")
  const bitmap = await createImageBitmap(image)
  try {
    const size = reportGraphDimensions(bitmap.width, bitmap.height)
    const canvas = document.createElement("canvas")
    canvas.width = size.width; canvas.height = size.height
    const context = canvas.getContext("2d", { alpha: false })
    if (!context) throw new Error("The graph image could not be prepared on this device. Please try again.")
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, size.width, size.height)
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => {
      if (!blob || blob.type !== "image/jpeg") { reject(new Error("The graph image could not be prepared for the report. Please try again.")); return }
      resolve(blob)
    }, "image/jpeg", 0.92))
  } finally { bitmap.close() }
}

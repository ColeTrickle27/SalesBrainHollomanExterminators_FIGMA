import type { SalesInspection } from "../../types/sales-inspection"
import type { PhotoReference } from "../../types/property"
import type { SalesBrainWorkflowData } from "../../types/figma-workflow"

export async function prepareReportPhotoImages(inspection: SalesInspection, tools: {
  load: (photo: PhotoReference) => Promise<Blob>
  convert: (blob: Blob) => Promise<Blob>
  upload: (file: File) => Promise<PhotoReference>
  assertCurrent: () => void
}): Promise<NonNullable<SalesBrainWorkflowData["reportPhotoImages"]>> {
  const images: NonNullable<SalesBrainWorkflowData["reportPhotoImages"]> = []
  for (const photo of inspection.photos) {
    if ((photo.source && photo.source !== "sales-brain") || photo.sourceGraphKey || !photo.storageKey?.startsWith(`sales-brain/photos/${inspection.id}/`) || photo.customerVisible === false) continue
    tools.assertCurrent()
    const existing = inspection.workflowData?.reportPhotoImages?.find((item) => item.photoId === photo.id && item.sourceStorageKey === photo.storageKey && item.storageKey.startsWith(`sales-brain/photos/${inspection.id}/`))
    if (existing) { images.push(existing); continue }
    // Decode one photo at a time to keep mobile memory bounded.
    const original = await tools.load(photo)
    tools.assertCurrent()
    const image = await tools.convert(original)
    tools.assertCurrent()
    const uploaded = await tools.upload(new File([image], "Inspection report photo.jpg", { type: "image/jpeg" }))
    tools.assertCurrent()
    if (!uploaded.storageKey?.startsWith(`sales-brain/photos/${inspection.id}/`)) throw new Error("A report photo could not be saved. Your original photos are unchanged.")
    images.push({ photoId: photo.id, sourceStorageKey: photo.storageKey, storageKey: uploaded.storageKey })
  }
  return images
}


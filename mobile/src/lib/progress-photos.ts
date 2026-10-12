// Progress photos: kept in the app's own folder on this phone, never uploaded or synced to an
// account. Skin changes slowly and is easy to miss day to day; seeing it side by side every few
// weeks is the self-monitoring that keeps people going (Michie et al. 2009).

import * as ImagePicker from "expo-image-picker"
import { Directory, File, Paths } from "expo-file-system"
import { daysBetween, todayKey } from "@skinlens/shared"

export type ProgressPhoto = { date: string; uri: string; name: string }

/** Weeks between photos: a starting photo, then one every 4 weeks (4, 8, 12, …). */
export const PHOTO_EVERY_WEEKS = 4

function folder(): Directory {
  const dir = new Directory(Paths.document, "progress")
  if (!dir.exists) dir.create({ intermediates: true })
  return dir
}

/** Oldest first. File names start with the day they were taken (YYYY-MM-DD). */
export function listPhotos(): ProgressPhoto[] {
  try {
    return folder()
      .list()
      .filter((f): f is File => f instanceof File && /^\d{4}-\d{2}-\d{2}/.test(f.name))
      .map((f) => ({ date: f.name.slice(0, 10), uri: f.uri, name: f.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

/** Take a photo with the camera or pick one from the library; saved under today's date. */
export async function addPhoto(source: "camera" | "library"): Promise<ProgressPhoto | null> {
  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return null
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: "images", quality: 0.8, allowsEditing: true, aspect: [3, 4] }
  const res = source === "camera" ? await ImagePicker.launchCameraAsync({ ...opts, cameraType: ImagePicker.CameraType.front }) : await ImagePicker.launchImageLibraryAsync(opts)
  if (res.canceled || !res.assets?.length) return null
  const date = todayKey()
  const name = `${date}-${Date.now()}.jpg`
  const dest = new File(folder(), name)
  new File(res.assets[0].uri).copy(dest)
  return { date, uri: dest.uri, name }
}

export function deletePhoto(photo: ProgressPhoto) {
  try {
    new File(folder(), photo.name).delete()
  } catch {
    /* already gone */
  }
}

/**
 * Whether to offer a photo now: a starting photo when there's none, then at each 4-week mark
 * since the first one that has no photo yet. Returns the weeks reached, 0 for the starting photo.
 */
export function photoDue(photos: ProgressPhoto[], today: string = todayKey()): number | null {
  if (photos.length === 0) return 0
  const first = photos[0].date
  const last = photos[photos.length - 1].date
  const weeks = Math.floor(daysBetween(first, today) / 7)
  const mark = Math.floor(weeks / PHOTO_EVERY_WEEKS) * PHOTO_EVERY_WEEKS
  if (mark < PHOTO_EVERY_WEEKS) return null
  return daysBetween(first, last) < mark * 7 ? mark : null
}

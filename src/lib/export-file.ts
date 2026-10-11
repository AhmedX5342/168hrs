import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Saves JSON to the user's device.
 * - Web: normal blob download.
 * - Capacitor (Android/iOS): WebViews ignore blob/anchor downloads, so write a real
 *   file to the app cache and open the native share sheet ("Save to Files", Drive, etc.).
 * Throws on failure; a dismissed share sheet throws an error whose message contains "cancel".
 */
export async function saveJsonFile(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);

  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, url: uri, dialogTitle: "Save backup" });
    return;
  }

  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function writeClipboardText(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | undefined = globalThis.navigator?.clipboard
) {
  if (!clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable");
  }

  await clipboard.writeText(text);
}

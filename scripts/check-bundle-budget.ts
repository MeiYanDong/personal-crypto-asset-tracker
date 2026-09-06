import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const assetsDirectory = join(process.cwd(), "dist", "assets");
const budget = {
  maximumChunkBytes: 500_000,
  maximumChunkCount: 6,
  maximumTotalBytes: 560_000,
  maximumTotalGzipBytes: 175_000
};

function formatKilobytes(bytes: number) {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

const javascriptFiles = (await readdir(assetsDirectory))
  .filter((file) => file.endsWith(".js"))
  .sort();

if (javascriptFiles.length === 0) {
  throw new Error(`No JavaScript bundles found in ${assetsDirectory}`);
}

const chunks = await Promise.all(javascriptFiles.map(async (file) => {
  const path = join(assetsDirectory, file);
  const [contents, metadata] = await Promise.all([readFile(path), stat(path)]);

  return {
    bytes: metadata.size,
    file,
    gzipBytes: gzipSync(contents).byteLength
  };
}));

const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.bytes, 0);
const totalGzipBytes = chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
const largestChunk = chunks.reduce((largest, chunk) => (
  chunk.bytes > largest.bytes ? chunk : largest
));
const violations = [
  largestChunk.bytes > budget.maximumChunkBytes
    ? `largest chunk ${largestChunk.file} is ${formatKilobytes(largestChunk.bytes)}; budget is ${formatKilobytes(budget.maximumChunkBytes)}`
    : null,
  chunks.length > budget.maximumChunkCount
    ? `${chunks.length} JavaScript chunks; budget is ${budget.maximumChunkCount}`
    : null,
  totalBytes > budget.maximumTotalBytes
    ? `total JavaScript is ${formatKilobytes(totalBytes)}; budget is ${formatKilobytes(budget.maximumTotalBytes)}`
    : null,
  totalGzipBytes > budget.maximumTotalGzipBytes
    ? `total gzip JavaScript is ${formatKilobytes(totalGzipBytes)}; budget is ${formatKilobytes(budget.maximumTotalGzipBytes)}`
    : null
].filter(Boolean);

console.log(
  `bundle budget: ${chunks.length} chunks, ${formatKilobytes(totalBytes)} total, ` +
  `${formatKilobytes(totalGzipBytes)} gzip, largest ${largestChunk.file} at ${formatKilobytes(largestChunk.bytes)}`
);

if (violations.length > 0) {
  throw new Error(`Bundle budget exceeded:\n- ${violations.join("\n- ")}`);
}

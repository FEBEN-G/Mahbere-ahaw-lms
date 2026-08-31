import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public", "logo.png");

async function buildCircularIcon(size) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );

  return sharp(logoPath)
    .resize(size, size, { fit: "cover", position: "centre" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function main() {
  const outputs = [
    { size: 32, path: join(root, "src", "app", "icon.png") },
    { size: 180, path: join(root, "src", "app", "apple-icon.png") },
    { size: 180, path: join(root, "public", "apple-touch-icon.png") },
    { size: 192, path: join(root, "public", "icon-192.png") },
    { size: 512, path: join(root, "public", "icon-512.png") },
  ];

  for (const { size, path } of outputs) {
    const buffer = await buildCircularIcon(size);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, buffer);
    console.log(`[generate-brand-icons] wrote ${path} (${size}px)`);
  }

  const favicon32 = await buildCircularIcon(32);
  const faviconIco = await pngToIco(favicon32);
  const faviconPath = join(root, "src", "app", "favicon.ico");
  writeFileSync(faviconPath, faviconIco);
  console.log(`[generate-brand-icons] wrote ${faviconPath}`);
}

main().catch((error) => {
  console.error("[generate-brand-icons] failed:", error);
  process.exit(1);
});

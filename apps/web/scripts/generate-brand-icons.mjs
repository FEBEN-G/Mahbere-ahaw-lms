import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public", "logo.png");

async function buildCircularIcon(size) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );

  return sharp(logoPath)
    .resize(size, size, { fit: "cover", position: "centre" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

async function writePng(size, path) {
  const buffer = await buildCircularIcon(size);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buffer);
  console.log(`[generate-brand-icons] wrote ${path} (${size}px, ${buffer.length} bytes)`);
  return path;
}

async function main() {
  await writePng(32, join(root, "src", "app", "icon.png"));
  await writePng(180, join(root, "src", "app", "apple-icon.png"));
  await writePng(180, join(root, "public", "apple-touch-icon.png"));
  await writePng(192, join(root, "public", "icon-192.png"));
  await writePng(512, join(root, "public", "icon-512.png"));
  await writePng(48, join(root, "public", "favicon.png"));

  const favicon16 = join(root, "public", ".favicon-16.png");
  const favicon32 = join(root, "public", ".favicon-32.png");
  await writePng(16, favicon16);
  await writePng(32, favicon32);

  const faviconIco = await pngToIco([favicon16, favicon32]);
  const appFavicon = join(root, "src", "app", "favicon.ico");
  const publicFavicon = join(root, "public", "favicon.ico");
  writeFileSync(appFavicon, faviconIco);
  writeFileSync(publicFavicon, faviconIco);
  console.log(
    `[generate-brand-icons] wrote favicon.ico (${faviconIco.length} bytes)`,
  );
}

main().catch((error) => {
  console.error("[generate-brand-icons] failed:", error);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPng(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Raw image data: height scanlines, each with 1 filter byte + width * 4 bytes RGBA
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressedData);

  // IEND chunk
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);

  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, "ascii");
  data.copy(buffer, 8);

  const crcTarget = Buffer.alloc(4 + length);
  buffer.copy(crcTarget, 0, 4, 8 + length);
  const crc = crc32(crcTarget);
  buffer.writeUInt32BE(crc, 8 + length);

  return buffer;
}

// Simple CRC32 implementation for PNG chunks
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }

  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const assetsDir = path.resolve(__dirname, "../apps/mobile/assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Orange/Emerald Serrucho colors (#059669 = 5, 150, 105; #ea580c = 234, 88, 12)
const iconPng = createPng(512, 512, 234, 88, 12);
const splashPng = createPng(1024, 1024, 249, 115, 22);
const faviconPng = createPng(48, 48, 234, 88, 12);
const miniPng = createPng(48, 48, 100, 100, 100, 255);

fs.writeFileSync(path.join(assetsDir, "icon.png"), iconPng);
fs.writeFileSync(path.join(assetsDir, "adaptive-icon.png"), iconPng);
fs.writeFileSync(path.join(assetsDir, "splash-icon.png"), splashPng);
fs.writeFileSync(path.join(assetsDir, "favicon.png"), faviconPng);

// Missing expo-router internal assets
const expoRouterAssets = [
  "logotype.png",
  "file.png",
  "pkg.png",
  "forward.png",
  "sitemap.png",
  "arrow_down.png",
  "unmatched.png",
  "error.png",
  "react-navigation/drawer/toggle-drawer-icon.png",
  "react-navigation/elements/back-icon-mask.png",
  "react-navigation/elements/back-icon.png",
  "react-navigation/elements/clear-icon.png",
  "react-navigation/elements/close-icon.png",
  "react-navigation/elements/search-icon.png",
];

const xmlAssets = ["arrow_right.xml", "checkmark.xml"];
const dummyXml = `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#000000" android:pathData="M0,0h24v24H0z"/></vector>`;

const routerDirs = [
  path.resolve(__dirname, "../node_modules/expo-router/assets"),
  path.resolve(__dirname, "../apps/mobile/node_modules/expo-router/assets"),
];

for (const rDir of routerDirs) {
  const routerPkg = path.resolve(rDir, "..");
  if (fs.existsSync(routerPkg)) {
    if (!fs.existsSync(rDir)) {
      fs.mkdirSync(rDir, { recursive: true });
    }
    for (const asset of expoRouterAssets) {
      const fullPath = path.join(rDir, asset);
      const parent = path.dirname(fullPath);
      if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent, { recursive: true });
      }
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, miniPng);
      }
    }
    for (const xml of xmlAssets) {
      const fullPath = path.join(rDir, xml);
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, dummyXml, "utf8");
      }
    }
  }
}

console.log("[generate-mobile-assets] Mobile and expo-router assets verified/generated successfully.");


const fs = require("fs");
const path = require("path");

// Usage: node extract-images.js <markdown-file> <image-prefix>
// Example: node extract-images.js src/posts/my-post.md transpac
const mdPath = process.argv[2];
const prefix = process.argv[3] || "post-image";

if (!mdPath) {
  console.error("Usage: node extract-images.js <markdown-file> <image-prefix>");
  process.exit(1);
}

const imagesDir = path.join(__dirname, "src", "assets", "images");
let content = fs.readFileSync(mdPath, "utf-8");

// Match: ![alt](data:image/TYPE;base64,DATA) — alt may be empty
const dataUriRegex = /!\[([^\]]*)\]\(data:image\/([a-zA-Z]+);base64,([^)]+)\)/g;

let count = 0;
content = content.replace(dataUriRegex, (match, alt, ext, data) => {
  count++;
  const filename = `${prefix}-${count}.${ext === "jpeg" ? "jpg" : ext}`;
  const filepath = path.join(imagesDir, filename);
  fs.writeFileSync(filepath, Buffer.from(data, "base64"));
  console.log(`  Extracted: ${filename} (${(fs.statSync(filepath).size / 1024).toFixed(0)} KB)`);
  return `![${alt}](/assets/images/${filename})`;
});

fs.writeFileSync(mdPath, content);
console.log(`\nExtracted ${count} images. File size now: ${(fs.statSync(mdPath).size / 1024).toFixed(0)} KB`);

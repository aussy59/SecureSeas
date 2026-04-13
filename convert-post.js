const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

async function convertPost(docxPath, options = {}) {
  if (!docxPath) {
    console.log("Usage: node convert-post.js <file.docx> [--tag tagname]");
    console.log('Example: node convert-post.js "My Blog Post.docx" --tag sailing');
    process.exit(1);
  }

  if (!fs.existsSync(docxPath)) {
    console.error(`File not found: ${docxPath}`);
    process.exit(1);
  }

  // Extract title from filename (remove .docx extension)
  const filename = path.basename(docxPath, ".docx");
  const title = options.title || filename;

  // Create URL-friendly slug
  const slug = filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Convert docx to markdown
  const result = await mammoth.convertToMarkdown({ path: docxPath });

  if (result.messages.length > 0) {
    console.log("Conversion warnings:");
    result.messages.forEach((msg) => console.log(`  - ${msg.message}`));
  }

  // Build frontmatter
  const date = new Date().toISOString().split("T")[0];
  const tag = options.tag || "General";
  const gradients = {
    cybersecurity: ["#0a2463", "#1e6091"],
    sailing: ["#1e6091", "#2e86c1"],
    "maritime tech": ["#2e86c1", "#3498db"],
    general: ["#0a2463", "#2e86c1"],
  };
  const gradient =
    gradients[tag.toLowerCase()] || gradients["general"];

  // Get first paragraph as excerpt
  const lines = result.value.split("\n").filter((l) => l.trim());
  const excerpt =
    lines.find((l) => !l.startsWith("#") && l.trim().length > 20) ||
    "Read more...";

  const frontmatter = `---
title: "${title}"
date: ${date}
tags:
  - posts
  - ${tag}
excerpt: "${excerpt.slice(0, 200).replace(/"/g, "'")}"
gradient:
  - "${gradient[0]}"
  - "${gradient[1]}"
layout: post.njk
---

`;

  const outputPath = path.join(__dirname, "src", "posts", `${slug}.md`);
  fs.writeFileSync(outputPath, frontmatter + result.value);

  console.log(`\nPost created: ${outputPath}`);
  console.log(`  Title: ${title}`);
  console.log(`  Tag: ${tag}`);
  console.log(`  Date: ${date}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review/edit: ${outputPath}`);
  console.log(`  2. git add . && git commit -m "New post: ${title}" && git push`);
}

// Parse CLI args
const args = process.argv.slice(2);
const docxPath = args.find((a) => !a.startsWith("--"));
const tagIdx = args.indexOf("--tag");
const tag = tagIdx !== -1 ? args[tagIdx + 1] : undefined;
const titleIdx = args.indexOf("--title");
const title = titleIdx !== -1 ? args[titleIdx + 1] : undefined;

convertPost(docxPath, { tag, title });

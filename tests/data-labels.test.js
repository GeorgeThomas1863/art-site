import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Static cross-check for the site's #1 documented mistake: creating an element
// with a data-label but never routing it in responsive.js, so clicks do nothing.
// A label passes if responsive.js references it (exact string or .includes()
// prefix), or if any frontend file uses it as a [data-label="..."] selector hook.

const JS_ROOT = path.join(process.cwd(), "public", "js");
const HTML_ROOT = path.join(process.cwd(), "html");
const RESPONSIVE_PATH = path.join(JS_ROOT, "responsive.js");

const SET_ATTR_REGEX = /setAttribute\(\s*["']data-label["']\s*,\s*["']([^"'`]+)["']\s*\)/g;
const HTML_ATTR_REGEX = /data-label=["']([^"']+)["']/g;
const INCLUDES_REGEX = /\.includes\(\s*["']([^"']+)["']\s*\)/g;

const collectFiles = (dir, ext) => {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = collectFiles(fullPath, ext);
      for (const file of nested) results.push(file);
      continue;
    }
    if (entry.name.endsWith(ext)) results.push(fullPath);
  }
  return results;
};

const stripCommentLines = (source) => {
  const kept = [];
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("<!--")) continue;
    kept.push(line);
  }
  return kept.join("\n");
};

const extractLabels = (source, regex) => {
  const labels = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    labels.push(match[1]);
  }
  return labels;
};

const collectEmittedLabels = () => {
  const emitted = new Map(); // label -> [files that emit it]
  const record = (label, file) => {
    if (!emitted.has(label)) emitted.set(label, []);
    emitted.get(label).push(path.relative(process.cwd(), file));
  };

  for (const file of collectFiles(JS_ROOT, ".js")) {
    const source = stripCommentLines(fs.readFileSync(file, "utf8"));
    for (const label of extractLabels(source, SET_ATTR_REGEX)) record(label, file);
  }
  for (const file of collectFiles(HTML_ROOT, ".html")) {
    const source = stripCommentLines(fs.readFileSync(file, "utf8"));
    for (const label of extractLabels(source, HTML_ATTR_REGEX)) record(label, file);
  }
  return emitted;
};

const buildAllJsSource = () => {
  let combined = "";
  for (const file of collectFiles(JS_ROOT, ".js")) {
    combined += fs.readFileSync(file, "utf8") + "\n";
  }
  return combined;
};

describe("data-label routing", () => {
  it("every emitted data-label is routed in responsive.js or used as a selector hook", () => {
    const responsiveSource = fs.readFileSync(RESPONSIVE_PATH, "utf8");
    const prefixes = extractLabels(responsiveSource, INCLUDES_REGEX);
    const allJsSource = buildAllJsSource();
    const emitted = collectEmittedLabels();

    const unrouted = [];
    for (const [label, files] of emitted) {
      const handledExactly = responsiveSource.includes(`"${label}"`) || responsiveSource.includes(`'${label}'`);

      let handledByPrefix = false;
      for (const prefix of prefixes) {
        if (label.includes(prefix)) {
          handledByPrefix = true;
          break;
        }
      }

      const usedAsSelector = allJsSource.includes(`[data-label="${label}"]`) || allJsSource.includes(`[data-label='${label}']`);

      if (!handledExactly && !handledByPrefix && !usedAsSelector) {
        unrouted.push(`"${label}" (emitted in: ${files.join(", ")})`);
      }
    }

    expect(unrouted, `Unrouted data-labels found — add handlers in responsive.js:\n${unrouted.join("\n")}`).toEqual([]);
  });

  it("finds a meaningful number of labels (sanity check that extraction works)", () => {
    const emitted = collectEmittedLabels();
    expect(emitted.size).toBeGreaterThan(20);
  });
});

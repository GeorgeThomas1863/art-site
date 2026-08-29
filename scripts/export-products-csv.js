/**
 * export-products-csv.js — operator tool (not part of the app).
 *
 * Reads every document in the products collection and writes it to a CSV file.
 * Columns are the union of every field found across all products (known fields
 * first, the rest alphabetical). Objects/arrays are JSON-stringified so nothing
 * is lost. Read-only: never writes to the database.
 *
 * HOW TO RUN (from the project root; uses the same env files the app loads):
 *
 *   node scripts/export-products-csv.js
 *   node scripts/export-products-csv.js --out C:\some\path\products.csv
 *
 * Default output: scripts/exports/products-<timestamp>.csv (gitignored).
 *
 * Inside the Docker stack:
 *   docker compose exec app node scripts/export-products-csv.js
 *   (the file lands inside the container; pass --out to a mounted path to keep it)
 *
 * Requires MONGO_URI, DB_NAME, PRODUCTS_COLLECTION. Exits non-zero on any error.
 */
import "../middleware/env-config.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_EXPORT_DIR = path.join(SCRIPT_DIR, "exports");

// known fields shown first, in this order; every other field follows alphabetically
const PREFERRED_COLUMNS = ["_id", "productId", "productCode", "productType", "name", "title", "price", "urlName", "sold"];

const HELP_TEXT = `Usage: node scripts/export-products-csv.js [--out <file>]

Exports every product document to a CSV file.

Options:
  --out <file>  Write the CSV to this path instead of scripts/exports/.
  --help        Print this help and exit without connecting to MongoDB.
`;

const main = async () => {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) return printHelp();

  validateEnvironment();
  const client = await connectToDatabase();

  try {
    const products = await fetchProducts(client);
    const csvText = buildCsvText(products);
    const outputPath = writeCsvFile(csvText, options.out);
    console.log(`Exported ${products.length} products to ${outputPath}`);
  } finally {
    await closeDatabaseConnection(client);
  }
};

const parseOptions = (args) => {
  const options = { out: null, help: false };

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--out") {
      index++;
      if (index >= args.length) throw new Error("--out requires a file path");
      options.out = args[index];
    } else throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
};

const printHelp = () => {
  console.log(HELP_TEXT);
};

const validateEnvironment = () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  if (!process.env.DB_NAME) throw new Error("DB_NAME is required");
  if (!process.env.PRODUCTS_COLLECTION) throw new Error("PRODUCTS_COLLECTION is required");
};

const connectToDatabase = async () => {
  try {
    return await MongoClient.connect(process.env.MONGO_URI);
  } catch (error) {
    throw new Error("Failed to connect to MongoDB", { cause: error });
  }
};

const fetchProducts = async (client) => {
  try {
    const database = client.db(process.env.DB_NAME);
    return await database.collection(process.env.PRODUCTS_COLLECTION).find({}).toArray();
  } catch (error) {
    throw new Error(`Failed to read products from ${process.env.PRODUCTS_COLLECTION}`, { cause: error });
  }
};

//---------- csv building ----------

const buildCsvText = (products) => {
  const columns = buildColumnList(products);
  const lines = [buildCsvLine(columns)];

  for (let index = 0; index < products.length; index++) {
    const row = buildRowValues(products[index], columns);
    lines.push(buildCsvLine(row));
  }

  // BOM so Excel opens the file as UTF-8
  return "\ufeff" + lines.join("\r\n") + "\r\n";
};

const buildColumnList = (products) => {
  const allKeys = new Set();
  for (let index = 0; index < products.length; index++) {
    const keys = Object.keys(products[index]);
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
      allKeys.add(keys[keyIndex]);
    }
  }

  const columns = [];
  for (let index = 0; index < PREFERRED_COLUMNS.length; index++) {
    if (!allKeys.has(PREFERRED_COLUMNS[index])) continue;
    columns.push(PREFERRED_COLUMNS[index]);
    allKeys.delete(PREFERRED_COLUMNS[index]);
  }

  const remainingColumns = [...allKeys].sort();
  for (let index = 0; index < remainingColumns.length; index++) {
    columns.push(remainingColumns[index]);
  }

  return columns;
};

const buildRowValues = (product, columns) => {
  const values = [];
  for (let index = 0; index < columns.length; index++) {
    values.push(formatCellValue(product[columns[index]]));
  }
  return values;
};

const formatCellValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && typeof value.toHexString === "function") return String(value); // ObjectId
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const buildCsvLine = (values) => {
  const escapedValues = [];
  for (let index = 0; index < values.length; index++) {
    escapedValues.push(escapeCsvValue(values[index]));
  }
  return escapedValues.join(",");
};

const escapeCsvValue = (value) => {
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

//---------- file output ----------

const writeCsvFile = (csvText, outOption) => {
  const outputPath = outOption ? path.resolve(outOption) : buildDefaultOutputPath();

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, csvText, "utf8");
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to write CSV to ${outputPath}`, { cause: error });
  }
};

const buildDefaultOutputPath = () => {
  const timestamp = buildTimestamp();
  return path.join(DEFAULT_EXPORT_DIR, `products-${timestamp}.csv`);
};

const buildTimestamp = () => {
  const now = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${date}-${time}`;
};

const closeDatabaseConnection = async (client) => {
  try {
    await client.close();
  } catch (error) {
    throw new Error("Failed to close Mongo connection", { cause: error });
  }
};

main().catch((error) => {
  console.error("Export failed:", error);
  process.exitCode = 1;
});

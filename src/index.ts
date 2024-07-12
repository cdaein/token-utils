// Knowledge - 26066 (author is null as it's a collaboration)
// Duet - 18461
// Time Intertwined - 13526
// Growth One - 10249

// REVIEW: does path slash work on other OSes?

import { type GenToken, getTokenDataById, downloadThumbnails } from "./fxhash";
import * as fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
// import { solana } from "./codecanvas";
import {
  getTokenDataByAddress,
  downloadThumbnails as downloadObjktImages,
} from "./objkt";

// take input from user
const program = new Command();
program
  .option("-p --platform <platform>", "NFT Platform (fxhash or objkt)")
  .option("-c --contract <name>", "FA Contract Name")
  .option(
    "-ca --creator-address <address>",
    "Tezos creator address (for Objkt query)",
  )
  .option("-i --id <id>", "Project ID")
  .option("-s --start <num>", "Start iteration (from 1) for fxhash")
  .option("-e --end <num>", "End iteration (inclusive) for fxhash")
  .option("--data", "Download JSON data")
  .option("--images", "Download thumbnail images");
program.parse(process.argv);
const options = program.opts();

if (!options.platform) {
  console.error("Error: Missing required option --platform");
  program.help(); // Display help message
  process.exit(1); // Exit with a non-zero status code
}

if (options.platform === "objkt") {
  if (!options.contract) {
    console.error("Error: Missing required option --contract");
    program.help(); // Display help message
    process.exit(1); // Exit with a non-zero status code
  }
  if (!options.creatorAddress) {
    console.error("error: Missing required option --creator-address");
    program.help();
    process.exit(1);
  }

  const tokens = await getTokenDataByAddress(
    // "tz1WXTdGdwD6g24vJp7vpjWVR8LuFpisUcoc",
    options.creatorAddress,
  );

  // filter tokens with contract name
  const filteredTokens = tokens.filter(
    (token) => token.fa.name === options.contract,
  );

  // construct output directory structure
  const contractName = options.contract.toLowerCase().replace(/\s/g, "-");
  const outDir = path.join("./output", contractName);

  // download data as JSON file
  if (options.data) downloadJson(filteredTokens, outDir);

  // download images
  if (options.images) downloadObjktImages(filteredTokens, outDir);
}

if (options.platform === "fxhash") {
  if (!options.id) {
    console.error("Error: Missing required option --id");
    program.help(); // Display help message
    process.exit(1); // Exit with a non-zero status code console.warn("You need to provide the Token ID");
  }

  // request data from fxhash API
  const token = await getTokenDataById(parseInt(options.id));

  // construct output directory structure
  const tokenName = token.name.toLowerCase().replace(/\s/g, "-");
  const outDir = path.join("./output", tokenName);

  // download data as JSON file
  if (options.data) downloadJson(token, outDir);

  // download images
  if (options.images) {
    const from = options.start;
    const to = options.end;
    let range: number[] = [];
    if (from && to) {
      range.push(from);
      range.push(to);
    }
    downloadThumbnails(token, outDir, range);
  }
}

async function downloadJson(token: any, outDir: string) {
  // if outDir not exist, create one recursively
  if (!fs.existsSync(outDir)) {
    try {
      console.log(`Creating output directory at ${path.resolve(outDir)}`);
      fs.mkdirSync(outDir, { recursive: true });
    } catch (e) {
      throw new Error("Error while creating output directory");
    }
  }

  const filename = `data.json`;
  const filePath = path.join(outDir, filename);

  try {
    fs.writeFileSync(filePath, JSON.stringify(token, null, 2));
    console.log(`Successfully created ${filePath}`);
  } catch (e) {
    console.error(`Error while creating ${filePath}`);
  }
}

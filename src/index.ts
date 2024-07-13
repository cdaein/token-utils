#!/usr/bin/env node

// Knowledge - 26066 (author is null as it's a collaboration)
// Duet - 18461
// Time Intertwined - 13526
// Growth One - 10249

// REVIEW: does path slash work on other OSes?

import { type GenToken, getTokenDataById, downloadThumbnails } from "./fxhash";
import path from "node:path";
import { Command } from "commander";
// import { solana } from "./codecanvas";
import {
  getTokenDataByAddress,
  downloadThumbnails as downloadObjktImages,
} from "./objkt";
import { downloadJson } from "./utils";

interface FxhashOptions {
  /** fxhash project id */
  id: string;
  start: number;
  end: number;
  data: boolean;
  images: boolean;
}

interface ObjktOptions {
  contract: string;
  creatorAddress: string;
  data: boolean;
  images: boolean;
}

// take input from user
const program = new Command();

function getHelpInfo(program: Command, platform: string) {
  return program.commands
    .find((cmd) => cmd.name() === platform)!
    .helpInformation();
}

program
  .command("fxhash")
  .description("Get fxhash token data using fxhash API")
  .option("-i --id <id>", "Project ID")
  .option("-s --start <num>", "Start iteration (from 1) for fxhash")
  .option("-e --end <num>", "End iteration (inclusive) for fxhash")
  .option("--data", "Download JSON data")
  .option("--images", "Download thumbnail images")
  .action(async (options: FxhashOptions) => {
    if (!options.id) {
      console.error("Error: Missing required option --id");
      // display help info
      const info = getHelpInfo(program, "fxhash");
      console.log(info);
      process.exit(1); // Exit with a non-zero status code
    }
    if (!options.data || !options.images) {
      console.error("Error: Missing required option --id");
      program.help(); // Display help message
      process.exit(1); // Exit with a non-zero status code
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
  });

program
  .command("objkt")
  .description(
    "Get token data using Objkt API. You can also query token data from other platforms such as Versum and fxhash by providing the contract name",
  )
  .option("-c --contract <name>", "FA Contract Name")
  .option("-ca --creator-address <address>", "Tezos creator address")
  .option("--data", "Download JSON data")
  .option("--images", "Download thumbnail images")
  .action(async (options: ObjktOptions) => {
    if (!options.contract) {
      console.error("Error: Missing required option --contract");
      const info = getHelpInfo(program, "objkt");
      console.log(info);
      process.exit(1); // Exit with a non-zero status code
    }
    if (!options.creatorAddress) {
      console.error("error: Missing required option --creator-address");
      const info = getHelpInfo(program, "objkt");
      console.log(info);
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
  });

program.parse(process.argv);

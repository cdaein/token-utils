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
  .requiredOption("-i --id <id>", "Project ID")
  .option("-s --start <num>", "Start iteration (from 1) for fxhash")
  .option("-e --end <num>", "End iteration (inclusive) for fxhash")
  .option("--data", "Download JSON data")
  .option("--images", "Download thumbnail images")
  .action(async (options: FxhashOptions) => {
    const info = getHelpInfo(program, "fxhash");
    if (!options.data || !options.images) {
      console.error("Error: Missing required option --data and/or --images");
      console.log(info);
      process.exit(1); // Exit with a non-zero status code
    }

    try {
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
        await downloadThumbnails(token, outDir, range);
      }
    } catch (e) {
      console.error(e);
    }
  });

program
  .command("objkt")
  .description(
    "Get token data using Objkt API. You can also query token data from other platforms such as Versum and fxhash by providing the contract name",
  )
  .requiredOption("-c --contract <name>", "FA Contract Name")
  .requiredOption("-ca --creator-address <address>", "Tezos creator address")
  .option("--data", "Download JSON data")
  .option("--images", "Download thumbnail images")
  .action(async (options: ObjktOptions) => {
    try {
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
      if (options.images) await downloadObjktImages(filteredTokens, outDir);
    } catch (e) {
      console.error(e);
    }
  });

program.parse(process.argv);

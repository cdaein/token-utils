#!/usr/bin/env node
import * as fs from 'node:fs';
import fs__default from 'node:fs';
import fetch2 from 'node-fetch';
import path from 'node:path';
import { Command } from 'commander';

async function downloadThumbnails(token, outDir, range) {
  if (!fs.existsSync(outDir)) {
    try {
      console.log(`Creating output directory at ${path.resolve(outDir)}`);
      fs.mkdirSync(outDir, { recursive: true });
    } catch (e) {
      throw new Error("Error while creating output directory");
    }
  }
  const iterationsToDownload = token.entireCollection.flatMap((iteration) => {
    return {
      number: iteration.iteration,
      hash: iteration.metadata.iterationHash,
      imageUri: ipfsToHttps(iteration.metadata.displayUri)
    };
  });
  let from = 1;
  let to = iterationsToDownload.length;
  if (range.length === 2) {
    from = range[0] || from;
    to = range[1] || to;
  }
  for (let i = from - 1; i < to; i++) {
    const iteration = iterationsToDownload[i];
    const response = await fetch2(iteration.imageUri);
    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `${iteration.number.toString().padStart(4, "0")}-${iteration.hash}.png`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Writing file... ${filePath}`);
  }
}
function ipfsToHttps(path5) {
  return `https://ipfs.io/ipfs/${path5.slice(7)}`;
}
async function getTokenDataById(generativeTokenId) {
  try {
    const response = await fetch2(`https://api.fxhash.xyz/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query getCollectionById($generativeTokenId: Float) {
            generativeToken(id: $generativeTokenId) {
              name
              createdAt
              author {
                name
              }
              generativeUri
              metadata
              tags
              thumbnailUri
              entireCollection {
                metadata
                name
                iteration
                thumbnailUri
              }
              displayUri
            }
          }
        `,
        variables: {
          generativeTokenId
        }
      })
    });
    const {
      data: { generativeToken }
    } = await response.json();
    console.log("Fetched data from fxhash API successfully");
    return generativeToken;
  } catch (e) {
    console.error(e);
    throw new Error("Error while fetching data from fxhash API");
  }
}
async function downloadThumbnails2(tokens, outDir) {
  if (!fs.existsSync(outDir)) {
    try {
      console.log(`Creating output directory at ${path.resolve(outDir)}`);
      fs.mkdirSync(outDir, { recursive: true });
    } catch (e) {
      throw new Error("Error while creating output directory");
    }
  }
  const tokensToDownload = tokens.flatMap((token) => {
    const thumb = token.extra.find(
      (ex) => ex.mime_type === "image/jpeg" && ex.dimensions.value === "480x480" ? ex : null
    );
    return {
      name: token.name,
      imageUri: ipfsToHttps2(thumb ? thumb.uri : token.display_uri),
      extra: token.extra
    };
  });
  for (const token of tokensToDownload) {
    const response = await fetch(token.imageUri);
    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `${token.name}.jpeg`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Writing file... ${filePath}`);
  }
}
function ipfsToHttps2(path5) {
  console.log({ path: path5 });
  return `https://ipfs.io/ipfs/${path5.slice(7)}`;
}
async function getTokenDataByAddress(creatorAddress) {
  try {
    const response = await fetch(`https://data.objkt.com/v3/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query getToken($creatorAddress: String) {
            token(where: {creators: {creator_address: {_eq: $creatorAddress}}}) {
              name
              token_id
              thumbnail_uri
              artifact_uri
              display_uri
              fa {
                name
                contract
                path
              }
              description
              tags {
                tag {
                  name
                }
              }
              extra
              mime
            }
          }
        `,
        variables: {
          creatorAddress
        }
      })
    });
    const {
      data: { token: tokens }
    } = await response.json();
    return tokens;
  } catch (e) {
    console.error(e);
    throw new Error("Error while fetching data from objkt API");
  }
}
async function downloadJson(token, outDir) {
  if (!fs__default.existsSync(outDir)) {
    try {
      console.log(`Creating output directory at ${path.resolve(outDir)}`);
      fs__default.mkdirSync(outDir, { recursive: true });
    } catch (e) {
      throw new Error("Error while creating output directory");
    }
  }
  const filename = `data.json`;
  const filePath = path.join(outDir, filename);
  try {
    fs__default.writeFileSync(filePath, JSON.stringify(token, null, 2));
    console.log(`Successfully created ${filePath}`);
  } catch (e) {
    console.error(`Error while creating ${filePath}`);
  }
}

// src/index.ts
var program = new Command();
function getHelpInfo(program2, platform) {
  return program2.commands.find((cmd) => cmd.name() === platform).helpInformation();
}
program.command("fxhash").description("Get fxhash token data using fxhash API").option("-i --id <id>", "Project ID").option("-s --start <num>", "Start iteration (from 1) for fxhash").option("-e --end <num>", "End iteration (inclusive) for fxhash").option("--data", "Download JSON data").option("--images", "Download thumbnail images").action(async (options) => {
  if (!options.id) {
    console.error("Error: Missing required option --id");
    const info = getHelpInfo(program, "fxhash");
    console.log(info);
    process.exit(1);
  }
  if (!options.data || !options.images) {
    console.error("Error: Missing required option --id");
    program.help();
    process.exit(1);
  }
  const token = await getTokenDataById(parseInt(options.id));
  const tokenName = token.name.toLowerCase().replace(/\s/g, "-");
  const outDir = path.join("./output", tokenName);
  if (options.data) downloadJson(token, outDir);
  if (options.images) {
    const from = options.start;
    const to = options.end;
    let range = [];
    if (from && to) {
      range.push(from);
      range.push(to);
    }
    downloadThumbnails(token, outDir, range);
  }
});
program.command("objkt").description(
  "Get token data using Objkt API. You can also query token data from other platforms such as Versum and fxhash by providing the contract name"
).option("-c --contract <name>", "FA Contract Name").option("-ca --creator-address <address>", "Tezos creator address").option("--data", "Download JSON data").option("--images", "Download thumbnail images").action(async (options) => {
  if (!options.contract) {
    console.error("Error: Missing required option --contract");
    const info = getHelpInfo(program, "objkt");
    console.log(info);
    process.exit(1);
  }
  if (!options.creatorAddress) {
    console.error("error: Missing required option --creator-address");
    const info = getHelpInfo(program, "objkt");
    console.log(info);
    process.exit(1);
  }
  const tokens = await getTokenDataByAddress(
    // "tz1WXTdGdwD6g24vJp7vpjWVR8LuFpisUcoc",
    options.creatorAddress
  );
  const filteredTokens = tokens.filter(
    (token) => token.fa.name === options.contract
  );
  const contractName = options.contract.toLowerCase().replace(/\s/g, "-");
  const outDir = path.join("./output", contractName);
  if (options.data) downloadJson(filteredTokens, outDir);
  if (options.images) downloadThumbnails2(filteredTokens, outDir);
});
program.parse(process.argv);

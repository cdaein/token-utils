import * as fs from 'node:fs';
import fs__default from 'node:fs';
import fetch from 'node-fetch';
import path from 'node:path';
import kleur from 'kleur';
import { Command } from 'commander';

// src/fxhash.ts
var { yellow } = kleur;
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
    try {
      const iteration = iterationsToDownload[i];
      const filename = `${iteration.number.toString().padStart(4, "0")}-${iteration.hash}.png`;
      const filePath = path.join(outDir, filename);
      if (fs.existsSync(filePath)) {
        console.log(`File already exists. Skipping ${yellow(filePath)}`);
        continue;
      }
      console.log(`Fetching image from ${iteration.imageUri}`);
      const response = await fetch(iteration.imageUri);
      const buffer = Buffer.from(await response.arrayBuffer());
      console.log(`Writing file... ${filePath}`);
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      console.error(`Error while downloading`, e);
    }
  }
}
function ipfsToHttps(path5) {
  return `https://ipfs.io/ipfs/${path5.slice(7)}`;
}
async function getTokenDataById(generativeTokenId) {
  try {
    const response = await fetch(`https://api.fxhash.xyz/graphql`, {
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
var { yellow: yellow2 } = kleur;
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
    try {
      const filename = `${token.name}.jpeg`;
      const filePath = path.join(outDir, filename);
      if (fs.existsSync(filePath)) {
        console.log(`File already exists. Skipping ${yellow2(filePath)}`);
        continue;
      }
      const timeout = 20;
      console.log(`Fetching image from ${token.imageUri}`);
      const response = await fetchWithTimeout(token.imageUri, timeout * 1e3);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image within ${timeout} seconds: ${response.statusText}`
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      console.log(`Writing file... ${filePath}`);
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      console.error(`Error while downloading`, e);
    }
  }
}
async function fetchWithTimeout(file, timeout = 2e4) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(file, {
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}
function ipfsToHttps2(path5) {
  return `https://ipfs.io/ipfs/${path5.slice(7)}`;
}
function downloadJson(token, outDir) {
  if (!fs__default.existsSync(outDir)) {
    console.log(`Creating output directory at ${path.resolve(outDir)}`);
    fs__default.mkdirSync(outDir, { recursive: true });
  }
  const filename = `data.json`;
  const filePath = path.join(outDir, filename);
  fs__default.writeFileSync(filePath, JSON.stringify(token, null, 2));
  console.log(`Successfully created ${filePath}`);
}

// src/index.ts
var program = new Command();
function getHelpInfo(program2, platform) {
  return program2.commands.find((cmd) => cmd.name() === platform).helpInformation();
}
program.command("fxhash").description("Get fxhash token data using fxhash API").requiredOption("-i --id <id>", "Project ID").option("-s --start <num>", "Start iteration (from 1) for fxhash").option("-e --end <num>", "End iteration (inclusive) for fxhash").option("--data", "Download JSON data").option("--images", "Download thumbnail images").action(async (options) => {
  const info = getHelpInfo(program, "fxhash");
  if (!options.data && !options.images) {
    console.error("Error: Missing required option --data and/or --images");
    console.log(info);
    process.exit(1);
  }
  try {
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
      await downloadThumbnails(token, outDir, range);
    }
  } catch (e) {
    console.error(e);
  }
});
program.command("objkt").description(
  "Get token data using Objkt API. You can also query token data from other platforms such as Versum and fxhash by providing the contract name"
).requiredOption("-c --contract <name>", "FA Contract Name").requiredOption("-ca --creator-address <address>", "Tezos creator address").option("--data", "Download JSON data").option("--images", "Download thumbnail images").action(async (options) => {
  try {
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
    if (options.images) await downloadThumbnails2(filteredTokens, outDir);
  } catch (e) {
    console.error(e);
  }
});
program.parse(process.argv);

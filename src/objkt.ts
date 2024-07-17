// https://data.objkt.com/docs/

import * as fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import kleur from "kleur";
import type { Token } from "./types";

const { yellow } = kleur;

export async function getTokenDataByAddress(creatorAddress: string) {
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
          creatorAddress,
        },
      }),
    });

    const {
      data: { token: tokens },
    } = (await response.json()) as { data: { token: Token[] } };

    return tokens;
  } catch (e) {
    console.error(e);
    throw new Error("Error while fetching data from objkt API");
  }
}

export async function downloadThumbnails(tokens: Token[], outDir: string) {
  // if outDir not exist, create one recursively
  if (!fs.existsSync(outDir)) {
    try {
      console.log(`Creating output directory at ${path.resolve(outDir)}`);
      fs.mkdirSync(outDir, { recursive: true });
    } catch (e) {
      throw new Error("Error while creating output directory");
    }
  }

  const tokensToDownload = tokens.flatMap((token) => {
    // NOTE: some tokens have thumbnail set to mp4.
    // so, look through "extra" to find jpeg image.
    // many old tokens don't have 720x720
    const thumb = token.extra.find((ex) =>
      ex.mime_type === "image/jpeg" && ex.dimensions.value === "480x480"
        ? ex
        : null,
    );
    // console.log({ thumb });
    // console.log(token.display_uri);

    return {
      name: token.name,
      imageUri: ipfsToHttps(thumb ? thumb.uri : token.display_uri),
      extra: token.extra,
    };
  });

  for (const token of tokensToDownload) {
    try {
      // NOTE: objkt thumbnails are JPEG
      const filename = `${token.name}.jpeg`;
      const filePath = path.join(outDir, filename);

      // if file exists, skip
      if (fs.existsSync(filePath)) {
        console.log(`File already exists. Skipping ${yellow(filePath)}`);
        continue;
      }

      const timeout = 20; // in seconds
      console.log(`Fetching image from ${token.imageUri}`);
      // const response = await fetch(token.imageUri);
      const response = await fetchWithTimeout(token.imageUri, timeout * 1000);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image within ${timeout} seconds: ${response.statusText}`,
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());

      console.log(`Writing file... ${filePath}`);
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      // log error and continue with next token
      console.error(`Error while downloading`, e);
    }
  }
}

/**
 *
 * @param file - file path to fetch
 * @param timeout - how long before abort
 * @returns
 */
async function fetchWithTimeout(file: string, timeout = 20_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(file, {
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function ipfsToHttps(path: string) {
  // console.log({ path });
  // 'ipfs://QmRBAEybraPms4WCsUVSrXkVWaNtBM28NjYFGCaDqDETzX'
  return `https://ipfs.io/ipfs/${path.slice(7)}`;
}

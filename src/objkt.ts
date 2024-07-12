// https://data.objkt.com/docs/

import * as fs from "node:fs";
import path from "node:path";

interface Token {
  name: string;
  token_id: string;
  thumbnail_uri: string;
  /** actual token (ie. mp4) */
  artifact_uri: string;
  /** hi-res image (sometimes video itself?!) */
  display_uri: string;
  fa: {
    name: string;
    contract: string;
    path: string;
  };
  description: string;
  tags: {
    tag: {
      name: string;
    };
  };
  extra: {
    uri: string;
    file_name: string;
    mime_type: "video/mp4" | "image/jpeg";
    dimensions: {
      value: "480x480" | "720x720" | "960x960"; // there are more..
    };
  }[];
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
    const response = await fetch(token.imageUri);
    const buffer = Buffer.from(await response.arrayBuffer());

    // NOTE: objkt thumbnails are JPEG
    const filename = `${token.name}.jpeg`;
    const filePath = path.join(outDir, filename);

    fs.writeFileSync(filePath, buffer);
    console.log(`Writing file... ${filePath}`);
  }
}

function ipfsToHttps(path: string) {
  console.log({ path });
  // 'ipfs://QmRBAEybraPms4WCsUVSrXkVWaNtBM28NjYFGCaDqDETzX'
  return `https://ipfs.io/ipfs/${path.slice(7)}`;
}
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

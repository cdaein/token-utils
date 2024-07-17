// https://studio.apollographql.com/sandbox/explorer

import * as fs from "node:fs";
import fetch from "node-fetch";
import path from "node:path";
import kleur from "kleur";

interface CollectionMetadata {
  name: string;
  description: string;
  tags: string[];
  artifactUri: string;
  displayUri: string;
  generativeUri: string;
}
interface IterationMetadata {
  /** project title + #iteration number */
  name: string;
  description: string;
  iterationHash: string;
  generatorUri: string;
  /** includes fxhash url parameter unique to each iteration. (fxparams if applicable as well) */
  artifactUri: string;
  /** full res image */
  displayUri: string;
  /** iteration thumbnail */
  thumbnailUri: string;
  attributes: Record<string, any>[];
}
interface Iteration {
  metadata: IterationMetadata;
  /** project title + #iteration number */
  name: string;
  /** iteration number only */
  iteration: number;
  /** iteration thumbnail */
  thumbnailUri: string;
}
export interface GenToken {
  /** project title */
  name: string;
  createdAt: string;
  author: {
    name: string;
  };
  generativeUri: string;
  metadata: CollectionMetadata;
  tags: string[];
  thumbnailUri: string;
  /** array of iteration data */
  entireCollection: Iteration[];
}

const { yellow } = kleur;

/**
 * @param token -
 * @param outDir -
 * @param range - `[from, to]` starts from `1`.
 */
export async function downloadThumbnails(
  token: GenToken,
  outDir: string,
  range: number[],
) {
  // if outDir not exist, create one recursively
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
      imageUri: ipfsToHttps(iteration.metadata.displayUri),
    };
  });

  let from = 1;
  let to = iterationsToDownload.length;
  if (range.length === 2) {
    from = range[0] || from;
    to = range[1] || to;
  }

  // for (const iteration of iterationsToDownload) {
  for (let i = from - 1; i < to; i++) {
    try {
      const iteration = iterationsToDownload[i];
      const filename = `${iteration.number.toString().padStart(4, "0")}-${iteration.hash}.png`;
      const filePath = path.join(outDir, filename);

      // if file exists, skip
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
      // log error and continue with next token
      console.error(`Error while downloading`, e);
    }
  }
}

function ipfsToHttps(path: string) {
  // 'ipfs://QmRBAEybraPms4WCsUVSrXkVWaNtBM28NjYFGCaDqDETzX'
  return `https://ipfs.io/ipfs/${path.slice(7)}`;
}

export async function getTokenDataById(generativeTokenId: number) {
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
          generativeTokenId,
        },
      }),
    });

    const {
      data: { generativeToken },
    } = (await response.json()) as { data: { generativeToken: GenToken } };

    console.log("Fetched data from fxhash API successfully");
    return generativeToken;
  } catch (e) {
    console.error(e);
    throw new Error("Error while fetching data from fxhash API");
  }
}

// NOTE: don't use it at the moment.

// export async function getTokenDataByUser(userId: string) {
//   try {
//     const response = await fetch(`https://api.fxhash.xyz/graphql`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         query: `
//           query getCollection($userId: String) {
//             user(id: $userId) {
//               generativeTokens {
//                 name
//                 createdAt
//                 author {
//                   name
//                 }
//                 entireCollection {
//                   name
//                   generationHash
//                   metadata
//                 }
//               }
//             }
//           }
//         `,
//         variables: {
//           userId,
//         },
//       }),
//     });
//     const data = await response.json();
//     console.log("Fetched data from fxhash API successfully");
//     return data;
//   } catch (e) {
//     console.error(e);
//     throw new Error("Error while fetching data from fxhash API");
//   }
// }

/** fxhash CLI command arguments */
export interface FxhashOptions {
  /** fxhash project id */
  id: string;
  start: number;
  end: number;
  data: boolean;
  images: boolean;
}

/** objkt CLI command arguments */
export interface ObjktOptions {
  contract: string;
  creatorAddress: string;
  data: boolean;
  images: boolean;
}

// fxhash

/** fxhash CollectionMetadata */
export interface CollectionMetadata {
  name: string;
  description: string;
  tags: string[];
  artifactUri: string;
  displayUri: string;
  generativeUri: string;
}

/** fxhash IterationMetadata */
export interface IterationMetadata {
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

/** fxhash Iteration */
export interface Iteration {
  metadata: IterationMetadata;
  /** project title + #iteration number */
  name: string;
  /** iteration number only */
  iteration: number;
  /** iteration thumbnail */
  thumbnailUri: string;
}

/** fxhash GenToken */
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

// objkt

/** objkt Token */
export interface Token {
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

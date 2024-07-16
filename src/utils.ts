import fs from "node:fs";
import path from "node:path";

export function downloadJson(token: any, outDir: string) {
  // if outDir not exist, create one recursively
  if (!fs.existsSync(outDir)) {
    console.log(`Creating output directory at ${path.resolve(outDir)}`);
    fs.mkdirSync(outDir, { recursive: true });
  }

  const filename = `data.json`;
  const filePath = path.join(outDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(token, null, 2));
  console.log(`Successfully created ${filePath}`);
}

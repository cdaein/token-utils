import fs from "node:fs";
import path from "node:path";

export async function downloadJson(token: any, outDir: string) {
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

import { existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const distDir = process.env.NEXT_DIST_DIR ?? ".next-dev";
const cacheDir = join(root, distDir);
const archiveRoot = "/private/tmp/cdeez-next-caches";
const port = process.env.PORT ?? "3010";
const host = process.env.HOST ?? "0.0.0.0";

mkdirSync(archiveRoot, { recursive: true });

if (existsSync(cacheDir)) {
  renameSync(cacheDir, join(archiveRoot, `next-cache-${Date.now()}`));
}

const nextBin = join(root, "node_modules", ".bin", "next");
const nodeBin = dirname(process.execPath);
const child = spawn(nextBin, ["dev", "--hostname", host, "--port", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir,
    PATH: `${nodeBin}:${process.env.PATH ?? ""}`
  }
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

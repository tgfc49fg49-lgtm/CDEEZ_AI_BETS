import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const distDir = process.env.NEXT_DIST_DIR ?? ".next";
const cacheDir = join(root, distDir);
const port = process.env.PORT ?? "3010";
const host = process.env.HOST ?? "0.0.0.0";

mkdirSync(root, { recursive: true });

if (existsSync(cacheDir)) {
  rmSync(cacheDir, { recursive: true, force: true });
}

const nextBin = join(root, "node_modules", ".bin", "next");
const nodeBin = dirname(process.execPath);
const child = spawn(nextBin, ["dev", "--hostname", host, "--port", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    PATH: `${nodeBin}:${process.env.PATH ?? ""}`
  }
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

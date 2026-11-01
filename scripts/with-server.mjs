// Usage: node scripts/with-server.mjs "<command>"   (run `npm run build` first)
// Starts `next start -p 3100` on the existing build, runs the command, then stops the server (by PID, never by image name).
import { execSync, spawn } from "node:child_process";

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;

const command = process.argv[2];
if (!command) {
  console.error('usage: node scripts/with-server.mjs "<command>"');
  process.exit(1);
}

/** HTTP status at `url`, or 0 when nothing is listening. */
async function probe(url) {
  try {
    return (await fetch(url)).status;
  } catch {
    return 0;
  }
}

// A server that is already up would be measured instead of this build (and `next start` would fail to bind anyway).
if (await probe(BASE)) {
  console.error(`with-server: something is already listening on ${PORT} (a stale server would serve an old build); stop it first`);
  process.exit(1);
}

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], { stdio: "ignore" });
const stop = () => {
  if (server.exitCode !== null) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: "ignore" });
    else server.kill("SIGTERM");
  } catch {
    // already gone
  }
};

let code = 1;
try {
  const end = Date.now() + 90_000;
  for (;;) {
    if (server.exitCode !== null) throw new Error(`"next start" exited with code ${server.exitCode} (is there a build?)`);
    if ((await probe(BASE)) === 200) break;
    if (Date.now() > end) throw new Error("server did not start within 90 s");
    await new Promise((r) => setTimeout(r, 500));
  }
  execSync(command, { stdio: "inherit" });
  code = 0;
} catch (error) {
  console.error(`with-server: ${error instanceof Error ? error.message : error}`);
} finally {
  stop();
}
process.exit(code);

import { spawn } from "node:child_process";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  {
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
server.stderr.on("data", (data) => process.stderr.write(data));
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null)
      throw new Error("Integration server stopped before becoming ready.");
    try {
      const response = await fetch(
        "http://127.0.0.1:3001/api/platform/overview",
      );
      if (response.status === 401) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error("Integration server readiness timed out.");
  const test = spawn(
    process.execPath,
    ["--use-env-proxy", "--env-file=.env.local", "tests/platform-http.mjs"],
    { env: process.env, stdio: "inherit" },
  );
  const code = await new Promise((resolve) => test.on("exit", resolve));
  process.exitCode = code || 0;
} finally {
  server.kill("SIGTERM");
}

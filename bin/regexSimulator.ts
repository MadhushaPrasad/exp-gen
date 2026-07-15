import http from "http";
import net from "net";
import { exec } from "child_process";
import pc from "picocolors";
import * as p from "@clack/prompts";

function findAvailablePort(port: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(port));
    });

    server.on("error", () => resolve(findAvailablePort(port + 1)));
  });
}

function openBrowser(url: string) {
  const commands = {
    win32: `start "" "${url}"`,
    darwin: `open "${url}"`,
    linux: `xdg-open "${url}"`,
  };

  const command =
    commands[process.platform as keyof typeof commands] ?? commands.linux;
  exec(command);
}

export async function runRegexSimulator() {
  // Native HTTP Server Setup
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  });

  const port = await findAvailablePort(4000);

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      p.outro(pc.green("✔ Regex simulator environment started"));
      // Print a clean visual card in the terminal console
      // Pixel-perfect console dashboard card
      console.log(pc.cyan("┌──────────────────────────────────────────────────────────────┐"));
      console.log(`${pc.cyan("│")}  🔬 ${pc.bold("Live Regex Simulator Environment Active")}`);
      console.log(`${pc.cyan("│")}`);
      console.log(`${pc.cyan("│")}  ${pc.dim("Portal URL:")}  ${pc.underline(pc.yellow(url.padEnd(38)))}`);
      console.log(`${pc.cyan("│")}`);
      console.log(`${pc.cyan("│")}  ${pc.dim("Control:")}     Press ${pc.inverse(pc.bold(" Ctrl + C "))} to terminate server`);
      console.log(pc.cyan("└──────────────────────────────────────────────────────────────┘\n"));
      openBrowser(url);
      resolve();
    });
  });

  return new Promise(() => {});
}

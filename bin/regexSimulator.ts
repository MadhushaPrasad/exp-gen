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

// --- Regex simulator Logic ---
const clientScript = `
    const pattern = document.querySelector("#pattern");
    const flags = document.querySelector("#flags");
    const input = document.querySelector("#input");
    const results = document.querySelector("#results");
    const error = document.querySelector("#error");
    const count = document.querySelector("#count");
    const explain = document.querySelector("#explain");

    function explainRegex(value) {
      const rules = {
        "\\\\d": "Matches any digit (0-9)",
        "\\\\w": "Matches word characters",
        "+": "Requires one or more repetitions",
        "*": "Allows zero or more repetitions",
        "^": "Start of line/input anchor",
        "$": "End of line/input anchor",
        "(?<": "Named capture group"
      };

      explain.innerHTML = "";

      Object.keys(rules)
        .filter(x => value.includes(x))
        .forEach(x => {
          explain.innerHTML += \`
            <div>
              <span class="token">\${x}</span> - \${rules[x]}
            </div>
          \`;
        });

      if (!explain.innerHTML) {
        explain.innerHTML = "ℹ No special tokens detected";
      }
    }

    function run() {
      results.innerHTML = "";
      error.classList.add("hidden");

      try {
        let combinedFlags = flags.value;
        if (!combinedFlags.includes("g")) combinedFlags += "g";
        if (!combinedFlags.includes("m")) combinedFlags += "m";

        const regex = new RegExp(pattern.value, combinedFlags);
        let matches = [];
        let m;

        while ((m = regex.exec(input.value)) !== null) {
          matches.push(m);
          if (m[0] === "") {
            regex.lastIndex++;
          }
          if (matches.length > 100) break;
        }

        count.innerText = \`\${matches.length} match\${matches.length === 1 ? "" : "es"}\`;

        if (!matches.length) {
          results.innerHTML = \`<div class="text-yellow-400">No matches found</div>\`;
          return;
        }

        matches.forEach((m, i) => {
          results.innerHTML += \`
            <div class="bg-slate-950 border border-slate-800 rounded-lg p-4">
              <div class="text-green-400">✓ Match #\${i + 1}</div>
              <div class="mt-2">Value: <b>\${m[0]}</b></div>
              <div class="text-xs text-slate-500">Index: \${m.index}</div>
              \${m.slice(1).map((g, n) => \`
                <div class="text-cyan-400 pl-2 border-l border-slate-800 mt-1 text-xs">
                  Group \${n + 1}: \${g !== undefined ? g : 'undefined'}
                </div>
              \`).join("")}
            </div>
          \`;
        });

        explainRegex(pattern.value);
      } catch (e) {
        error.classList.remove("hidden");
        error.innerHTML = \`
          <strong>Invalid Regex</strong><br>
          \${e.message}<br><br>
          Tip: Check brackets (), [], {}, and flags.
        \`;
        count.innerText = "error";
      }
    }

    [pattern, flags, input].forEach(x => x.addEventListener("input", run));
    run();
`;

// --- Static Pure HTML Template ---
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>exp-gen Regex Simulator</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: "JetBrains Mono", "Fira Code", monospace; }
    textarea, input { outline: none; }
    .glow { box-shadow: 0 0 25px rgba(34, 211, 238, .15); }
    .token { padding: 4px 8px; border-radius: 6px; background: #1e293b; color: #38bdf8; font-size: 12px; }
    .flag-token { padding: 2px 6px; border-radius: 4px; background: #2e1065; color: #c084fc; font-size: 11px; font-weight: bold; }
  </style>
</head>
<body class="bg-[#020617] text-slate-200 min-h-screen">
  <header class="p-5 border-b border-slate-800 bg-[#0f172a] flex justify-between">
    <div>
      <h1 class="text-xl font-bold text-cyan-400">🚀 exp-gen Regex Simulator</h1>
      <p class="text-xs text-slate-400">Interactive JavaScript Regex Debugger</p>
    </div>
    <div class="text-xs text-slate-500">CLI Powered Tool</div>
  </header>

  <main class="grid lg:grid-cols-2 gap-5 p-5">
    <section class="space-y-5">
      <div class="bg-[#0f172a] border border-slate-800 rounded-xl p-5 glow">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <h2 class="text-sm text-slate-400">REGEX PATTERN & FLAGS</h2>
          
          <div class="flex flex-wrap gap-1.5 items-center">
            <span class="text-[11px] text-slate-500 mr-1">Flags:</span>
            <span class="flag-token" title="Global: Find all matches">g → global</span>
            <span class="flag-token" title="Multiline: ^ and $ match line boundaries">m → multiline</span>
            <span class="flag-token" title="Insensitive: Case-blind matching">i → insensitive</span>
            <span class="flag-token" title="Single-line: Dot matches newline">s → dotAll</span>
          </div>
        </div>
        
        <div class="flex">
          <span class="bg-slate-900 px-3 py-3 text-cyan-400">/</span>
          <input id="pattern" class="flex-1 bg-slate-950 p-3 font-mono" value="(?&lt;name&gt;\\w+)-(\\d+)">
          <span class="bg-slate-900 px-3 py-3 text-cyan-400">/</span>
          <input id="flags" class="w-20 bg-slate-950 p-3 text-purple-400 font-bold tracking-wide placeholder-slate-700" value="m" placeholder="flags">
        </div>
        <div id="error" class="hidden mt-3 bg-red-950 border border-red-900 text-red-300 p-3 rounded-lg text-xs"></div>
      </div>

      <div class="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
        <h2 class="text-sm text-slate-400 mb-3">TEST STRING</h2>
        <textarea id="input" class="w-full h-52 bg-slate-950 rounded-lg p-4 font-mono">hello-123\nworld-456\nbad-value\nMadhusha@gmail.com\nmadushaprasad21@gmail.com</textarea>
      </div>

      <div class="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
        <h2 class="text-sm text-slate-400 mb-3">COMMON RULES</h2>
        <div class="flex flex-wrap gap-2">
          <span class="token">\\d → number</span>
          <span class="token">\\w → word</span>
          <span class="token">+ → repeat</span>
          <span class="token">* → optional</span>
          <span class="token">^ → start</span>
          <span class="token">$ → end</span>
          <span class="token">() → group</span>
        </div>
      </div>
    </section>

    <section class="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
      <div class="flex justify-between">
        <h2 class="text-sm text-slate-400">MATCH RESULTS</h2>
        <span id="count" class="text-xs text-green-400">0 matches</span>
      </div>
      <div id="results" class="mt-5 space-y-3"></div>

      <div class="mt-5 border-t border-slate-800 pt-5">
        <h2 class="text-sm text-slate-400 mb-3">PATTERN EXPLANATION</h2>
        <div id="explain" class="text-xs text-slate-300 space-y-2"></div>
      </div>
    </section>
  </main>

  <script>${clientScript}</script>
</body>
</html>
`;

export async function runRegexSimulator() {
  console.clear();

  // Native HTTP Server Setup
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlContent);
  });

  const port = await findAvailablePort(4000);

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      p.outro(pc.green("✔ Regex simulator environment started"));
      // Print a clean visual card in the terminal console
      // Pixel-perfect console dashboard card
      console.log(
        pc.cyan(
          "┌──────────────────────────────────────────────────────────────┐"
        )
      );
      console.log(
        `${pc.cyan("│")}  🔬 ${pc.bold("Live Regex Simulator Environment Active")}`
      );
      console.log(`${pc.cyan("│")}`);
      console.log(
        `${pc.cyan("│")}  ${pc.dim("Portal URL:")}  ${pc.underline(pc.yellow(url.padEnd(38)))}`
      );
      console.log(`${pc.cyan("│")}`);
      console.log(
        `${pc.cyan("│")}  ${pc.dim("Control:")}     Press ${pc.inverse(pc.bold(" Ctrl + C "))} to terminate server`
      );
      console.log(
        pc.cyan(
          "└──────────────────────────────────────────────────────────────┘\n"
        )
      );
      openBrowser(url);
      resolve();
    });
  });

  return new Promise(() => {});
}

/**
 * 释放指定 TCP 监听端口（Windows 上须在 API 即将 bind 前调用）。
 * 用法：node scripts/kill-listen-port.mjs 4000
 */
import { execSync } from "node:child_process";

const port = process.argv[2]?.trim() || "4000";

function listListeningPidsWindows() {
  const ps = [
    `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue`,
    "| Select-Object -ExpandProperty OwningProcess -Unique",
  ].join(" ");
  try {
    const out = execSync(`powershell -NoProfile -Command "${ps}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\d+$/.test(line));
  } catch {
    return listListeningPidsNetstat();
  }
}

/** netstat 回退；端口须为 `:4000` 后接空白，避免误杀 `:40001`。 */
function listListeningPidsNetstat() {
  let out = "";
  try {
    out = execSync("netstat -ano", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return [];
  }

  const portRe = new RegExp(`:${port}(\\s|$)`);
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line) || !portRe.test(line)) {
      continue;
    }
    const parts = line.trim().split(/\s+/);
    const pid = parts.at(-1);
    if (pid && /^\d+$/.test(pid) && pid !== "0") {
      pids.add(pid);
    }
  }
  return [...pids];
}

function killPid(pid) {
  if (process.platform === "win32") {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
  } else {
    execSync(`kill -9 ${pid}`, { stdio: "ignore" });
  }
}

function killOnWindows() {
  const pids = listListeningPidsWindows();
  for (const pid of pids) {
    try {
      killPid(pid);
      console.log(`Killed PID ${pid} on port ${port}`);
    } catch {
      /* already exited */
    }
  }
}

function killWithKillPort() {
  execSync(`npx --yes kill-port ${port}`, { stdio: "inherit" });
}

if (process.platform === "win32") {
  killOnWindows();
} else {
  killWithKillPort();
}

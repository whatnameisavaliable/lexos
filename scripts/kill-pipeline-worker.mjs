/**
 * 结束其它 pipeline worker 进程，避免旧代码实例继续消费 Outbox。
 * 用法：node scripts/kill-pipeline-worker.mjs
 */
import { execSync } from "node:child_process";

function listPipelineWorkerPidsWindows() {
  const ps = [
    "Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\"",
    "| Where-Object {",
    "    $_.CommandLine -match 'worker-pipeline'",
    "    -or $_.CommandLine -match 'workers\\\\pipeline'",
    "    -or ($_.CommandLine -match 'tsx' -and $_.CommandLine -match 'pipeline')",
    "  }",
    "| Select-Object -ExpandProperty ProcessId",
  ].join(" ");
  try {
    const out = execSync(`powershell -NoProfile -Command "${ps}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\d+$/.test(line))
      .filter((pid) => pid !== String(process.pid));
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (process.platform === "win32") {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
  } else {
    execSync(`kill -9 ${pid}`, { stdio: "ignore" });
  }
}

const currentPid = process.ppid;
const pids = listPipelineWorkerPidsWindows().filter(
  (pid) => pid !== String(currentPid),
);

for (const pid of pids) {
  try {
    killPid(pid);
    console.log(`Killed pipeline worker PID ${pid}`);
  } catch {
    /* already exited */
  }
}

if (pids.length === 0) {
  console.log("No other pipeline worker process found");
}

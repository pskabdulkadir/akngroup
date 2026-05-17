import cron from "node-cron";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function initDatabaseBackupScheduler() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("Backup scheduler disabled: MONGO_URI/MONGODB_URI is not set");
    return;
  }

  const backupsDir = path.join(process.cwd(), "backups");
  ensureDir(backupsDir);

  // Run every day at 03:00
  cron.schedule("0 3 * * *", () => {
    try {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .replace("Z", "");
      const outDir = path.join(backupsDir, timestamp);
      ensureDir(outDir);

      const cmd = `mongodump --uri=\"${mongoUri}\" --out=\"${outDir}\"`;
      console.log(`\u23F0 Running scheduled backup: ${cmd}`);

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("\u274C Backup failed:", error.message);
          if (stderr) console.error("Backup stderr:", stderr);
          return;
        }
        if (stdout) console.log("Backup output:", stdout.trim());
        console.log(`\u2705 Backup completed: ${outDir}`);
      });
    } catch (e) {
      console.error("Backup scheduler error:", e);
    }
  });

  console.log("\u23F3 Daily backup scheduler initialized (03:00)");
}

const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");

/**
 * Solves a captcha image perfectly using a local python CNN execution.
 * @param {string} imageFileName - The name or relative path of the image to solve.
 * @param {number} timeoutMs - Max execution time before failing. default 5000ms.
 * @returns {Promise<string>} The cracked captcha text.
 */
async function solveCaptcha(imageFileName, timeoutMs = 10000) {
  return new Promise(async (resolve, reject) => {
    try {
      const imagePath = path.isAbsolute(imageFileName) 
        ? imageFileName 
        : path.join(__dirname, imageFileName);

      // Verify input image exists
      try {
        await fs.access(imagePath);
      } catch (err) {
        return reject(new Error(`Image file not found: ${imagePath}`));
      }

      // Determine local virtual environment python executable
      const isWin = process.platform === "win32";
      const pythonExecutable = isWin
        ? path.join(__dirname, ".venv", "Scripts", "python.exe")
        : path.join(__dirname, ".venv", "bin", "python");

      // Verify the local virtual environment was set up
      try {
        await fs.access(pythonExecutable);
      } catch (err) {
        return reject(
          new Error("Python virtual environment not found. Please run 'npm run setup' first.")
        );
      }

      const pythonScript = path.join(__dirname, "solve.py");

      // Spawn using absolute target strings to prevent injection.
      const child = spawn(pythonExecutable, [pythonScript, imagePath], {
        windowsHide: true,
      });

      let stdoutData = "";
      let stderrData = "";

      // Ensure no hanging
      const timeoutId = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`Captcha solver timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      child.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      child.on("close", (code) => {
        clearTimeout(timeoutId);

        const lines = stdoutData.split("\n").map(l => l.trim()).filter(Boolean);
        const lastLine = lines[lines.length - 1] || "";

        if (lastLine.startsWith("SUCCESS:")) {
          return resolve(lastLine.split("SUCCESS:")[1]);
        } 
        
        if (lastLine === "ERROR_MISSING_DEPENDENCY") {
          return reject(
            new Error("Dependency missing. Please run 'npm run setup'.")
          );
        }

        reject(
          new Error(
            `Python Solver exited with code ${code}.\nStdout: ${stdoutData.trim()}\nStderr: ${stderrData.trim()}`
          )
        );
      });

      child.on("error", (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to start python process: ${error.message}`));
      });

    } catch (e) {
      reject(e);
    }
  });
}

module.exports = solveCaptcha;
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const outputPath = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

const TIMEOUT_MS = 5000;

const executeCpp = async (filePath, inputFilePath) => {
    const jobId = path.basename(filePath).split('.')[0];
    const outPath = path.join(outputPath, `${jobId}.exe`);

    return new Promise((resolve, reject) => {
        const proc = exec(
            `g++ "${filePath}" -o "${outPath}" && "${outPath}" < "${inputFilePath}"`,
            { timeout: TIMEOUT_MS },
            (error, stdout, stderr) => {
                if (error) {
                    if (error.killed || error.signal === 'SIGTERM' || error.signal === 'SIGKILL' || error.code === null) {
                        return reject(new Error('Time Limit Exceeded'));
                    }
                    return reject(new Error(stderr || error.message));
                }
                if (stderr) return reject(new Error(stderr));
                resolve(stdout);
            }
        );
    });
};

module.exports = executeCpp;

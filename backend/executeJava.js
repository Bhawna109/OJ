const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const outputPath = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

const TIMEOUT_MS = 5000;

const executeJava = async (filePath, inputFilePath) => {
    const jobId = path.basename(filePath).split('.')[0];
    const jobDir = path.join(outputPath, jobId);
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });

    const mainJavaPath = path.join(jobDir, 'Main.java');
    fs.copyFileSync(filePath, mainJavaPath);

    return new Promise((resolve, reject) => {
        exec(
            `javac "${mainJavaPath}" && java -cp "${jobDir}" Main < "${inputFilePath}"`,
            { timeout: TIMEOUT_MS },
            (error, stdout, stderr) => {
                if (error) {
                    if (error.killed || error.signal === 'SIGTERM' || error.signal === 'SIGKILL' || error.code === null) {
                        return reject(new Error('Time Limit Exceeded'));
                    }
                    return reject(new Error(stderr || error.message));
                }
                resolve(stdout);
            }
        );
    });
};

module.exports = executeJava;

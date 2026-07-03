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
        exec(`javac "${mainJavaPath}" 2>&1`, (compileError, _, compileStderr) => {
            if (compileError) {
                return reject(new Error('COMPILE_ERROR:' + (compileStderr || compileError.message)));
            }
            exec(`java -cp "${jobDir}" Main < "${inputFilePath}"`, { timeout: TIMEOUT_MS }, (runError, stdout, stderr) => {
                if (runError) {
                    if (runError.killed || runError.signal === 'SIGTERM' || runError.signal === 'SIGKILL')
                        return reject(new Error('Time Limit Exceeded'));
                    if (stderr && (stderr.includes('OutOfMemoryError') || stderr.includes('Cannot allocate memory')))
                        return reject(new Error('Memory Limit Exceeded'));
                    return reject(new Error('RUNTIME_ERROR:' + (stderr || runError.message)));
                }
                resolve(stdout);
            });
        });
    });
};

module.exports = executeJava;

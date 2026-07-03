const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const outputPath = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

const TIMEOUT_MS = 5000;

const executeCpp = async (filePath, inputFilePath) => {
    const jobId = path.basename(filePath).split('.')[0];
    const outPath = path.join(outputPath, `${jobId}.out`);

    return new Promise((resolve, reject) => {
        exec(`g++ "${filePath}" -o "${outPath}" 2>&1`, (compileError, _, compileStderr) => {
            if (compileError) {
                return reject(new Error('COMPILE_ERROR:' + (compileStderr || compileError.message)));
            }
            exec(`"${outPath}" < "${inputFilePath}"`, { timeout: TIMEOUT_MS }, (runError, stdout, stderr) => {
                if (runError) {
                    if (runError.killed || runError.signal === 'SIGTERM' || runError.signal === 'SIGKILL')
                        return reject(new Error('Time Limit Exceeded'));
                    if (stderr && (stderr.includes('bad_alloc') || stderr.includes('Cannot allocate memory')))
                        return reject(new Error('Memory Limit Exceeded'));
                    return reject(new Error('RUNTIME_ERROR:' + (stderr || runError.message)));
                }
                resolve(stdout);
            });
        });
    });
};

module.exports = executeCpp;

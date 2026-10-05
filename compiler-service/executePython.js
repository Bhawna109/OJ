const { exec } = require('child_process');

const TIMEOUT_MS = 5000;

const executePython = async (filePath, inputFilePath) => {
    return new Promise((resolve, reject) => {
        exec(`sh -c 'ulimit -v 262144 && python3 "${filePath}" < "${inputFilePath}"'`, { timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
            if (error) {
                if (stderr && (stderr.includes('MemoryError') || stderr.includes('Cannot allocate memory')))
                    return reject(new Error('Memory Limit Exceeded'));
                if (error.killed || error.signal === 'SIGTERM' || error.signal === 'SIGKILL')
                    return reject(new Error('Time Limit Exceeded'));
                if (stderr && (stderr.includes('SyntaxError') || stderr.includes('IndentationError')))
                    return reject(new Error('COMPILE_ERROR:' + stderr));
                return reject(new Error('RUNTIME_ERROR:' + (stderr || error.message)));
            }
            resolve(stdout);
        });
    });
};

module.exports = executePython;

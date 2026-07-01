const { exec } = require('child_process');

const TIMEOUT_MS = 5000;

const executePython = async (filePath, inputFilePath) => {
    return new Promise((resolve, reject) => {
        exec(
            `python3 "${filePath}" < "${inputFilePath}"`,
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

module.exports = executePython;

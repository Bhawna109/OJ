const { exec } = require('child_process');

const executePython = async (filePath, inputFilePath) => {
    return new Promise((resolve, reject) => {
        exec(`python "${filePath}" < "${inputFilePath}"`,
            (error, stdout, stderr) => {
                if (error) return reject(error);
                if (stderr) return reject(new Error(stderr));
                resolve(stdout);
            }
        );
    });
};

module.exports = executePython;

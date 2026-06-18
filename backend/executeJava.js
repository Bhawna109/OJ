const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const outputPath = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

const executeJava = async (filePath, inputFilePath) => {
    const jobId = path.basename(filePath).split('.')[0];
    const jobDir = path.join(outputPath, jobId);

    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });

    const mainJavaPath = path.join(jobDir, 'Main.java');
    fs.copyFileSync(filePath, mainJavaPath);

    return new Promise((resolve, reject) => {
        exec(`javac "${mainJavaPath}" && java -cp "${jobDir}" Main < "${inputFilePath}"`,
            (error, stdout, stderr) => {
                if (error) return reject(new Error(stderr || error.message));
                resolve(stdout);
            }
        );
    });
};

module.exports = executeJava;

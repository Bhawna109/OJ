const fs = require('fs')
const path = require('path')
const { exec } = require('child_process');

const outputPath =  path.join(__dirname, 'outputs');
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
}

const executeCpp = async (filePath, inputFilePath) => {
    const jobId= path.basename(filePath).split(".")[0]; 
    const outPath = path.join(outputPath, `${jobId}.exe`);

    return new Promise((resolve, reject) => {
        exec(`g++ "${filePath}" -o "${outPath}" && "${outPath}" < "${inputFilePath}"`,
             (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }if (stderr) {
                    reject(stderr);
                } 
                    resolve(stdout);
                });
    });
}
module.exports = executeCpp;
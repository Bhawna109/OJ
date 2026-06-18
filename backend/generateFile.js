const fs = require('fs')
const path = require('path')
const { v4: uuidv4} = require('uuid')

const dirCodes =  path.join(__dirname, 'codes');
if (!fs.existsSync(dirCodes)) {
    fs.mkdirSync(dirCodes);
}

const generateFile = (language, code) => {
    const jobID = uuidv4();
    const filename = `${jobID}.${language}`;
    const filePath = path.join(dirCodes, filename);
    fs.writeFileSync(filePath, code);
    return filePath;
};
exports = module.exports = generateFile;    
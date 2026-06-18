const fs = require('fs')
const path = require('path')
const { v4: uuidv4} = require('uuid')

const dirInputs =  path.join(__dirname, 'inputs');
if (!fs.existsSync(dirInputs)) {
    fs.mkdirSync(dirInputs);
}


const generateinputFile = (input) => {
    const jobID = uuidv4();
    const inputFilename = `${jobID}.txt`;
    const inputFilePath = path.join(dirInputs, inputFilename);
    fs.writeFileSync(inputFilePath, input);
    return inputFilePath;
};

module.exports = generateinputFile;
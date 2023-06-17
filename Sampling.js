
const fs = require('fs');

const inputFilePath = 'tp.txt';
const outputFilePath = 'TstData.txt';

// Open the input file and read all of its contents
fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    // Split the input file into an array of individual lines
    const lines = data.split('\n');

    // Get a random subset of the lines
    const sampleSize = 32;
    const sampleLines = [];
    while (sampleLines.length < sampleSize) {
        const index = Math.floor(Math.random() * lines.length);
        sampleLines.push(lines[index]);
    }

    // Write the sample lines to the output file
    fs.writeFile(outputFilePath, sampleLines.join('\n'), err => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Wrote ${sampleLines.length} lines to ${outputFilePath}`);
    });
});
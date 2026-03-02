const pdf = require('pdf-parse');

const buffer = Buffer.from('PDF-1.4 ... dummy content ...');

async function test() {
    try {
        console.log("Attempting to parse...");
        const data = await pdf(buffer);
        console.log("Parsed:", data.text);
    } catch (e) {
        console.error("Error parsing:", e);
    }
}

test();

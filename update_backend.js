const fs = require('fs');
const path = '/home/andrade/.gemini/antigravity/brain/7f7cc114-83cd-4082-b85d-c0df3d64a537/server/index.js';
let content = fs.readFileSync(path, 'utf8');

// We use a simplified replacement to avoid whitespace issues, searching for the unique lines
const newConfig = `const pool = new Pool({
  user: process.env.POSTGRES_USER || 'finance_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'finance_app',
  password: process.env.POSTGRES_PASSWORD || 'secure_password_123',
  port: process.env.POSTGRES_PORT || 5432,
});`;

// Regex to match the old object
const regex = /const pool = new Pool\(\{\s+user: 'finance_user',\s+host: 'localhost',\s+database: 'finance_app',\s+password: 'secure_password_123',\s+port: 5432,\s+\}\);/;

if (regex.test(content)) {
    content = content.replace(regex, newConfig);
    fs.writeFileSync(path, content);
    console.log('Updated server/index.js');
} else {
    console.log('Regex did not match config, trying string replacement');
    const oldConfig = `const pool = new Pool({
  user: 'finance_user',
  host: 'localhost',
  database: 'finance_app',
  password: 'secure_password_123',
  port: 5432,
});`;
    if (content.includes(oldConfig)) {
        content = content.replace(oldConfig, newConfig);
        fs.writeFileSync(path, content);
        console.log('Updated server/index.js via string match');
    } else {
        console.error('Could not find config block in server/index.js');
        // print a snippet to debug
        console.log('Content snippet:', content.substring(content.indexOf('const pool ='), content.indexOf('const pool =') + 200));
        process.exit(1);
    }
}

const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
`;
fs.writeFileSync('/home/andrade/.gemini/antigravity/brain/7f7cc114-83cd-4082-b85d-c0df3d64a537/server/Dockerfile', dockerfile);
console.log('Created server/Dockerfile');

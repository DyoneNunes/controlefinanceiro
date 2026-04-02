const fs = require('fs');
const authPath = '/home/andrade/.gemini/antigravity/brain/7f7cc114-83cd-4082-b85d-c0df3d64a537/src/context/AuthContext.tsx';
const finPath = '/home/andrade/.gemini/antigravity/brain/7f7cc114-83cd-4082-b85d-c0df3d64a537/src/context/FinanceContext.tsx';

// Update AuthContext
let authContent = fs.readFileSync(authPath, 'utf8');
const oldAuthUrl = "const API_URL = 'http://localhost:3000/api';";
const newAuthUrl = "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';";

if (authContent.includes(oldAuthUrl)) {
    authContent = authContent.replace(oldAuthUrl, newAuthUrl);
    fs.writeFileSync(authPath, authContent);
    console.log('Updated AuthContext.tsx');
} else {
    console.log('Could not match API_URL in AuthContext.tsx');
}

// Update FinanceContext
let finContent = fs.readFileSync(finPath, 'utf8');
if (finContent.includes(oldAuthUrl)) {
    finContent = finContent.replace(oldAuthUrl, newAuthUrl);
    fs.writeFileSync(finPath, finContent);
    console.log('Updated FinanceContext.tsx');
} else {
    console.log('Could not match API_URL in FinanceContext.tsx');
}

// Create Dockerfile
const dockerfile = `FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
fs.writeFileSync('/home/andrade/.gemini/antigravity/brain/7f7cc114-83cd-4082-b85d-c0df3d64a537/Dockerfile', dockerfile);
console.log('Created Frontend Dockerfile');

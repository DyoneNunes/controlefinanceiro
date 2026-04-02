const fs = require('fs');
const path = 'src/utils/security.ts';
let content = fs.readFileSync(path, 'utf8');

const oldKey = "const SECRET_KEY =new TextEncoder().encode(\n  'super-secure-secret-key-that-users-should-not-see' // In production, this comes from ENV\n);";
const newKey = "const SECRET_KEY = new TextEncoder().encode(\n  import.meta.env.VITE_JWT_SECRET || 'default-dev-secret'\n);";

if (content.includes("super-secure-secret-key")) {
    // We use a broader replacement just in case of whitespace
    const regex = /const SECRET_KEY =[\s\n]+new TextEncoder\(\)\.encode\(\n\s+'super-secure-secret-key-that-users-should-not-see' \/\/ In production, this comes from ENV\n\);/m;
    if (regex.test(content)) {
        content = content.replace(regex, newKey);
    } else {
        // Fallback exact replace if regex fails due to minor difference
        content = content.replace("const SECRET_KEY =new TextEncoder().encode(\n  'super-secure-secret-key-that-users-should-not-see' // In production, this comes from ENV\n);", newKey);
    }
    fs.writeFileSync(path, content);
    console.log('Updated src/utils/security.ts');
} else {
    console.log('src/utils/security.ts already updated or not matching');
}

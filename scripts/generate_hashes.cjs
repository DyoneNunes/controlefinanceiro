const bcrypt = require('bcryptjs');

const p1 = 'Andrade1312@';
const p2 = 'ferreira1808@';

const hash1 = bcrypt.hashSync(p1, 10);
const hash2 = bcrypt.hashSync(p2, 10);

console.log('Hash 1:', hash1);
console.log('Hash 2:', hash2);

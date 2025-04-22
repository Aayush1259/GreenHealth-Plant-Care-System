const selfsigned = require('selfsigned');
const fs = require('fs');

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

fs.writeFileSync('localhost.crt', pems.cert);
fs.writeFileSync('localhost.key', pems.private);

console.log('Self-signed certificate generated successfully.'); 
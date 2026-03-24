import fs from 'fs';

const content = fs.readFileSync('data.json', 'utf8');
const index = content.indexOf('  "shifts": []');
if (index !== -1) {
  const fixed = content.substring(0, index) + '  ],\n  "shifts": []\n}\n';
  fs.writeFileSync('data.json', fixed);
  console.log('Fixed data.json');
} else {
  console.log('Could not find the target string');
}

#!/usr/bin/env node

const { writeFile, readFile, readFileSync } = require('fs');
const pkg = JSON.parse(readFileSync('./package.json')),
  current_version =  pkg.version,
  date = new Date(),
  new_major = date.getFullYear(),
  new_minor = String(date.getMonth() + 1),
  major_minor = `${new_major}.${new_minor}`;

let [major, minor, patch] = current_version.split('.');

if (major_minor !== `${major}.${minor}`) {
  patch = 0;
} else {
  patch++;
}

const new_version = `${major_minor}.${patch}`;

console.log('Updating version: ', current_version, '=>', new_version);

['./package.json', 'src/browser-specific/chrome/manifest.json', 'src/browser-specific/firefox/manifest.json'].forEach(path => {
  readFile(path, (error, data) => {
    if (error) {
      console.log(error);
      return;
    }
    const parsedData = JSON.parse(data);
    parsedData.version = new_version;
    writeFile(path, JSON.stringify(parsedData, null, 2), (err) => {
      if (err) {
        console.log(`Failed to write version to ${path}`);
        return;
      }
      console.log(`Updated ${path} successfully`);
    });
  });
});

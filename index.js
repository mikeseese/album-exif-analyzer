#!/usr/bin/env node

const exif = require("fast-exif");
const readdirp = require("readdirp");
const fs = require("fs");

const filestream = readdirp(process.cwd(), {
  fileFilter: ["*.png", "*.jpg", "*.jpeg", "*.cr2"],
  depth: 50,
});

let gotHeader = false;
const separator = "|";

const outputFile = `${Date.now()}-album-exif-analyzer.csv`;
let header = "";
let exifData;
let numProcessing = 0;

filestream.on("end", async () => {
  while (numProcessing > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  if (header && exifData.length > 0) {
    fs.writeFileSync(outputFile, header);
    let s = "";
    for (let i = 0; i < exifData[0].length; i++) {
      for (let j = 0; j < exifData.length; j++) {
        if (j > 0) {
          s += separator;
        }
        if (Buffer.isBuffer(exifData[j][i])) {
          s += exifData[j][i].toString("hex");
        } else {
          s += exifData[j][i].toString();
        }
      }
      s += "\n";
    }
    fs.appendFileSync(outputFile, s);
    console.log(`Wrote data to ${outputFile}`);
  } else {
    console.log("No data found");
  }
  process.exit();
});

filestream.on("data", async (entry) => {
  numProcessing++;
  let data;
  try {
    data = await exif.read(entry.path);
  } catch (e) {
    numProcessing--;
    return;
  }
  if (data === null) {
    numProcessing--;
    return;
  }

  const exifKeys = Object.keys(data.exif).sort();

  if (!gotHeader) {
    gotHeader = true;
    header = exifKeys.join(separator) + "\n";
    exifData = Array(exifKeys.length);
    for (let i = 0; i < exifKeys.length; i++) {
      exifData[i] = [];
    }
  }

  for (let i = 0; i < exifKeys.length; i++) {
    exifData[i].push(data.exif[exifKeys[i]]);
  }
  numProcessing--;
});

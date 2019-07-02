const exif = require("fast-exif");
const readdirp = require("readdirp");
const fs = require("fs");

const filestream = readdirp(".", {
  fileFilter: ["*.png", "*.jpg", "*.jpeg", "*.cr2"],
  depth: 50,
});

let gotHeader = false;
const separator = "|";

const outputFile = "output.csv";
let header = "";
let exifData;

filestream.on("end", () => {
  console.log(header);
  console.log(exifData);
  fs.writeFileSync(outputFile, header);
  let s = "";
  for (let i = 0; i < exifData[0].length; i++) {
    for (let j = 0; j < exifData.length; j++) {
      if (j > 0) {
        s += separator;
      }
      s += exifData[j][i].toString();
    }
    s += "\n";
  }
  fs.appendFileSync(outputFile, s);
  process.exit();
});

filestream.on("data", async (entry) => {
  const data = await exif.read(entry.path);
  if (data === null) {
    return;
  }

  const exifKeys = Object.keys(data.exif).sort();

  if (!gotHeader) {
    gotHeader = true;
    header = exifKeys.join(separator) + "\n";
    console.log("here");
    exifData = Array(exifKeys.length);
    for (let i = 0; i < exifKeys.length; i++) {
      exifData[i] = [];
    }
  }

  for (let i = 0; i < exifKeys.length; i++) {
    exifData[i].push(data.exif[exifKeys[i]]);
  }
});

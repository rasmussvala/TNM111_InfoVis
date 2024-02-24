const express = require("express");
const fs = require("fs");

const app = express();

const imageDir = "public/images"; // Specify your image directory here

app.get("/images", (req, res) => {
  fs.readdir(imageDir, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    const imageDict = {};
    files.forEach((file) => {
      imageDict[file] = `/images/${file}`;
    });
    res.json(imageDict);
  });
});

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

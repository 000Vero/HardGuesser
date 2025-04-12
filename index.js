import { log } from "console";
import { randomInt } from "crypto";
import express from "express";
import fs from "fs";

const app = express();
const port = 3000;

const wordFile = fs.readFileSync("wordlist.txt", "utf8");
const wordList = wordFile.split("\n");
const upperBound = wordList.length - 1;
log("Loaded word list");


/* ===== SETUP ===== */

app.set("view engine", "ejs");

app.set("views", "./views");

app.use(express.static("./static"));

app.use(express.json());

/* ===== ROUTES ===== */

app.get("/randomword", (req, res) => {
  let word = wordList[randomInt(upperBound)];
  res.send(word);
});

app.get("/", (req, res) => {
  res.render("home");
});

// Start server
app.listen(port);
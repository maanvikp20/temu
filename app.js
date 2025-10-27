import express from "express";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.static(path.join(__dirname, "public")));

const dataPath = path.join(__dirname, "data", "sample.json");
const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

app.get("/", (req, res) => {
  res.render("index", {
    title: "EJS Layout Starter",
    items: jsonData.items,
  });
});

app.get("/about", (req, res) => {
  res.render("index", {
    title: "About This Project",
    items: [],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

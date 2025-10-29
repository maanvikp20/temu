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

const dataPath = path.join(__dirname, "data", "products.json");
const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

app.get("/", (req, res) => {
  res.render("index", {
    title: "Temu Tech Store",
    items: jsonData.items,
  });
});

app.get("/bestsellers", (req, res) => {
  res.render("bestsellers", {
    title: "Best-Selling Items",
    items: jsonData.items.filter(item => item.isBestSeller),
  });
});

app.get("/fivestaritems", (req, res) => {
  res.render("fivestaritems", {
    title: "Five Star Items",
    items: jsonData.items.filter(item => item.rating === 5),
  });
});

app.get("/earlyblackfriday", (req, res) => {
  res.render("earlyblackfriday", {
    title: "Early Black Friday Deals",
    items: jsonData.items.filter(item => item.price < 50 && item.inStock && item.blackFridayDeal === true),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

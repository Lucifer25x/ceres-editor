const fs = require("fs");
const path = require("path");
const list = document.getElementById("list");

let themeList = fs.readdirSync(
  path.join(path.dirname(__dirname), "node_modules", "brace", "theme")
);

for (let i = 0; i < themeList.length; i++) {
  let li = document.createElement("li");
  li.innerText = themeList[i].slice(0, themeList[i].indexOf("."));
  list.appendChild(li);
}

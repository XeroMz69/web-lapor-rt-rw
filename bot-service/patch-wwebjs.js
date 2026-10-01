const fs = require("fs");
const path = require("path");

const targetFile = path.join(
  __dirname,
  "node_modules/whatsapp-web.js/src/util/Injected/Utils.js"
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf8");
  if (!content.includes("delete message.__x_id;")) {
    content = content.replace(
      /(\.\.\.extraOptions,\s*\n\s*\};)/,
      "$1\n\n        delete message.__x_id;"
    );
    fs.writeFileSync(targetFile, content, "utf8");
    console.log("[patch-wwebjs] Applied delete message.__x_id patch successfully.");
  }
}

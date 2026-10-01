const fs = require("fs");
const path = require("path");

// 1. Patch Utils.js for sendMessage media bug
const utilsFile = path.join(
  __dirname,
  "node_modules/whatsapp-web.js/src/util/Injected/Utils.js"
);

if (fs.existsSync(utilsFile)) {
  let content = fs.readFileSync(utilsFile, "utf8");
  if (!content.includes("delete message.__x_id;")) {
    content = content.replace(
      /(\.\.\.extraOptions,\s*\n\s*\};)/,
      "$1\n\n        delete message.__x_id;"
    );
    fs.writeFileSync(utilsFile, content, "utf8");
    console.log("[patch-wwebjs] Applied delete message.__x_id patch successfully.");
  }
}

// 2. Patch Message.js for downloadMedia mimetype & LID bug
const messageFile = path.join(
  __dirname,
  "node_modules/whatsapp-web.js/src/structures/Message.js"
);

if (fs.existsSync(messageFile)) {
  let content = fs.readFileSync(messageFile, "utf8");
  let modified = false;

  // Add mimetype: msg.mimetype to downloadAndMaybeDecrypt
  if (!content.includes("mimetype: msg.mimetype,")) {
    content = content.replace(
      /(type:\s*msg\.type,)/,
      "$1\n                        mimetype: msg.mimetype,"
    );
    modified = true;
  }

  // Support LID message key resolution
  if (!content.includes("const msgKey =")) {
    content = content.replace(
      /async downloadMedia\(\) \{[\s\S]*?const result = await this\.client\.pupPage\.evaluate\(async \(msgId\) => \{[\s\S]*?const msg =[\s\S]*?\)\?\.messages\?\.\[0\];/,
      `async downloadMedia() {
        if (!this.hasMedia) {
            return undefined;
        }

        const msgKey =
            (this.id && this.id._serialized) ||
            (this.id && this.id.$1) ||
            (this.id && this.id.remote && this.id.id
                ? \`\${this.id.fromMe ? 'true' : 'false'}_\${this.id.remote}_\${this.id.id}\${this.author ? \`_\${this.author}\` : ''}\`
                : undefined);

        const result = await this.client.pupPage.evaluate(async (msgId, rawId) => {
            let msg = msgId
                ? window.require('WAWebCollections').Msg.get(msgId) ||
                  (
                      await window
                          .require('WAWebCollections')
                          .Msg.getMessagesById([msgId])
                  )?.messages?.[0]
                : null;

            if (!msg && rawId) {
                const candidates = [rawId._serialized, rawId.$1].filter(Boolean);
                for (const cid of candidates) {
                    try {
                        msg = window.require('WAWebCollections').Msg.get(cid) ||
                            (await window.require('WAWebCollections').Msg.getMessagesById([cid]))?.messages?.[0];
                    } catch (e) {}
                    if (msg) break;
                }
            }`
    );
    content = content.replace(
      /\}, this\.id\._serialized\);/g,
      "}, msgKey, this.id);"
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(messageFile, content, "utf8");
    console.log("[patch-wwebjs] Applied downloadMedia mimetype & LID patch successfully.");
  }
}

// 3. Patch Client.js for execution context destroyed on navigation (Issue #127082)
const clientFile = path.join(
  __dirname,
  "node_modules/whatsapp-web.js/src/Client.js"
);

if (fs.existsSync(clientFile)) {
  let content = fs.readFileSync(clientFile, "utf8");
  let modified = false;

  if (content.includes("res = await this.pupPage.evaluate(\n                'window.Debug?.VERSION != undefined',")) {
    content = content.replace(
      /let start = Date\.now\(\);[\s\S]*?if \(!res\) \{\s*throw 'auth timeout';\s*\}/,
      `try {
            await this.pupPage.waitForFunction(
                'window.Debug?.VERSION != undefined',
                { timeout: this.options.authTimeoutMs, polling: 200 }
            );
        } catch (_e) {
            throw 'auth timeout';
        }`
    );
    modified = true;
  }

  if (content.includes("res = await this.pupPage.evaluate(\n                            'window.WWebJS != undefined',")) {
    content = content.replace(
      /let start = Date\.now\(\);[\s\S]*?if \(!res\) \{\s*throw 'ready timeout';\s*\}/,
      `try {
                        await this.pupPage.waitForFunction(
                            'window.WWebJS != undefined',
                            { timeout: 30000, polling: 200 }
                        );
                    } catch (_e) {
                        throw 'ready timeout';
                    }`
    );
    modified = true;
  }

  if (content.includes("await page.goto(WhatsWebURL") && content.includes("await this.inject();\n\n        this.pupPage.on('framenavigated'")) {
    content = content.replace(
      /await this\.inject\(\);\s*this\.pupPage\.on\('framenavigated', async \(frame\) => \{[\s\S]*?await this\.inject\(\);\s*\}\);/,
      `this.pupPage.on('framenavigated', async (frame) => {
            if (frame.url().includes('post_logout=1') || this.lastLoggedOut) {
                this.emit(Events.DISCONNECTED, 'LOGOUT');
                await this.authStrategy.logout();
                await this.authStrategy.beforeBrowserInitialized();
                await this.authStrategy.afterBrowserInitialized();
                this.lastLoggedOut = false;
            }
            try {
                await this.inject();
            } catch (_err) {}
        });

        try {
            await this.inject();
        } catch (_err) {}`
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(clientFile, content, "utf8");
    console.log("[patch-wwebjs] Applied navigation resilience patch to Client.js successfully.");
  }
}

import fsOrig, { promises as fs } from "fs";
import path from "path";

import debounce from "debounce";

import { log } from "./util.js";

// Map from language IDs to language configuration objects. This is
// populated at runtime and updated asynchronously.
export let langs = {};

// Read languages from JSON files in /opt/riju/langs, and update the
// global langs variable in this module. Never throw an error. If
// there is a problem then just leave the languages as they previously
// were.
async function readLangsFromDisk() {
  try {
    const newLangs = {};
    for (const filename of await fs.readdir("/opt/riju/langs")) {
      if (path.parse(filename).ext !== ".json") {
        continue;
      }
      const id = path.parse(filename).name;
      const langConfig = JSON.parse(
        await fs.readFile(`/opt/riju/langs/${filename}`, "utf-8")
      );
      if (langConfig.id !== id) {
        log.error(
          "Language config ${filename} has mismatched language ID ${id}, ignoring"
        );
        continue;
      }
      newLangs[id] = langConfig;
    }
    log.info(
      `Loaded ${
        Object.keys(newLangs).length
      } language configuration(s) from disk`
    );
    langs = newLangs;
  } catch (err) {
    log.error("Failed to read languages from disk:", err);
  }
}

readLangsFromDisk();
fsOrig.watch("/opt/riju/langs", debounce(readLangsFromDisk, 200));
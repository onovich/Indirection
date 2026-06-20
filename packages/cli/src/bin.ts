#!/usr/bin/env node
import { runIndirectionCli } from "./index.js";

const exitCode = await runIndirectionCli(process.argv.slice(2), {
  stdout(text) {
    console.log(text);
  },
  stderr(text) {
    console.error(text);
  }
});

process.exitCode = exitCode;

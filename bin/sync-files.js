#!/usr/bin/env node

"use strict";

var minimist = require("minimist");
var updateNotifier = require("update-notifier");
var sync = require("../");

var pkg = require("../package.json");

var opts = {
  "boolean": ["help", "delete", "watch", "version", "verbose", "notify-update"],
  "alias": {
    "help": "h",
    "watch": "w",
    "verbose": "v"
  },
  "help": {
    "help": "Show help and exit",
    "delete": "Delete extraneous files from target",
    "watch": "Watch changes in source and keep target in sync",
    "version": "Show version and exit",
    "verbose": "Moar output",
    "notify-update": "Enable update notification"
  },
  "default": {
    "help": false,
    "watch": false,
    "delete": true,
    "verbose": false,
    "notify-update": true
  },
  "stopEarly": true,
  "unknown": function onUnknown (option) {
    // this function is triggered on first argument, we want to exclude this case
    if (option[0] !== "-") {
      return;
    }

    console.error("Unknown option '" + option + "'");
    help();
    process.exit(1);
  }
};

function help () {
  console.log("%s - v. %s", pkg.name, pkg.version);
  console.log(pkg.description);
  console.log("\n");
  console.log("Usage: " + pkg.name + " [options] <source> <target>");
  console.log("");
  opts.boolean.forEach(function (opt) {
    var key = "--[no-]" + opt;
    if (Array.isArray(opts.alias[opt]) && opts.alias[opt].length > 0) {
      key += ", " + opts.alias[opt].map(function (a) { return "[--no]-" + a; }).join(", ");
    } else if (opts.alias[opt]) {
      key += ", [--no]-" + opts.alias[opt];
    }
    console.log(key);
    if (opts.help[opt]) {
      console.log("\t%s", opts.help[opt]);
    }
    console.log("");
  });
}


var argv = minimist(process.argv.slice(2), opts);

if (argv._.length !== 2) {
  console.error("Expects exactly two arguments, received " + argv._.length);
  help();
  process.exit(1);
}

if (argv.help) {
  help();
  process.exit(0);
}

if (argv.version) {
  console.log(pkg.version);
  process.exit(0);
}

if (argv["notify-update"]) {
  updateNotifier({pkg: pkg}).notify();
}

sync(argv._[0], argv._[1], {
  "watch": argv.watch,
  "delete": argv.delete
}, function (event, data) {
  switch (event) {
    case "error":
      console.error(data);
      process.exit(2);
      break;
    default:
      if (argv.verbose) {
        console.log(event, data);
      }
  }
});

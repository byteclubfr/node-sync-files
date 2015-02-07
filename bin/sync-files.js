#!/usr/bin/env node

"use strict";

var minimist = require("minimist");
var updateNotifier = require("update-notifier");
var chalk = require("chalk");
var sync = require("../");

var pkg = require("../package.json");

var opts = {
  "boolean": ["help", "delete", "watch", "version", "verbose", "notify-update"],
  "string": ["depth"],
  "alias": {
    "help": "h",
    "watch": "w",
    "verbose": "v",
    "depth": "d"
  },
  "type": {
    "depth": "number"
  },
  "help": {
    "help": "Show help and exit",
    "delete": "Delete extraneous files from target",
    "watch": "Watch changes in source and keep target in sync",
    "version": "Show version and exit",
    "verbose": "Moar output",
    "notify-update": "Enable update notification",
    "depth": "Maximum depth if you have performance issues"
  },
  "default": {
    "help": false,
    "watch": false,
    "delete": true,
    "verbose": false,
    "notify-update": true,
    "depth": Infinity
  },
  "stopEarly": true,
  "unknown": function onUnknown (option) {
    // this function is triggered on first argument, we want to exclude this case
    if (option[0] !== "-") {
      return;
    }

    console.error(chalk.bold.red("Unknown option '" + option + "'"));
    help();
    process.exit(1);
  }
};

function help () {
  console.log("%s - v. %s", chalk.bold(pkg.name), chalk.cyan(pkg.version));
  console.log(pkg.description);
  console.log("");
  console.log("Usage: " + chalk.bold(pkg.name) + " [" + chalk.blue("options") + "] <" + chalk.yellow("source") + "> <" + chalk.yellow("target") + ">");
  console.log("\t%s is a file or folder which content will be mirrored to %s", chalk.yellow("source"), chalk.yellow("target"));
  console.log("");
  var keys = opts.boolean.map(function (opt) {
    var key = chalk.blue("--[no-]" + opt);
    if (Array.isArray(opts.alias[opt]) && opts.alias[opt].length > 0) {
      key += ", " + opts.alias[opt].map(function (a) { return chalk.blue("[--no]-" + a); }).join(", ");
    } else if (opts.alias[opt]) {
      key += ", " + chalk.blue("[--no]-" + opts.alias[opt]);
    }
    return {opt: opt, key: key};
  }).concat(opts.string.map(function (opt) {
    var arg = "<" + (opts.type[opt] || "value") + ">";
    var key = chalk.blue("--" + opt) + "=" + arg;
    if (Array.isArray(opts.alias[opt]) && opts.alias[opt].length > 0) {
      key += ", " + opts.alias[opt].map(function (a) { return chalk.blue("-" + a) + " " + arg; }).join(", ");
    } else if (opts.alias[opt]) {
      key += ", " + chalk.blue("-" + opts.alias[opt]) + " " + arg;
    }
    return {opt: opt, key: key};
  }));
  keys.forEach(function (k) {
    console.log(k.key);
    if (opts.help[k.opt]) {
      console.log("\t%s", opts.help[k.opt]);
    }
    if (opts.default[k.opt] !== undefined) {
      console.log("\t" + chalk.dim("Default: " + opts.default[k.opt]));
    }
    console.log("");
  });
}


var argv = minimist(process.argv.slice(2), opts);

if (argv._.length !== 2) {
  console.error(chalk.bold.red("Expects exactly two arguments, received " + argv._.length));
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
  "delete": argv.delete,
  "depth": Number(argv.depth)
}, function (event, data) {
  switch (event) {
    case "error":
      console.error(chalk.bold.red(data.message || data));
      process.exit(data.code || 2);
      break;
    default:
      if (argv.verbose) {
        console.log(event, data);
      }
  }
});

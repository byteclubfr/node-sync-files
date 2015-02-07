"use strict";

var defaults = require("lodash/object/defaults");
var fs = require("fs-extra");
var path = require("path");

module.exports = function (source, target, opts, notify) {
  opts = defaults(opts || {}, {
    "watch": false,
    "delete": false
  });

  if (opts.watch) {
    notify("error", "Option 'watch' not implemented yet");
    return false;
  }

  if (typeof opts.depth !== "number" || isNaN(opts.depth)) {
    notify("error", "Expected valid number for option 'depth'");
    return false;
  }

  // Browse
  return mirror(source, target, opts, notify, 0);
};

function mirror (source, target, opts, notify, depth) {
  // Specifc case where the very source is gone
  var sourceStat;
  try {
    sourceStat = fs.statSync(source);
  } catch (e) {
    // Source not found: destroy target?
    if (fs.existsSync(target)) {
      return deleteExtra(target, opts, notify);
    }
  }

  var targetStat;
  try {
    targetStat = fs.statSync(target);
  } catch (e) {
    // Target not found? good, direct copy
    return copy(source, target, opts, notify);
  }

  if (sourceStat.isDirectory() && targetStat.isDirectory()) {
    if (depth === opts.depth) {
      notify("max-depth", source);
      return true;
    }

    // copy from source to target
    var copied = fs.readdirSync(source).every(function (f) {
      return mirror(path.join(source, f), path.join(target, f), opts, notify, depth + 1);
    });

    // check for extraneous
    var deletedExtra = fs.readdirSync(target).every(function (f) {
      return fs.existsSync(path.join(source, f)) || deleteExtra(path.join(target, f), opts, notify);
    });

    return copied && deletedExtra;
  } else if (sourceStat.isFile() && targetStat.isFile()) {
    // compare update-time before overwriting
    if (sourceStat.mtime > targetStat.mtime) {
      return copy(source, target, opts, notify);
    } else {
      return true;
    }
  } else if (opts.delete) {
    // incompatible types: destroy target and copy
    return destroy(target, notify) && copy(source, target, opts, notify);
  } else if (sourceStat.isFile() && targetStat.isDirectory()) {
    // incompatible types
    notify("error", "Cannot copy file '" + source + "' to '" + target + "' as existing folder");
    return false;
  } else if (sourceStat.isDirectory() && targetStat.isFile()) {
    // incompatible types
    notify("error", "Cannot copy folder '" + source + "' to '" + target + "' as existing file");
    return false;
  } else {
    throw new Error("Unexpected case: WTF?");
  }
}

function deleteExtra (fileordir, opts, notify) {
  if (opts.delete) {
    return destroy(fileordir, notify);
  } else {
    notify("no-delete", fileordir);
    return true;
  }
}

function copy (source, target, opts, notify) {
  notify("copy", [source, target]);
  try {
    fs.copySync(source, target);
    return true;
  } catch (e) {
    notify("error", e);
    return false;
  }
}

function destroy (fileordir, notify) {
  notify("remove", fileordir);
  try {
    fs.remove(fileordir);
    return true;
  } catch (e) {
    notify("error", e);
    return false;
  }
}

var defaults = require("lodash/object/defaults");


module.exports = function (source, target, opts, notify) {
  opts = defaults(opts || {}, {
    "watch": false,
    "delete": false
  });

  if (opts.delete) {
    notify("error", "Option 'delete' not implemented yet");
    return false;
  }

  if (opts.watch) {
    notify("error", "Option 'watch' not implemented yet");
    return false;
  }

  notify("error", "Not implemented yet");
  return false;
};

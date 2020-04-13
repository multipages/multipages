module.exports = function (a, b) {
  let aSize = a.dirname.split('/').length;
  let bSize = b.dirname.split('/').length;

  if (aSize > bSize) {
    return 1
  } else if (aSize < bSize) {
    return -1;
  }

  return 0;
};

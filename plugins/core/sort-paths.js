module.exports = function sortPaths(a, b) {
  if (a.dirname.length > b.dirname.length) {
    return 1
  } else if (a.dirname.length < b.dirname.length) {
    return -1;
  }

  return 0;
};

const merge = (target, origin) => {
  for(let key in origin) {
    target[key] = origin[key]
  }
};

module.exports = {
  merge
}

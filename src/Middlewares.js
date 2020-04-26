module.exports = class Middlewares {
  constructor(collection) {
    this.collection = [...collection];
    this.lastIndex = this.collection.length - 1;
    this.currentIndex = 0;
  }

  execute(context) {
    const next = () => (this.currentIndex <= this.lastIndex)
      ? this.collection[this.currentIndex++](context, next)
      : context;

    return next() || context;
  }

}

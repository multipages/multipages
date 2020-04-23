const Path = require('../../src/Path');

describe('Path:Class', () => {
  test('should fetch a list of files given a rootPath', (done) => {
    new Path('./__fixtures__/source')
      .fetch()
      .then(list => {
        console.log(list);

        expect(list).toBe([]);
        done();
      })
      .catch(e => console.log(e));
  })
})


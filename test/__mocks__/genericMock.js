function JSONbig() {
  return {
    parse: (str) => JSON.parse(str),
    stringify: (obj) => JSON.stringify(obj),
  };
}
JSONbig.parse = (str) => JSON.parse(str);
JSONbig.stringify = (obj) => JSON.stringify(obj);
module.exports = JSONbig;
module.exports.default = JSONbig;

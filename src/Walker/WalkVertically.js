("use strict");
export const walkVertically = async (
  o = {
    _scope_: null,
    __exeptionHandler__: async (e, d) => {
      console.info("walkVertically |", e, d);
      return d.selector;
    },
  }
) => {
  let results = [];

  for (let selector of Object.keys(o).filter((key) => {
    return !["_scope_"].includes(key);
  })) {
    let elements = o._scope_ ? [...o._scope_.querySelectorAll(selector)].filter(
      (element) => {
        return element;
      }
    ) : [];
    for (let e of elements) {
      try {
        const result = await o[selector]({
          element: e,
          selector: new String(selector),
          self: o,
        });
        results.push(result);
      } catch (ex) {
        const errorResult = await o.__exeptionHandler__(ex, {
          element: e,
          selector: new String(selector),
          self: o,
        });
        results.push(errorResult);
      }
    }
  }
  return results;
};

("use strict");
export const walkVertically = async (
  o = {
    _scope_: null,
    __exeptionHandler__: async (e, d) => {
      console.info("walkVertically |", e, d);
    },
  }
) => {
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
        await o[selector]({
          element: e,
          selector: new String(selector),
          self: o,
        });
      } catch (ex) {
        await o.__exeptionHandler__(ex, {
          element: e,
          selector: new String(selector),
          self: o,
        });
      }
    }
  }
  return o;
};

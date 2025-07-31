("use strict");
export const walkHorizontally = async (
  o = {
    _scope_: document,
    __exeptionHandler__: async (e, d, resolve, reject) => {
      console.info("walkHorizontally |", e, d);
      resolve(d.selector);
    },
  }
) => {
  let pool = [];
  Object.keys(o)
    .filter((key) => {
      return !["_scope_"].includes(key);
    })
    .forEach((selector) => {
      [...o._scope_.querySelectorAll(selector)]
        .filter((element) => {
          return element;
        })
        .forEach((element) => {
          pool.push({
            element: element,
            selector: new String(selector),
          });
        });
    });

  return Promise.all(
    pool.map((_) => {
      return new Promise(async (resolve, reject) => {
        try {
          resolve(
            await o[_.selector]({
              element: _.element,
              selector: _.selector,
              self: o,
            })
          );
        } catch (ex) {
          resolve(
            await o.__exeptionHandler__(ex, {
              element: _.element,
              selector: _.selector,
              self: o,
            })
          );
        }
      });
    })
  );
};

import type { ObjectQuery } from "@mikro-orm/core";

const testFilter = (res: any, filter: any): boolean => {
  if (typeof filter === "object") {
    return Object.entries(filter)
      .map(([key, filter]) => testFilter(res[key], filter))
      .reduce((a, b) => a && b);
  } else {
    return res === filter;
  }
};

const applyArrayFilterUntyped = <T>(res: T, filter: any): T => {
  if (Array.isArray(res)) {
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === "object") {
        if (Array.isArray(res[0]?.[key])) {
          res = res.map((entry: Record<string, any>) => ({
            ...entry,
            [key]: applyArrayFilterUntyped(entry[key], value),
          }));
        } else {
          // TODO does this always work? is there a case where res[0][key] is not an array, but a child of res[0][key] is an array??
          res = res.filter((entry: Record<string, any>) => testFilter(entry[key], value));
        }
      } else {
        res = res.filter((entry: Record<string, any>) => entry[key] === value);
      }
    }

    return res;
  } else if (typeof res === "object") {
    // TODO test this doesn't mutate the input
    res = { ...res };
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === "object") {
        res[key] = applyArrayFilterUntyped(res[key], value);
      } else if (key in res) {
        throw `Cannot filter ${JSON.stringify(res)} with filter ${JSON.stringify({ [key]: value })}`;
      } else {
        throw `${JSON.stringify(res)} does not contain key ${JSON.stringify(key)}`;
      }
    }
    return res;
  } else {
    throw `Cannot filter ${JSON.stringify(res)} as it is not an object or an array`;
  }
};

export const applyArrayFilter = <T, E>(res: T, filter: ObjectQuery<E>): T => applyArrayFilterUntyped(res, filter);

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("preserves an empty array", () => {
    expect(applyArrayFilterUntyped([], { test: "me" })).toStrictEqual([]);
    expect(applyArrayFilterUntyped([], { test: { a: { more: "complex filter" } } })).toStrictEqual([]);
  });

  it("preserves elements when no filter is applied", () => {
    expect(applyArrayFilterUntyped([{ test: "me" }], {})).toStrictEqual([{ test: "me" }]);
    expect(applyArrayFilterUntyped([{ test: "me" }, { also: "me2" }], {})).toStrictEqual([
      { test: "me" },
      { also: "me2" },
    ]);
    expect(applyArrayFilterUntyped([], {})).toStrictEqual([]);
  });

  it("filters an array by value", () => {
    expect(applyArrayFilterUntyped([{ test: "me" }, { test: "I should be excluded" }], { test: "me" })).toStrictEqual([
      { test: "me" },
    ]);

    expect(
      applyArrayFilterUntyped(
        [
          { approved: null, id: "3" },
          { approved: true, id: "1" },
          { approved: true, id: "4" },
        ],
        { approved: true },
      ).map((i) => i.id),
    ).toStrictEqual(["1", "4"]);
  });

  it("traverses an object containing a value", () => {
    expect(
      applyArrayFilterUntyped({ abc: [{ def: "test" }, { def: "test2" }] }, { abc: { def: "test" } }),
    ).toStrictEqual({
      abc: [{ def: "test" }],
    });
  });

  it("ignores non filtered keys", () => {
    expect(applyArrayFilterUntyped({ abc: [{ def: "test", ghi: "test2" }] }, { abc: { def: "test" } })).toStrictEqual({
      abc: [{ def: "test", ghi: "test2" }],
    });
  });

  it("returns an empty array when nothing matches the filter", () => {
    expect(
      applyArrayFilterUntyped({ abc: [{ def: "test" }, { def: "test2" }] }, { abc: { def: "non matching" } }),
    ).toStrictEqual({
      abc: [],
    });
  });

  it("fails when the shape of the input does not match the shape of the filter", () => {
    expect(() => applyArrayFilterUntyped({ abc: "def" }, { key: "value" })).toThrowError(
      `{"abc":"def"} does not contain key "key"`,
    );
    expect(() => applyArrayFilterUntyped({ abc: "def" }, { abc: "cannot filter non array" })).toThrowError(
      `Cannot filter {"abc":"def"} with filter {"abc":"cannot filter non array"}`,
    );
    expect(() => applyArrayFilterUntyped({ abc: { def: "ghi" } }, { abc: { def: "nested non-array" } })).toThrowError(
      `Cannot filter {"def":"ghi"} with filter {"def":"nested non-array"}`,
    );
  });

  it("fails when attempting to filter a non object", () => {
    expect(() => applyArrayFilterUntyped("not an object", { some: "object" })).toThrowError(
      `Cannot filter "not an object" as it is not an object or an array`,
    );
  });

  it("can apply multiple filters to an array", () => {
    const filter = {
      test: "me",
      also: "me2",
    };
    expect(
      applyArrayFilterUntyped(
        [{ test: "me", also: "me2" }, { test: "me", also: "not me" }, { test: "me" }, { also: "me2" }],
        filter,
      ),
    ).toStrictEqual([
      {
        test: "me",
        also: "me2",
      },
    ]);
  });

  it("can filter nested arrays", () => {
    const filter = { approved: true, user_instruments: { approved: true } };
    const input1 = [
      {
        approved: true,
        user: "1",
        user_instruments: [
          { user_instrument: "325", approved: null },
          { user_instrument: "527", approved: true },
        ],
      },
      { approved: null, user: "2", user_instruments: [{ user_instrument: "555", approved: true }] },
    ];

    expect(applyArrayFilterUntyped(input1, filter)).toStrictEqual([
      { approved: true, user: "1", user_instruments: [{ user_instrument: "527", approved: true }] },
    ]);
  });

  it("can filter deeply nested arrays", () => {
    const filter = { lineup: { user_instruments: { user_instrument: { instrument: "37" } } } };
    const input1 = {
      lineup: [
        {
          approved: true,
          user: "1",
          user_instruments: [
            { user_instrument: { id: "325", instrument: "37" } },
            { user_instrument: { id: "527", instrument: "80" } },
          ],
        },
        { approved: null, user: "2", user_instruments: [{ user_instrument: { id: "525", instrument: "20" } }] },
      ],
    };

    expect(applyArrayFilterUntyped(input1, filter)).toStrictEqual({
      lineup: [
        {
          approved: true,
          user: "1",
          user_instruments: [{ user_instrument: { id: "325", instrument: "37" } }],
        },
        {
          approved: null,
          user: "2",
          user_instruments: [],
        },
      ],
    });
  });
}

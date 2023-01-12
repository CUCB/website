import { Music } from "$lib/entities/Music";
import { error } from "@sveltejs/kit";
import { Literal, Number, String, Undefined, Union, type Static } from "runtypes";
import { readFile } from "fs/promises";
import type { MusicType } from "../../../lib/entities/MusicType";

const renumberFiles = (): ((file: string) => string) => {
  let i = 0;
  return (file) => file.replace(/^X:.*\n/, `X:${++i}\n`);
};

const concatenateSets = (files: string[]): string => files.map((file) => `${file.trim()}\n`).join("\n\n%%newpage 1\n");

export const combineAbcFiles = (rawFiles: [string, [string, string]][]): [string, Map<string, string>] => [
  concatenateSets(rawFiles.map(([file, _]) => file).map(renumberFiles())),
  // TODO maybe this function could actually generate this stuff from the rawFiles rather than titles and types
  rawFiles.reduce(
    (map: Map<string, string>, [_, [title, type]]) => map.set(applyEscapeSequences(title), type),
    new Map(),
  ),
];

export const pathForAbcFile = (music: Music): string => {
  const topFolder = music.current ? "current" : "archived";
  const showTune = music.showTune ? "showtunes" : null;
  const folder = [topFolder, showTune].filter((segment) => segment).join("/");
  return `${folder}/${music.filename}.abc`;
};

const isInteger = (n: number): boolean => n === Math.round(n);

export const Folder = Union(Literal("archived"), Literal("current"), Literal("all"));
const Transpose = Number.withConstraint((number) => isInteger(number) && number >= -12 && number <= 12);
const Clef = Union(Literal("alto"), Literal("bass"), Literal("treble"), Undefined);

export type Transpose = Static<typeof Transpose>;
export type Clef = Static<typeof Clef>;

type Params = { clef?: Clef; transpose?: Transpose };

const retrieveValuesFrom =
  (searchParams: URLSearchParams, output: Params) =>
  <T extends keyof Params>(key: T, validate: (s: string) => Params[T]): void => {
    const value = searchParams.get(key);
    if (value) {
      try {
        output[key] = validate(value);
      } catch {
        throw error(404, `Invalid parameter ${key}`);
      }
    }
  };

export const parseQuery = (searchParams: URLSearchParams): Params => {
  let output: Params = {};
  let assignValue = retrieveValuesFrom(searchParams, output);
  assignValue("clef", Clef.check);
  assignValue("transpose", (value) => Transpose.check(parseFloat(value)));
  return output;
};

export const setsIn = (folder: Static<typeof Folder>): { current?: boolean } =>
  ({
    archived: { current: false },
    current: { current: true },
    all: {},
  }[folder]);

export const decommentClefPreTranspose = (clef: "alto" | "bass", abc: string): string =>
  abc
    .split("\n")
    .map((line) => line.replace(new RegExp(`^%${clef.toUpperCase()} \(.*\)\(clef=.*\)`), "$1%$2"))
    .join("\n");
export const decommentClefPostTranspose = (abc: string): string =>
  abc
    .split("\n")
    .map((line) => line.replace("]%clef", "clef"))
    .map((line) => line.replace("%clef", "clef"))
    .join("\n");

export const titleAndType = (abc: string): [string, string] | undefined => {
  const title = abc
    .split("\n")
    .find((line) => line.startsWith("T:"))
    ?.split(":")[1]
    .trim();
  const type = abc
    .split("\n")
    .find((line) => line.startsWith("R:"))
    ?.split(":")[1]
    .trim();
  return (title && type && [title, type]) || undefined;
};

const replaceIfMatch = (re: RegExp, line: string): string | undefined => line.match(re)?.[1];

const fullTitle = (type: "all" | "current" | "archived") =>
  type === "all" ? "All sets" : type === "current" ? "Current sets" : "Archived sets";

export const pdfInfo = (type: "all" | "current" | "archived") => `\
InfoBegin
InfoKey: Title
InfoValue: ${fullTitle(type)} -- CUCB
InfoBegin
InfoKey: Author
InfoValue: Cambridge University Ceilidh Band 
`;

const bookmark = (title: string, level: number, page: number) => `\
BookmarkBegin
BookmarkTitle: ${title}
BookmarkLevel: ${level}
BookmarkPageNumber: ${page}
`;

const entry = <T, Key>(map: Map<Key, T[]>, key: Key): T[] => {
  let entry = map.get(key);
  if (entry) {
    return entry;
  } else {
    let arr: T[] = [];
    map.set(key, arr);
    return arr;
  }
};

const extractPostscriptPage = (line: string): number | undefined => {
  const pageNumber = parseInt(replaceIfMatch(/^%%Page: (\d+)/, line) || "");
  return !isNaN(pageNumber) ? pageNumber : undefined;
};

const extractSetTitle = (line: string): string | undefined => replaceIfMatch(/^% --- title (.*)/i, line)?.trim();
const extractTuneTitle = (line: string): string | undefined => replaceIfMatch(/^% --- titlesub (.*)/i, line)?.trim();

const tuple = <S, T>(a: S, b: T): [S, T] => [a, b];

type CurrentPageAndNumbers = [number, [string, number][]];
const pageNumbersForStrings = (pagesOrTitles: (string | number)[]): [string, number][] =>
  pagesOrTitles.reduce(
    ([page, results], pageOrTitle) =>
      (Number.guard(pageOrTitle)
        ? tuple(pageOrTitle, results)
        : tuple(page, [...results, [pageOrTitle, page]])) as CurrentPageAndNumbers,
    tuple(0, []) as CurrentPageAndNumbers,
  )[1];

const escapeSequences = [
  ["\\`A", "À"],
  ["\\`a", "à"],
  ["\\`e", "è"],
  ["\\`o", "ò"],
  ["\\'A", "Á"],
  ["\\'a", "á"],
  ["\\'e", "é"],
  ["\\'o", "ó"],
  ["\\^A", "Â"],
  ["\\^a", "â"],
  ["\\^e", "ê"],
  ["\\^o", "ô"],
  ["\\~A", "Ã"],
  ["\\~a", "ã"],
  ["\\~n", "ñ"],
  ["\\~o", "õ"],
  ['\\"A', "Ä"],
  ['\\"a', "ä"],
  ['\\"e', "ë"],
  ['\\"o', "ö"],
  ["\\cC", "Ç"],
  ["\\cc", "ç"],
  ["\\AA", "Å"],
  ["\\AE", "Æ"],
  ["\\aa", "å"],
  ["\\ae", "æ"],
  ["\\/O", "Ø"],
  ["\\/o", "ø"],
  ["\\uA", "Ă"],
  ["\\ua", "ă"],
  ["\\uE", "Ĕ"],
  ["\\ue", "ĕ"],
  ["\\vS", "Š"],
  ["\\vs", "š"],
  ["\\vZ", "Ž"],
  ["\\vz", "ž"],
  ["\\HO", "Ő"],
  ["\\Ho", "ő"],
  ["\\HU", "Ű"],
  ["\\Hu", "ű"],
  ["\\ss", "ß"],
  ["\\oe", "œ"],
];
const applyEscapeSequences = (abcTitle: string): string =>
  escapeSequences.reduce((string, [escape, replacement]) => string.replaceAll(escape, replacement), abcTitle);

const groupBy = <T, Key>(array: T[], keyFor: (t: T) => Key): Map<Key, T[]> =>
  array.reduce((map, element) => {
    entry(map, keyFor(element)).push(element);
    return map;
  }, new Map());

export const generateBookmarks = async (
  titleToType: Map<string, string>,
  psPath: string,
  setTypes: Map<string, MusicType>,
): Promise<string[]> => {
  const ps = await readFile(psPath, { encoding: "utf-8" });

  const pagesAndSets = ps
    .split("\n")
    .map((line) => extractPostscriptPage(line) || extractSetTitle(line))
    .filter((line) => typeof line !== "undefined") as (string | number)[];
  const pagesAndTunes = ps
    .split("\n")
    .map((line) => extractPostscriptPage(line) || extractTuneTitle(line))
    .filter((line) => typeof line !== "undefined") as (string | number)[];

  const pagesForSets = pageNumbersForStrings(pagesAndSets);
  const pagesForTunes = pageNumbersForStrings(pagesAndTunes);

  // Sort tune index by tune title
  pagesForTunes.sort((a, b) => a[0].localeCompare(b[0]));

  const pagesForSetTypes = groupBy(pagesForSets, ([title, _]) => String.check(titleToType.get(title)));

  const bookmarks = [];

  bookmarks.push(bookmark("Tune index", 1, 1));
  for (const [tune, page] of pagesForTunes) {
    bookmarks.push(bookmark(tune, 2, page));
  }
  bookmarks.push(bookmark("Set index (alphabetical)", 1, 1));
  for (const [tune, page] of pagesForSets) {
    bookmarks.push(bookmark(tune, 2, page));
  }
  bookmarks.push(bookmark("Set index (by type)", 1, 1));
  const sets = [...setTypes.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const set of sets) {
    const pages = pagesForSetTypes.get(set.abcField);
    if (pages) {
      bookmarks.push(bookmark(set.name, 2, 1));
      for (const [tune, page] of pages) {
        bookmarks.push(bookmark(tune, 3, page));
      }
    }
  }

  return bookmarks;
};

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  describe("renumberFiles", () => {
    it("numbers the first file 1", () => {
      const abc = `X:3\nT:A tune\nK:G\nM:4/4\nGABc defg|]\n`;
      const sut = renumberFiles();

      const actual = sut(abc);

      expect(actual).to.contain(`X:1`);
    });

    it("numbers subsequent files consecutively", () => {
      const abc = `X:3\nT:A tune\nK:G\nM:4/4\nGABc defg|]\n`;
      const sut = renumberFiles();
      sut(abc);

      const actual = sut(abc);

      expect(actual).to.contain(`X:2`);
    });

    it("leaves a correctly numbered file unchanged", () => {
      const original = `X:1\nT:A tune\nK:G\nM:4/4\nGABc defg|]\n`;
      const sut = renumberFiles();

      const actual = sut(original);

      expect(actual).to.equal(original);
    });
  });

  describe("concetanateSets", () => {
    it("leaves a single file unchanged", () => {
      const original = `X:1\nT:A tune\nK:G\nM:4/4\nGABc defg|]\n`;
      const sut = concatenateSets;

      const actual = sut([original]);

      expect(actual).to.equal(original);
    });

    it("places an abc newpage between files", () => {
      const firstFile = `X:1\nT:A tune\nK:G\nM:4/4\nGABc defg|]\n`;
      const secondFile = `X:2\nT:A different tune\nK:Em\nM:4/4\nEFGA Bcde|]\n`;
      const sut = concatenateSets;

      const actual = sut([firstFile, secondFile]);

      expect(actual.split("\n")).to.contain("%%newpage 1");
    });

    it("places blank lines between files", () => {
      const firstFile = `X:1\nT:A tune\nK:G\nM:4/4\nGABc defg|]\n`;
      const secondFile = `X:2\nT:A different tune\nK:Em\nM:4/4\nEFGA Bcde|]\n`;
      const sut = concatenateSets;

      const actual = sut([firstFile, secondFile]);

      expect(actual).to.contain("\n\n");
    });
  });

  describe("combineAbcFiles", () => {
    it("renumbers the provided files", () => {
      const firstFile = `X:9\nT:A tune\nK:G\nM:4/4\nGABc defg|]\n`;
      const secondFile = `X:9\nT:A different tune\nK:Em\nM:4/4\nEFGA Bcde|]\n`;
      const sut = combineAbcFiles;

      const [actual, _] = sut([
        [firstFile, ["", ""]],
        [secondFile, ["", ""]],
      ]);

      expect(actual.split("\n")).to.contain("X:1").and.contain("X:2");
    });

    it("concatenates the files to separate pages", () => {
      const firstFile = `X:9\nT:A tune\nK:G\nM:4/4\nGABc defg|]\n`;
      const secondFile = `X:9\nT:A different tune\nK:Em\nM:4/4\nEFGA Bcde|]\n`;
      const sut = combineAbcFiles;

      const [actual, _] = sut([
        [firstFile, ["", ""]],
        [secondFile, ["", ""]],
      ]);

      expect(actual.split("\n")).to.contain("%%newpage 1");
    });
  });

  describe("pathForAbcFile", () => {
    const currentSet = new Music();
    currentSet.current = true;
    currentSet.showTune = false;
    currentSet.filename = "test";
    currentSet.title = "A Set";

    const showSet = new Music();
    showSet.current = true;
    showSet.showTune = true;
    showSet.filename = "showy";
    showSet.title = "A Show Set";

    const segmentsOf = (path: string): string[] => path.split("/");

    it("creates a path ending in .abc", () => {
      const sut = pathForAbcFile;

      const actual = sut(currentSet);

      expect(actual).to.match(/\.abc$/);
    });

    it("creates a path with two segments for a non-show set", () => {
      const sut = pathForAbcFile;

      const actual = sut(currentSet);

      expect(segmentsOf(actual)).to.have.length(2);
    });

    it("creates a path with the provided filename", () => {
      const sut = pathForAbcFile;

      const actual = sut(currentSet);

      expect(segmentsOf(actual)[1]).to.equal("test.abc");
    });

    it("creates a path with the current folder", () => {
      const sut = pathForAbcFile;

      const actual = sut(currentSet);

      expect(segmentsOf(actual)[0]).to.equal("current");
    });

    it("creates a path containing the showtunes folder for a show set", () => {
      const sut = pathForAbcFile;

      const actual = sut(showSet);

      expect(segmentsOf(actual)).to.have.length(3);
      expect(segmentsOf(actual)[1]).to.equal("showtunes");
    });
  });

  describe("Transpose", () => {
    it("accepts an octave lower", () => {
      expect(Transpose.guard(-12)).to.be.true;
    });

    it("rejects more than an octave lower", () => {
      expect(Transpose.guard(-13)).to.be.false;
    });

    it("accepts an octave higher", () => {
      expect(Transpose.guard(12)).to.be.true;
    });

    it("rejects more than an octave higher", () => {
      expect(Transpose.guard(13)).to.be.false;
    });

    it("accepts no transposition", () => {
      expect(Transpose.guard(0)).to.be.true;
    });

    it("rejects non integers", () => {
      expect(Transpose.guard(3.14)).to.be.false;
    });
  });

  describe("parseQuery", () => {
    it("accepts no parameters", () => {
      expect(() => parseQuery(new URLSearchParams())).to.not.throw();
    });

    it("rejects invalid transpose", () => {
      const params = new URLSearchParams();
      params.set("transpose", "-13");
      expect(() => parseQuery(params)).to.throw();
    });

    it("throws a 404 error in the case of an invalid value", () => {
      const params = new URLSearchParams();
      params.set("transpose", "-13");
      expect(() => parseQuery(params))
        .to.throw()
        .and.have.ownProperty("status", 404);
    });

    it("rejects non-integer transpose", () => {
      const params = new URLSearchParams();
      params.set("transpose", "not an integer");
      expect(() => parseQuery(params))
        .to.throw()
        .and.have.ownProperty("status", 404);
    });

    it("rejects invalid clefs", () => {
      const params = new URLSearchParams();
      params.set("clef", "not a clef");
      expect(() => parseQuery(params))
        .to.throw()
        .and.have.ownProperty("status", 404);
    });

    it("accepts valid clef and transpose", () => {
      const params = new URLSearchParams();
      params.set("clef", "alto");
      params.set("transpose", "2");
      expect(() => parseQuery(params)).to.not.throw();
    });
  });

  describe("decommentClef", () => {
    const sut = (clef: "alto" | "bass", abc: string) =>
      decommentClefPostTranspose(decommentClefPreTranspose(clef, abc));

    it("decomments a single matching line", () => {
      expect(sut("alto", "%ALTO K:clef=alto middle=c")).to.equal("K:clef=alto middle=c");
    });

    it("does not decomment a non-matching line", () => {
      expect(sut("alto", "%BASS K:clef=bass middle=d")).to.equal("%BASS K:clef=bass middle=d");
    });

    it("leaves adjacent lines unmodified", () => {
      expect(sut("alto", "K:F\n%ALTO K:clef=alto middle=c\nP:A")).to.equal("K:F\nK:clef=alto middle=c\nP:A");
    });
  });

  describe("extract postscript page", () => {
    const sut = extractPostscriptPage;

    it("returns undefined if the line is blank", () => {
      expect(sut("")).to.be.undefined;
    });

    it("returns a number if the page is an integer", () => {
      expect(sut("%%Page: 12 12")).to.equal(12);
    });

    it("returns undefined if the line is not a page number", () => {
      expect(sut("% --- title Marches 1")).to.be.undefined;
    });
  });

  describe("groupBy", () => {
    const sut = groupBy;

    it("groups different keys into different buckets", () => {
      const titleToType = new Map([
        ["A title", "A set"],
        ["Another title", "A different set"],
      ]);
      const pagesForSets: [string, number][] = [
        ["A title", 1],
        ["Another title", 2],
      ];

      const actual = sut(pagesForSets, ([title, _]) => titleToType.get(title));
      const expected = new Map([
        ["A set", [["A title", 1]]],
        ["A different set", [["Another title", 2]]],
      ]);

      expect(actual).toStrictEqual(expected);
    });

    it("groups elements with the same key to the same bucket", () => {
      const titleToType = new Map([
        ["A title", "A set"],
        ["Another title", "A set"],
      ]);
      const pagesForSets: [string, number][] = [
        ["A title", 1],
        ["Another title", 2],
      ];

      const actual = sut(pagesForSets, ([title, _]) => titleToType.get(title));
      const expected = new Map([["A set", pagesForSets]]);

      expect(actual).toStrictEqual(expected);
    });
  });
}

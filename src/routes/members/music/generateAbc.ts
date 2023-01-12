import { Music } from "$lib/entities/Music";
import orm from "$lib/database";
import {
  combineAbcFiles,
  decommentClefPreTranspose,
  decommentClefPostTranspose,
  parseQuery,
  pathForAbcFile,
  type Folder,
  titleAndType,
  generateBookmarks,
  pdfInfo,
} from "./abc";
import { Tuple, String, type Static } from "runtypes";
import { readFile, writeFile } from "fs/promises";
import { error } from "@sveltejs/kit";
import { Abc2abc, Abc2midi, Abcm2ps, Pdftk, Ps2pdf, Timidity } from "./conversion";
import type { QueryOrderMap } from "@mikro-orm/core";
import { MusicType } from "../../../lib/entities/MusicType";

const isAudioFormat = (value: string): value is "midi" | "mp3" | "ogg" => ["midi", "mp3", "ogg"].includes(value);

export const singleAbcFile = async (
  filename: string,
  outputType: "abc" | "midi" | "mp3" | "ogg" | "ps" | "pdf",
  searchParams: URLSearchParams,
  folder: Static<typeof Folder>,
  env: { BINARY_ROOT: string; MUSIC_PATH: string },
) => {
  const em = (await orm()).em.fork();
  let music;
  try {
    music = await em.findOneOrFail(Music, { filename, current: folder === "current" });
  } catch {
    throw error(404, "Set not found");
  }
  // TODO ensure we don't have a path traversal vulnerability
  let abcPath = `${env["MUSIC_PATH"]}/${pathForAbcFile(music)}`;
  const params = parseQuery(searchParams);

  let abc = await readFile(abcPath, { encoding: "utf-8" });
  abcPath = `/tmp/abc/test.abc`;
  await writeFile(abcPath, abc);
  if (params.clef && params.clef !== "treble") {
    abc = decommentClefPreTranspose(params.clef, abc);
    await writeFile(abcPath, abc);
  }
  if (params.transpose && params.transpose !== 0) {
    abc = await new Abc2abc(env["BINARY_ROOT"]).transpose(abcPath, params.transpose);
  }
  if (params.clef && params.clef !== "treble") {
    abc = decommentClefPostTranspose(abc);
  }
  await writeFile(abcPath, abc);

  // TODO cleanup files
  if (outputType === "abc") {
    return new Response(abc, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `inline; filename="${filename}.${outputType}"`,
      },
    });
  } else if (isAudioFormat(outputType)) {
    const midiPath = `/tmp/music/this.midi`;
    const abc2midi = new Abc2midi(env["BINARY_ROOT"]);
    await abc2midi.convertToMidi(abcPath, midiPath);
    if (outputType === "midi") {
      return new Response(await readFile(midiPath), {
        headers: {
          "Content-Type": "audio/midi",
          "Content-Disposition": `inline; filename="${filename}.${outputType}"`,
        },
      });
    } else {
      const mp3Path = `/tmp/music/this.mp3`;
      const timidity = new Timidity(env["BINARY_ROOT"]);
      await timidity.convertTo(outputType, midiPath, mp3Path);
      return new Response(await readFile(mp3Path), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `inline; filename="${filename}.${outputType}"`,
        },
      });
    }
  } else {
    const psPath = `/tmp/music/this.ps`;
    const abcm2ps = new Abcm2ps(env["BINARY_ROOT"]);
    await abcm2ps.convertToPs(abcPath, psPath);
    if (outputType === "ps") {
      return new Response(await readFile(psPath), {
        headers: {
          "Content-Type": "application/postscript",
          "Content-Disposition": `inline; filename="${filename}.${outputType}"`,
        },
      });
    } else if (outputType === "pdf") {
      const pdfPath = `/tmp/music/this.pdf`;
      const ps2pdf = new Ps2pdf(env["BINARY_ROOT"]);
      await ps2pdf.convertToPdf(psPath, pdfPath);
      return new Response(await readFile(pdfPath), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}.${outputType}"`,
        },
      });
    }
  }
  // TODO make me unique
};

export const multipleAbcFiles = async (
  outputType: "abc" | "ps" | "pdf",
  searchParams: URLSearchParams,
  folder: "all" | "archived" | "current",
  orderBy: QueryOrderMap<Music>,
  env: { BINARY_ROOT: string; MUSIC_PATH: string },
) => {
  const em = (await orm()).em.fork();
  let musics;
  try {
    musics = await em.find(Music, folder === "all" ? {} : { current: folder === "current" }, { orderBy });
  } catch {
    throw error(404, "Set not found");
  }
  let [abc, titleToType] = combineAbcFiles(
    await Promise.all(
      musics
        .map((music) => `${env["MUSIC_PATH"]}/${pathForAbcFile(music)}`)
        .map((filename) => readFile(filename, { encoding: "utf-8" }))
        .map((abc) =>
          abc.then((abc) => [abc, Tuple(String, String).check(titleAndType(abc))] as [string, [string, string]]),
        ),
    ),
  );
  // TODO make me random
  let abcPath = `/tmp/abc/test.abc`;
  // TODO (unit) test that I get written to before abc2abc is invoked
  await writeFile(abcPath, abc);

  const params = parseQuery(searchParams);

  if (params.clef && params.clef !== "treble") {
    abc = decommentClefPreTranspose(params.clef, abc);
    await writeFile(abcPath, abc);
  }
  if (params.transpose && params.transpose !== 0) {
    abc = await new Abc2abc(env["BINARY_ROOT"]).transpose(abcPath, params.transpose);
  }
  if (params.clef && params.clef !== "treble") {
    abc = decommentClefPostTranspose(abc);
  }
  await writeFile(abcPath, abc);

  // TODO cleanup files
  if (outputType === "abc") {
    return new Response(abc, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `inline; filename="${folder}.${outputType}"`,
      },
    });
  } else {
    const psPath = `/tmp/music/this.ps`;
    const abcm2ps = new Abcm2ps(env["BINARY_ROOT"]);
    await abcm2ps.convertToPs(abcPath, psPath);
    if (outputType === "ps") {
      return new Response(await readFile(psPath), {
        headers: {
          "Content-Type": "application/postscript",
          "Content-Disposition": `inline; filename="${folder}.${outputType}"`,
        },
      });
    } else if (outputType === "pdf") {
      const setTypes = await em
        .find(MusicType, {})
        .then((musicTypes) =>
          musicTypes.reduce(
            (map: Map<string, MusicType>, musicType: MusicType) => map.set(musicType.abcField, musicType),
            new Map(),
          ),
        );

      const info = pdfInfo(folder);
      const bookmarks = await generateBookmarks(titleToType, psPath, setTypes);
      const pdfIndex = [info, ...bookmarks].join("");
      const pdfPath = `/tmp/music/this.pdf`;
      const infoPath = `${pdfPath}.info`;
      await writeFile(infoPath, pdfIndex);
      const bookmarkedPath = `/tmp/music/that.pdf`;

      const ps2pdf = new Ps2pdf(env["BINARY_ROOT"]);
      await ps2pdf.convertToPdf(psPath, pdfPath);

      const pdftk = new Pdftk(env["BINARY_ROOT"]);
      await pdftk.bookmarkPdf(pdfPath, infoPath, bookmarkedPath);

      return new Response(await readFile(bookmarkedPath), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${folder}.${outputType}"`,
        },
      });
    }
  }
  // TODO make me unique
};

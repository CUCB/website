import { spawn } from "child_process";
import type { Transpose } from "./abc";

class ProcessCommandRunner {
  run(command: string, args?: string[]): Promise<{ stdout: string; stderr: string; combined: string }> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let stdout = "",
        stderr = "",
        combined = "";

      process.stdout.on("data", (data) => {
        stdout += data.toString();
        combined += data.toString();
      });
      process.stderr.on("data", (data) => {
        stderr += data.toString();
        combined += data.toString();
      });

      process.on("close", (code) =>
        code === 0
          ? resolve({ stdout, stderr, combined })
          : reject(`Process exited with error code ${code}.\nStdout: ${stdout}\nStderr: ${stderr}`),
      );
    });
  }
}

interface CommandRunner {
  run(command: string, args?: string[]): Promise<{ stdout: string; stderr: string; combined: string }>;
}

export class Ps2pdf {
  runner: CommandRunner;
  command: string;

  constructor(command_root: string, runner?: CommandRunner) {
    this.command = `${command_root}/ps2pdf`;
    this.runner = runner ?? new ProcessCommandRunner();
  }

  async convertToPdf(ps_in: string, pdf_out: string) {
    await this.runner.run(this.command, [ps_in, pdf_out]);
  }
}

export class Pdftk {
  runner: CommandRunner;
  command: string;

  constructor(command_root: string, runner?: CommandRunner) {
    this.command = `${command_root}/pdftk`;
    this.runner = runner ?? new ProcessCommandRunner();
  }

  async bookmarkPdf(pdfPath: string, infoPath: string, outputPath: string) {
    await this.runner.run(this.command, [pdfPath, "update_info", infoPath, "output", outputPath]);
  }
}

export class Abcm2ps {
  runner: CommandRunner;
  command: string;
  extraArguments: string[];

  static ARGS: string = "-S -d 1cm --topmargin 0.5cm --botmargin 0.5cm";

  constructor(command_root: string, runner?: CommandRunner, extraArguments?: string[]) {
    this.command = `${command_root}/abcm2ps`;
    this.runner = runner ?? new ProcessCommandRunner();
    this.extraArguments = extraArguments ?? Abcm2ps.ARGS.split(" ");
  }

  async convertToPs(abc_in: string, ps_out: string): Promise<void> {
    await this.runner.run(this.command, [abc_in, "-O", ps_out, ...this.extraArguments]);
  }

  async convertToHtml(abc_in: string, html_out: string): Promise<void> {
    await this.runner.run(this.command, [abc_in, "-X", "-O", html_out, ...this.extraArguments]);
  }
}

export class Abc2abc {
  runner: CommandRunner;
  command: string;

  constructor(command_root: string, runner?: CommandRunner) {
    this.command = `${command_root}/abc2abc`;
    this.runner = runner ?? new ProcessCommandRunner();
  }

  transpose(path: string, transposition: Transpose): Promise<string> {
    return (
      this.runner
        .run(this.command, [path, "-e", "-t", transposition.toString()])
        .then((output) => output.combined)
        // abc2abc attempts to transpose Capo
        .then((abc) => abc.replaceAll(/\([A-z#]*apo/g, "(Capo"))
    );
  }
}

export class Abc2midi {
  runner: CommandRunner;
  command: string;

  constructor(command_root: string, runner?: CommandRunner) {
    this.command = `${command_root}/abc2midi`;
    this.runner = runner ?? new ProcessCommandRunner();
  }

  // TODO cope with adjusting tempi
  async convertToMidi(path: string, outputPath: string): Promise<void> {
    await this.runner.run(this.command, [path, "-o", outputPath]);
  }
}

export class Timidity {
  command: string;
  lame: string;
  oggenc: string;

  constructor(command_root: string, runner?: CommandRunner) {
    this.command = `${command_root}/timidity`;
    this.lame = `${command_root}/lame`;
    this.oggenc = `${command_root}/oggenc`;
  }

  async convertTo(type: "mp3" | "ogg", path: string, outputPath: string): Promise<void> {
    const timidity = spawn(this.command, [path, "-Ow", "-o", "-"]);
    const output = type === "mp3" ? spawn(this.lame, ["-", outputPath]) : spawn(this.oggenc, ["-", "-o", outputPath]);

    return new Promise((resolve, reject) => {
      timidity.stdout.on("data", (data) => output.stdin.write(data));
      timidity.on("close", (code) => {
        output.stdout.emit("close");
        resolve();
      });
    });
  }
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  describe("abc conversion", async () => {
    const sinon = await import("sinon");
    const makeEmptyRunner = () => ({
      run: sinon.fake((_command, _args) => Promise.resolve({ stdout: "", stderr: "", combined: "" })),
    });

    describe("Abcm2ps", async () => {
      it("accesses the abcm2ps binary via the provided command root", () => {
        const runner = makeEmptyRunner();
        const sut = new Abcm2ps("/home/cucb/bin", runner, []);
        sut.convertToPs("file.abc", "output/test.ps");

        expect(runner.run.calledOnce).to.be.true;
        expect(runner.run.args[0][0]).toStrictEqual("/home/cucb/bin/abcm2ps");
      });

      it("calls abcm2ps with the provided arguments and flag for converting to postscript", () => {
        const runner = makeEmptyRunner();
        const sut = new Abcm2ps("/home/cucb/bin", runner, []);
        sut.convertToPs("file.abc", "output/test.ps");

        expect(runner.run.args[0][1]).toStrictEqual(["file.abc", "-O", "output/test.ps"]);
      });

      it("calls abcm2ps with the provided arguments and flag for converting to postscript", () => {
        const runner = makeEmptyRunner();
        const sut = new Abcm2ps("/home/cucb/bin", runner, []);
        sut.convertToHtml("file.abc", "output/test.ps");

        expect(runner.run.args[0][1]).toStrictEqual(["file.abc", "-X", "-O", "output/test.ps"]);
      });

      it("appends any provided formatting arguments to the argument list", () => {
        const runner = makeEmptyRunner();
        const sut = new Abcm2ps("/home/cucb/bin", runner, ["a", "b", "c"]);
        sut.convertToPs("file.abc", "output/test.ps");

        expect(runner.run.args[0][1].slice(3)).toStrictEqual(["a", "b", "c"]);
      });
    });

    describe("Abc2abc", () => {
      const simpleTune = {
        original: `X:1\nT:A tune\nK:G\nM:4/4\nGABcdefg`,
        transposed: `X:1\nT:A tune\nK:A\nM:4/4\nABcdefga`,
      };
      const tuneWithCapo = {
        original: `X:1\nT:A tune\nK:G\nM:4/4\n"\\n(Capo 2)"GA|"G (F)"GBcde fgfe`,
        transposed: `X:1\nT:A tune\nK:A\nM:4/4\n"\\n(Dapo 2)"AB|"A (G)"cdef gagf`,
        corrected: `X:1\nT:A tune\nK:A\nM:4/4\n"\\n(Capo 2)"AB|"A (G)"cdef gagf`,
      };

      it("returns the output of the command", async () => {
        const runner = {
          run: sinon.fake((_a, _b) => Promise.resolve({ stdout: "", stderr: "", combined: simpleTune.transposed })),
        };

        const sut = new Abc2abc("/home/cucb/bin", runner);

        expect(await sut.transpose("file.abc", 2)).to.equal(simpleTune.transposed);
      });

      it("invokes abc2abc with the relevant arguments", async () => {
        const runner = {
          run: sinon.fake((_a, _b) => Promise.resolve({ stdout: "", stderr: "", combined: "" })),
        };

        const sut = new Abc2abc("/home/cucb/bin", runner);
        await sut.transpose("file.abc", 2);

        expect(runner.run.calledOnce).to.be.true;
        expect(runner.run.args[0][1]).toStrictEqual(["file.abc", "-e", "-t", "2"]);
      });

      it("de-transposes capo text", async () => {
        const runner = {
          run: sinon.fake((_a, _b) => Promise.resolve({ stdout: "", stderr: "", combined: tuneWithCapo.transposed })),
        };

        const sut = new Abc2abc("/home/cucb/bin", runner);

        expect(await sut.transpose("file.abc", 2)).to.equal(tuneWithCapo.corrected);
      });
    });
  });
}

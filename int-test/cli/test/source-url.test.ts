import { exec } from "child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createServer, Server } from "node:http";
import { createRequire } from "node:module";
import { AddressInfo } from "node:net";
import path from "node:path";
import { mkdirp } from "mkdirp";
import { rimraf } from "rimraf";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

const CLI_BIN = createRequire(import.meta.url).resolve("@odata2ts/odata2ts/lib/run-cli.js");
const WORK_DIR = path.join(import.meta.dirname, "..", "build", "source-url");

/**
 * `sourceUrl` and `refreshFile`: fetching the metadata instead of reading it from disk.
 *
 * Both belong to the generation *run* rather than to the generated code, and both are easy to get subtly
 * wrong in ways nothing else would notice - a download which silently re-fetches on every run, or one which
 * never refreshes although asked to. So this drives the real binary against a real HTTP server, counting
 * the requests it receives.
 */
describe("Source URL Test", () => {
  /** Served metadata, distinguishable from what a previous run may have stored. */
  const remoteMetadata = (serviceName: string) => `<?xml version="1.0" encoding="utf-8" ?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="${serviceName}" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="Item">
        <Key><PropertyRef Name="id" /></Key>
        <Property Name="id" Type="Edm.Int32" Nullable="false" />
      </EntityType>
      <EntityContainer Name="Container">
        <EntitySet Name="Items" EntityType="${serviceName}.Item" />
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

  let server: Server;
  let baseUrl: string;
  let requestedPaths: Array<string>;
  let servedServiceName: string;

  beforeAll(async () => {
    requestedPaths = [];
    servedServiceName = "Remote";
    server = createServer((req, res) => {
      requestedPaths.push(req.url ?? "");
      res.writeHead(200, { "Content-Type": "application/xml" });
      res.end(remoteMetadata(servedServiceName));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rimraf(WORK_DIR);
  });

  afterEach(async () => {
    requestedPaths = [];
    servedServiceName = "Remote";
    await rimraf(WORK_DIR);
  });

  test("the metadata is downloaded, stored at --source and generated from", async () => {
    const source = path.join(WORK_DIR, "downloaded.xml");
    const result = await runCli(["-u", baseUrl, "-s", source, "-o", path.join(WORK_DIR, "gen"), "-e", "ts"]);

    expect(result.code).toBe(0);
    // `$metadata` is appended by the generator - the option takes the service root
    expect(requestedPaths).toStrictEqual(["/$metadata"]);

    // stored on disk, which is what makes the next run offline
    expect(await readFile(source, "utf-8")).toContain('Namespace="Remote"');
    expect(await readFile(path.join(WORK_DIR, "gen", "RemoteService.ts"), "utf-8")).toContain("class RemoteService");
  });

  test("an existing file is used as it is, without asking the server again", async () => {
    const source = path.join(WORK_DIR, "existing.xml");
    await mkdirp(WORK_DIR);
    await writeFile(source, remoteMetadata("Local"), "utf-8");

    // the server would answer with something else entirely, so a re-fetch could not go unnoticed
    servedServiceName = "Remote";
    const result = await runCli(["-u", baseUrl, "-s", source, "-o", path.join(WORK_DIR, "gen"), "-e", "ts"]);

    expect(result.code).toBe(0);
    expect(requestedPaths).toStrictEqual([]);
    expect(await readFile(source, "utf-8")).toContain('Namespace="Local"');
    expect(await readFile(path.join(WORK_DIR, "gen", "LocalService.ts"), "utf-8")).toContain("class LocalService");
  });

  test("--refresh-file overwrites the existing file", async () => {
    const source = path.join(WORK_DIR, "stale.xml");
    await mkdirp(WORK_DIR);
    await writeFile(source, remoteMetadata("Local"), "utf-8");

    const result = await runCli([
      "-u",
      baseUrl,
      "-s",
      source,
      "-o",
      path.join(WORK_DIR, "gen"),
      "-e",
      "ts",
      "--refresh-file",
    ]);

    expect(result.code).toBe(0);
    expect(requestedPaths).toStrictEqual(["/$metadata"]);
    // the stale content is gone, and the generation used the fresh one
    expect(await readFile(source, "utf-8")).toContain('Namespace="Remote"');
    expect(await readFile(path.join(WORK_DIR, "gen", "RemoteService.ts"), "utf-8")).toContain("class RemoteService");
  });

  test("a URL already ending in $metadata is not given a second one", async () => {
    const source = path.join(WORK_DIR, "explicit.xml");
    const result = await runCli([
      "-u",
      `${baseUrl}/$metadata`,
      "-s",
      source,
      "-o",
      path.join(WORK_DIR, "gen"),
      "-e",
      "ts",
    ]);

    expect(result.code).toBe(0);
    expect(requestedPaths).toStrictEqual(["/$metadata"]);
  });
});

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runCli(args: Array<string>): Promise<CliResult> {
  return new Promise((resolve) => {
    exec(`node ${CLI_BIN} ${args.join(" ")}`, (error, stdout, stderr) => {
      resolve({ code: error && error.code ? error.code : 0, stdout, stderr });
    });
  });
}

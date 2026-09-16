import { describe, expect, it } from "vite-plus/test";
import { supportsWindowsMica } from "./windowBackdrop.ts";

describe("Windows Mica support", () => {
  it.each([
    ["win32", "10.0.22621", true],
    ["win32", "10.0.26100", true],
    ["win32", "10.0.22000", false],
    ["win32", "10.0.19045", false],
    ["win32", "unknown", false],
    ["linux", "10.0.26100", false],
    ["darwin", "24.0.0", false],
  ])("gates %s %s", (platform, release, supported) => {
    expect(supportsWindowsMica(platform, release)).toBe(supported);
  });
});

import { describe, expect, it } from "vite-plus/test";

import { resolveDesktopRemoteCorsHeaders } from "../vite/desktopRemoteCors";

describe("resolveDesktopRemoteCorsHeaders", () => {
  it.each(["t3code://app", "t3code-dev://app"])(
    "allows the packaged desktop origin %s",
    (origin) => {
      expect(resolveDesktopRemoteCorsHeaders({ origin, privateNetworkRequest: "true" })).toEqual({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Private-Network": "true",
      });
    },
  );

  it("does not reflect unrelated origins", () => {
    expect(
      resolveDesktopRemoteCorsHeaders({
        origin: "https://untrusted.example",
        privateNetworkRequest: "true",
      }),
    ).toEqual({});
  });

  it("omits private-network permission when it was not requested", () => {
    expect(
      resolveDesktopRemoteCorsHeaders({
        origin: "t3code://app",
        privateNetworkRequest: undefined,
      }),
    ).toEqual({
      "Access-Control-Allow-Origin": "t3code://app",
      "Access-Control-Allow-Credentials": "true",
    });
  });
});

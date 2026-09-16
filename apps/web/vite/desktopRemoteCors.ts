const DESKTOP_APP_ORIGINS = new Set(["t3code://app", "t3code-dev://app"]);

export function resolveDesktopRemoteCorsHeaders(input: {
  readonly origin: string | undefined;
  readonly privateNetworkRequest: string | undefined;
}): Readonly<Record<string, string>> {
  if (input.origin === undefined || !DESKTOP_APP_ORIGINS.has(input.origin)) return {};

  return {
    "Access-Control-Allow-Origin": input.origin,
    "Access-Control-Allow-Credentials": "true",
    ...(input.privateNetworkRequest?.toLowerCase() === "true"
      ? { "Access-Control-Allow-Private-Network": "true" }
      : {}),
  };
}

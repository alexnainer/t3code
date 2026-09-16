export const NATIVE_MICA_ARGUMENT = "--t3-native-mica";

export function supportsWindowsMica(platform: string, release: string): boolean {
  if (platform !== "win32") return false;
  const version = /^(\d+)\.(\d+)\.(\d+)(?:\.|$)/.exec(release);
  if (!version) return false;
  const major = Number(version[1]);
  const build = Number(version[3]);
  return major > 10 || (major === 10 && build >= 22621);
}

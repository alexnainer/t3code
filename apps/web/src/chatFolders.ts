import type { EnvironmentId, ProjectId, ServerSettings, ThreadId } from "@t3tools/contracts";

export type FolderThread = {
  readonly environmentId: EnvironmentId;
  readonly projectId: ProjectId;
  readonly id: ThreadId;
};

export function chatFolderKey(environmentId: EnvironmentId, folderId: string): string {
  return JSON.stringify([environmentId, folderId]);
}

export function getThreadChatFolderKey(
  thread: FolderThread,
  settings: Pick<ServerSettings, "chatFolders" | "chatFolderAssignments"> | undefined,
): string | null {
  const folderId = settings?.chatFolderAssignments[thread.id];
  if (!folderId || settings?.chatFolders[folderId]?.projectId !== thread.projectId) return null;
  return chatFolderKey(thread.environmentId, folderId);
}

export function groupThreadsByChatFolder<T extends FolderThread>(
  threads: readonly T[],
  getFolderKey: (thread: FolderThread) => string | null,
): Map<string | null, T[]> {
  const groups = new Map<string | null, T[]>();
  for (const thread of threads) {
    const key = getFolderKey(thread);
    const group = groups.get(key);
    if (group) group.push(thread);
    else groups.set(key, [thread]);
  }
  return groups;
}

export type ChatFolderMenuId = "chat-folder" | `chat-folder:${string}`;

export const CHAT_FOLDER_DROP_PREFIX = "chat-section:";
export const OTHER_CHATS_DROP_ID = "chat-sections:other";

export function resolveChatFolderDrop(
  thread: FolderThread,
  currentFolderKey: string | null,
  targetId: string,
  folders: readonly { id: string; environmentId: EnvironmentId; projectId: ProjectId }[],
): { folderId: string | null; key: string | null } | null {
  if (targetId === OTHER_CHATS_DROP_ID) {
    return currentFolderKey === null ? null : { folderId: null, key: null };
  }
  if (!targetId.startsWith(CHAT_FOLDER_DROP_PREFIX)) return null;
  const key = targetId.slice(CHAT_FOLDER_DROP_PREFIX.length);
  if (key === currentFolderKey) return null;
  const folder = folders.find(
    (candidate) =>
      candidate.environmentId === thread.environmentId &&
      candidate.projectId === thread.projectId &&
      chatFolderKey(candidate.environmentId, candidate.id) === key,
  );
  return folder ? { folderId: folder.id, key } : null;
}

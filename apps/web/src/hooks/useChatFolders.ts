import { useAtomValue } from "@effect/atom-react";
import type { ContextMenuItem, EnvironmentId, ServerSettingsPatch } from "@t3tools/contracts";
import { useCallback, useMemo } from "react";
import { environmentServerConfigsAtom, serverEnvironment } from "../state/server";
import { useAtomCommand } from "../state/use-atom-command";
import { getThreadChatFolderKey, type FolderThread, type ChatFolderMenuId } from "../chatFolders";

export function useChatFolders() {
  const configs = useAtomValue(environmentServerConfigsAtom);
  const update = useAtomCommand(serverEnvironment.updateSettings, "save chat sections");
  const save = useCallback(
    async (environmentId: EnvironmentId, patch: ServerSettingsPatch) => {
      const result = await update({ environmentId, input: { patch } });
      return result._tag === "Success";
    },
    [update],
  );
  const folders = useMemo(
    () =>
      [...configs]
        .flatMap(([environmentId, config]) =>
          config.environment.capabilities.chatFolders === true
            ? Object.entries(config.settings.chatFolders).map(([id, folder]) => ({
                ...folder,
                id,
                environmentId,
              }))
            : [],
        )
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    [configs],
  );
  const folderKey = useCallback(
    (thread: FolderThread) => {
      const config = configs.get(thread.environmentId);
      return config?.environment.capabilities.chatFolders === true
        ? getThreadChatFolderKey(thread, config.settings)
        : null;
    },
    [configs],
  );
  const menuItems = useCallback(
    (threads: readonly FolderThread[]): ContextMenuItem<ChatFolderMenuId>[] => {
      const thread = threads[0];
      if (
        !thread ||
        threads.some(
          (candidate) =>
            candidate.environmentId !== thread.environmentId ||
            candidate.projectId !== thread.projectId,
        )
      )
        return [];
      const config = configs.get(thread.environmentId);
      if (config?.environment.capabilities.chatFolders !== true) return [];
      const available = folders.filter(
        (folder) =>
          folder.environmentId === thread.environmentId && folder.projectId === thread.projectId,
      );
      if (available.length === 0) return [];
      const assignments = threads.map(
        (candidate) => config.settings.chatFolderAssignments[candidate.id],
      );
      return [
        {
          id: "chat-folder",
          label: "Move to section",
          icon: "folder",
          separatorBefore: true,
          children: [
            ...available.map((folder) => ({
              id: `chat-folder:${folder.id}` as const,
              label: folder.name,
              disabled: assignments.every((assigned) => assigned === folder.id),
            })),
            {
              id: "chat-folder:remove",
              label: "Remove from section",
              separatorBefore: true,
              disabled: assignments.every((assigned) => !assigned),
            },
          ],
        },
      ];
    },
    [configs, folders],
  );
  const move = useCallback(
    (thread: FolderThread, folderId: string | null) =>
      save(thread.environmentId, {
        chatFolderAssignments: { [thread.id]: folderId },
      }),
    [save],
  );
  return {
    configs,
    folders,
    folderKey,
    menuItems,
    move,
    save,
  };
}

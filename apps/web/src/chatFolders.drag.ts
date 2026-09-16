import { pointerWithin, type CollisionDetection } from "@dnd-kit/core";
import {
  CHAT_FOLDER_DROP_PREFIX,
  OTHER_CHATS_DROP_ID,
  resolveChatFolderDrop,
  type FolderThread,
} from "./chatFolders";

export function detectChatFolderCollision(
  args: Parameters<CollisionDetection>[0],
  input: {
    source: FolderThread;
    currentFolderKey: string | null;
    folders: Parameters<typeof resolveChatFolderDrop>[3];
    folderThreadIds: ReadonlySet<string>;
    otherChatDropIds: ReadonlySet<string>;
    lifecycleCollisionDetection: CollisionDetection;
  },
): ReturnType<CollisionDetection> {
  const isSection = (id: string) =>
    id.startsWith(CHAT_FOLDER_DROP_PREFIX) || id === OTHER_CHATS_DROP_ID;
  const sectionHits = pointerWithin({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) =>
      isSection(String(container.id)),
    ),
  });
  if (sectionHits.length > 0) {
    const validSectionHits = sectionHits.filter(
      (hit) =>
        resolveChatFolderDrop(
          input.source,
          input.currentFolderKey,
          String(hit.id),
          input.folders,
        ) !== null,
    );
    if (validSectionHits.length > 0) return validSectionHits;
    const isCurrentSectionHit =
      input.currentFolderKey !== null &&
      sectionHits.some(
        (hit) => String(hit.id) === `${CHAT_FOLDER_DROP_PREFIX}${input.currentFolderKey}`,
      );
    if (!isCurrentSectionHit) return [];
  }
  const folderThreadHits = pointerWithin({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) =>
      input.folderThreadIds.has(String(container.id)),
    ),
  });
  if (folderThreadHits.length > 0) {
    return folderThreadHits;
  }
  const mainListArgs = {
    ...args,
    droppableContainers: args.droppableContainers.filter((container) =>
      input.otherChatDropIds.has(String(container.id)),
    ),
  };
  // Leaving a user section changes membership, not pinned/snoozed/settled state.
  return input.currentFolderKey !== null
    ? pointerWithin(mainListArgs)
    : input.lifecycleCollisionDetection(mainListArgs);
}

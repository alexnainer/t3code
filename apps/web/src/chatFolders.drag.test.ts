import { describe, expect, it, vi } from "vite-plus/test";
import type { CollisionDetection } from "@dnd-kit/core";
import { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";
import { detectChatFolderCollision } from "./chatFolders.drag";
import { chatFolderKey, CHAT_FOLDER_DROP_PREFIX, OTHER_CHATS_DROP_ID } from "./chatFolders";

const environmentId = EnvironmentId.make("local");
const projectId = ProjectId.make("project");
const source = { environmentId, projectId, id: ThreadId.make("source") };
const folders = [{ environmentId, projectId, id: "reviews" }];
const folderKey = chatFolderKey(environmentId, "reviews");
const target = CHAT_FOLDER_DROP_PREFIX + folderKey;

function at(y: number, sectionHeight = 32): Parameters<CollisionDetection>[0] {
  const targets = [
    { id: target, top: 0, height: sectionHeight },
    { id: "folder-chat", top: 40, height: 32 },
    { id: OTHER_CHATS_DROP_ID, top: 200, height: 32 },
    { id: "main-chat", top: 240, height: 82 },
  ];
  const rects = targets.map(({ top, height }) => ({
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 260,
    width: 260,
  }));
  const collisionRect = rects[3]!;
  return {
    active: {
      id: "source",
      data: { current: {} },
      rect: { current: { initial: collisionRect, translated: collisionRect } },
    },
    collisionRect,
    pointerCoordinates: { x: 130, y },
    droppableRects: new Map(targets.map(({ id }, index) => [id, rects[index]!])),
    droppableContainers: targets.map(({ id }, index) => ({
      id,
      key: id,
      disabled: false,
      data: { current: {} },
      node: { current: null },
      rect: { current: rects[index]! },
    })),
  };
}
function input(currentFolderKey: string | null = null) {
  return {
    source,
    currentFolderKey,
    folders,
    folderThreadIds: new Set(["folder-chat"]),
    otherChatDropIds: new Set(["main-chat"]),
    lifecycleCollisionDetection: vi.fn<CollisionDetection>(() => [{ id: "main-chat" }]),
  };
}

describe("section drag collision detection", () => {
  it.each([32, 180])(
    "accepts a section header whether collapsed or expanded (height %s)",
    (height) => {
      const state = input();
      expect(detectChatFolderCollision(at(16, height), state).map((hit) => hit.id)).toEqual([
        target,
      ]);
      expect(state.lifecycleCollisionDetection).not.toHaveBeenCalled();
    },
  );
  it("accepts the chat area underneath an expanded section", () => {
    expect(detectChatFolderCollision(at(130, 180), input()).map((hit) => hit.id)).toEqual([target]);
  });
  it("does not fall through to a pin/unpin action over an invalid project section", () => {
    const state = { ...input(), source: { ...source, projectId: ProjectId.make("other") } };
    expect(detectChatFolderCollision(at(16), state)).toEqual([]);
    expect(state.lifecycleCollisionDetection).not.toHaveBeenCalled();
  });
  it("does not change lifecycle when dragging a section chat back onto the main list", () => {
    const state = input(folderKey);
    expect(detectChatFolderCollision(at(260), state).map((hit) => hit.id)).toEqual(["main-chat"]);
    expect(state.lifecycleCollisionDetection).not.toHaveBeenCalled();
  });
  it("targets another chat when reordering inside the current section", () => {
    expect(detectChatFolderCollision(at(56, 180), input(folderKey)).map((hit) => hit.id)).toEqual([
      "folder-chat",
    ]);
  });
  it("accepts Other chats even when the main list is empty", () => {
    const state = { ...input(folderKey), otherChatDropIds: new Set<string>() };
    expect(detectChatFolderCollision(at(216), state).map((hit) => hit.id)).toEqual([
      OTHER_CHATS_DROP_ID,
    ]);
  });
  it("preserves lifecycle collision detection when dragging within the main list", () => {
    const state = input();
    expect(detectChatFolderCollision(at(260), state)).toEqual([{ id: "main-chat" }]);
    expect(state.lifecycleCollisionDetection).toHaveBeenCalledWith(
      expect.objectContaining({
        droppableContainers: [expect.objectContaining({ id: "main-chat" })],
      }),
    );
  });
  it("does nothing when dropping back on the source section or outside the list", () => {
    expect(detectChatFolderCollision(at(16), input(folderKey))).toEqual([]);
    expect(detectChatFolderCollision(at(500), input(folderKey))).toEqual([]);
  });
});

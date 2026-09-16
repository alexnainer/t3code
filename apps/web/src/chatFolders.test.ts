import { describe, expect, it } from "vite-plus/test";
import { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";
import {
  chatFolderKey,
  getThreadChatFolderKey,
  groupThreadsByChatFolder,
  resolveChatFolderDrop,
  CHAT_FOLDER_DROP_PREFIX,
  OTHER_CHATS_DROP_ID,
} from "./chatFolders";

const environmentId = EnvironmentId.make("local");
const projectId = ProjectId.make("project-a");
const thread = { environmentId, projectId, id: ThreadId.make("chat") };
const settings = {
  chatFolders: { reviews: { projectId, name: "Reviews" }, ideas: { projectId, name: "Ideas" } },
  chatFolderAssignments: { [thread.id]: "reviews", idea: "ideas" },
};

describe("chat sections", () => {
  it("shows every chat exactly once across sections and the unassigned list", () => {
    const idea = { ...thread, id: ThreadId.make("idea") };
    const unassigned = { ...thread, id: ThreadId.make("unassigned") };
    const threads = [thread, unassigned, idea];
    const groups = groupThreadsByChatFolder(threads, (candidate) =>
      getThreadChatFolderKey(candidate, settings),
    );
    expect(groups.get(chatFolderKey(environmentId, "reviews"))).toEqual([thread]);
    expect(groups.get(chatFolderKey(environmentId, "ideas"))).toEqual([idea]);
    expect(groups.get(null)).toEqual([unassigned]);
    expect([...groups.values()].flat()).toHaveLength(threads.length);
  });
  it("preserves the incoming order within each section", () => {
    const other = { ...thread, id: ThreadId.make("other") };
    const groups = groupThreadsByChatFolder([other, thread], () => "reviews");
    expect(groups.get("reviews")).toEqual([other, thread]);
  });
  it("keeps identical folder and chat ids on different environments separate", () => {
    const remote = { ...thread, environmentId: EnvironmentId.make("remote") };
    const groups = groupThreadsByChatFolder([thread, remote], (candidate) =>
      getThreadChatFolderKey(candidate, settings),
    );
    expect(groups.size).toBe(2);
    expect(groups.get(chatFolderKey(remote.environmentId, "reviews"))).toEqual([remote]);
    expect(groups.get(chatFolderKey(environmentId, "reviews"))).toEqual([thread]);
  });
  it("leaves chats in the main list when the assignment belongs to another project", () => {
    expect(
      getThreadChatFolderKey({ ...thread, projectId: ProjectId.make("other") }, settings),
    ).toBeNull();
  });
  it("returns deleted sections and unavailable settings to the main list", () => {
    expect(getThreadChatFolderKey(thread, { ...settings, chatFolders: {} })).toBeNull();
    expect(getThreadChatFolderKey(thread, undefined)).toBeNull();
  });
  it("moves a chat between sections without retaining a duplicate", () => {
    const updated = { ...settings, chatFolderAssignments: { [thread.id]: "ideas" } };
    const groups = groupThreadsByChatFolder([thread], (candidate) =>
      getThreadChatFolderKey(candidate, updated),
    );
    expect(groups.has(chatFolderKey(environmentId, "reviews"))).toBe(false);
    expect(groups.get(chatFolderKey(environmentId, "ideas"))).toEqual([thread]);
  });
});

describe("drag chats between sections", () => {
  const folders = [
    { id: "reviews", environmentId, projectId },
    { id: "ideas", environmentId, projectId },
  ];
  const reviews = chatFolderKey(environmentId, "reviews");
  const ideas = chatFolderKey(environmentId, "ideas");
  it("moves unassigned chats and chats from another section to the drop target", () => {
    for (const source of [null, ideas]) {
      expect(
        resolveChatFolderDrop(thread, source, CHAT_FOLDER_DROP_PREFIX + reviews, folders),
      ).toEqual({ folderId: "reviews", key: reviews });
    }
  });
  it("removes the assignment when dropped on Other chats", () => {
    expect(resolveChatFolderDrop(thread, reviews, OTHER_CHATS_DROP_ID, folders)).toEqual({
      folderId: null,
      key: null,
    });
    expect(resolveChatFolderDrop(thread, null, OTHER_CHATS_DROP_ID, folders)).toBeNull();
  });
  it("ignores drops onto the existing section, stale sections, and lifecycle markers", () => {
    expect(
      resolveChatFolderDrop(thread, reviews, CHAT_FOLDER_DROP_PREFIX + reviews, folders),
    ).toBeNull();
    expect(resolveChatFolderDrop(thread, null, CHAT_FOLDER_DROP_PREFIX + reviews, [])).toBeNull();
    expect(resolveChatFolderDrop(thread, reviews, "pinned-header", folders)).toBeNull();
  });
  it("rejects a section from a different project or environment", () => {
    for (const destination of [
      { ...folders[0]!, projectId: ProjectId.make("other") },
      { ...folders[0]!, environmentId: EnvironmentId.make("remote") },
    ]) {
      expect(
        resolveChatFolderDrop(
          thread,
          null,
          CHAT_FOLDER_DROP_PREFIX + chatFolderKey(destination.environmentId, destination.id),
          [destination],
        ),
      ).toBeNull();
    }
  });
});

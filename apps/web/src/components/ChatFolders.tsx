import { useDroppable } from "@dnd-kit/core";
import type {
  EnvironmentProject,
  EnvironmentThreadShell,
} from "@t3tools/client-runtime/state/models";
import { ChevronDownIcon, ChevronRightIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { ensureLocalApi } from "../localApi";
import { cn, randomUUID } from "../lib/utils";
import { chatFolderKey, CHAT_FOLDER_DROP_PREFIX, OTHER_CHATS_DROP_ID } from "../chatFolders";
import { type useChatFolders } from "../hooks/useChatFolders";
import { toastManager } from "./ui/toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "./ui/select";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from "./ui/dialog";

type Folders = ReturnType<typeof useChatFolders>;
type Folder = Folders["folders"][number];

function SectionDropTarget({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      data-thread-selection-safe
      className={cn("mb-2 rounded-md", isOver && "bg-primary/5 ring-1 ring-primary/40")}
    >
      {children}
    </section>
  );
}

export function ChatFolders({
  folders,
  projects,
  threadsByFolder,
  collapsed,
  onToggle,
  onNewThread,
  renderThreads,
}: {
  folders: Folders;
  projects: readonly EnvironmentProject[];
  threadsByFolder: ReadonlyMap<string | null, readonly EnvironmentThreadShell[]>;
  collapsed: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onNewThread: (folder: Folder) => void;
  renderThreads: (folder: Folder, threads: readonly EnvironmentThreadShell[]) => ReactNode;
}) {
  const [editor, setEditor] = useState<{ folder: Folder | null } | null>(null);
  const supportedProjects = projects.filter(
    (project) =>
      folders.configs.get(project.environmentId)?.environment.capabilities.chatFolders === true,
  );
  const visibleFolders = folders.folders.filter((folder) =>
    supportedProjects.some(
      (project) =>
        project.environmentId === folder.environmentId && project.id === folder.projectId,
    ),
  );
  if (supportedProjects.length === 0) return null;
  const openMenu = async (folder: Folder, position: { x: number; y: number }) => {
    try {
      const api = ensureLocalApi();
      const choice = await api.contextMenu.show(
        [
          { id: "rename", label: "Rename section" },
          { id: "delete", label: "Delete section", destructive: true },
        ],
        position,
      );
      if (choice === "rename") setEditor({ folder });
      if (
        choice === "delete" &&
        (await api.dialogs.confirm(`Delete “${folder.name}”? The chats inside will be kept.`, {
          variant: "destructive",
        }))
      ) {
        await folders.save(folder.environmentId, { chatFolders: { [folder.id]: null } });
      }
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Could not update section",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };
  return (
    <li className="mb-2 list-none">
      <section aria-label="Chat sections">
        <div className="flex h-8 items-center justify-between px-2">
          <span className="text-xs font-medium text-sidebar-muted-foreground">Sections</span>
          <Button
            variant="ghost-muted"
            size="icon-xs"
            aria-label="New section"
            title="New section"
            onClick={() => setEditor({ folder: null })}
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </div>
        {visibleFolders.length === 0 ? (
          <p className="px-2.5 py-1 text-xs text-sidebar-muted-foreground">
            Create a section to organize your chats.
          </p>
        ) : null}
        {visibleFolders.map((folder) => {
          const key = chatFolderKey(folder.environmentId, folder.id);
          const expanded = !collapsed.has(key);
          const threads = threadsByFolder.get(key) ?? [];
          const project = supportedProjects.find(
            (candidate) =>
              candidate.environmentId === folder.environmentId && candidate.id === folder.projectId,
          );
          return (
            <SectionDropTarget
              key={key}
              id={`${CHAT_FOLDER_DROP_PREFIX}${key}`}
              label={folder.name}
            >
              <div
                data-chat-section-header
                className="flex items-center gap-1 rounded-md hover:bg-sidebar-row-hover"
                onContextMenu={(event) => {
                  event.preventDefault();
                  void openMenu(folder, { x: event.clientX, y: event.clientY });
                }}
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => onToggle(key)}
                  className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 text-left text-xs font-medium text-sidebar-muted-foreground outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {expanded ? (
                    <ChevronDownIcon className="size-3.5 shrink-0" />
                  ) : (
                    <ChevronRightIcon className="size-3.5 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {folder.name}
                    {supportedProjects.length > 1 ? (
                      <span className="font-normal"> · {project?.title}</span>
                    ) : null}
                  </span>
                  <span data-chat-section-count className="tabular-nums">
                    {threads.length}
                  </span>
                </button>
                <Button
                  variant="ghost-muted"
                  size="icon-xs"
                  aria-label={`New chat in ${folder.name}`}
                  title={`New chat in ${folder.name}`}
                  onClick={() => onNewThread(folder)}
                >
                  <PlusIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost-muted"
                  size="icon-xs"
                  className="mr-1"
                  aria-label={`Options for ${folder.name}`}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    void openMenu(folder, { x: rect.right, y: rect.bottom });
                  }}
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </Button>
              </div>
              {expanded ? (
                <ul className="flex flex-col gap-px">
                  {renderThreads(folder, threads)}
                </ul>
              ) : null}
            </SectionDropTarget>
          );
        })}
        {visibleFolders.length > 0 ? (
          <SectionDropTarget id={OTHER_CHATS_DROP_ID} label="Other chats">
            <div className="px-2 py-2 text-xs font-medium text-sidebar-muted-foreground">
              Other chats
            </div>
          </SectionDropTarget>
        ) : null}
        {editor ? (
          <FolderEditor
            key={editor.folder?.id ?? "new"}
            folder={editor.folder}
            projects={supportedProjects}
            folders={folders}
            onClose={() => setEditor(null)}
          />
        ) : null}
      </section>
    </li>
  );
}

function FolderEditor({
  folder,
  projects,
  folders,
  onClose,
}: {
  folder: Folder | null;
  projects: readonly EnvironmentProject[];
  folders: Folders;
  onClose: () => void;
}) {
  const nameId = useId();
  const [name, setName] = useState(folder?.name ?? "");
  const [projectKey, setProjectKey] = useState(
    folder
      ? `${folder.environmentId}:${folder.projectId}`
      : `${projects[0]?.environmentId}:${projects[0]?.id}`,
  );
  const [saving, setSaving] = useState(false);
  const project = projects.find(
    (candidate) => `${candidate.environmentId}:${candidate.id}` === projectKey,
  );
  const trimmedName = name.trim();
  const duplicate =
    project !== undefined &&
    folders.folders.some(
      (candidate) =>
        candidate.environmentId === project.environmentId &&
        candidate.projectId === project.id &&
        candidate.id !== folder?.id &&
        candidate.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
    );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogPopup className="sm:max-w-sm">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!project || !trimmedName || duplicate || saving) return;
            setSaving(true);
            const id = folder?.id ?? randomUUID();
            const saved = await folders.save(project.environmentId, {
              chatFolders: { [id]: { projectId: project.id, name: trimmedName } },
            });
            setSaving(false);
            if (saved) onClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>{folder ? "Rename section" : "New section"}</DialogTitle>
            <DialogDescription>Group chats under a sidebar heading.</DialogDescription>
          </DialogHeader>
          <DialogPanel className="space-y-3">
            {!folder && projects.length > 1 ? (
              <Select
                value={projectKey}
                onValueChange={(value) => {
                  if (value) setProjectKey(value);
                }}
              >
                <SelectTrigger aria-label="Project">
                  <SelectValue>{project?.title}</SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  {projects.map((candidate) => (
                    <SelectItem
                      key={`${candidate.environmentId}:${candidate.id}`}
                      value={`${candidate.environmentId}:${candidate.id}`}
                    >
                      {candidate.title}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor={nameId}>Section name</Label>
              <Input
                id={nameId}
                autoFocus
                maxLength={80}
                value={name}
                disabled={saving}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Research"
              />
            </div>
            {duplicate ? (
              <p role="alert" className="text-xs text-destructive">
                This project already has a section with that name.
              </p>
            ) : null}
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !project || !trimmedName || duplicate}>
              {saving ? "Saving…" : folder ? "Save" : "Create section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

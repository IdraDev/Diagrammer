import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import {
  ClipboardPaste,
  Download,
  FileJson,
  FilePlus2,
  FolderOpen,
  Github,
  Maximize2,
  Menu as MenuIcon,
  Minus,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { Flow } from "./flow/flow";
import {
  EdgePropertiesPanel,
  NodePropertiesPanel,
} from "./flow/properties-panel";
import {
  SHAPE_DRAG_TYPE,
  ShapePalette,
  type ShapeDragItem,
} from "./flow/shape-palette";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SkillDialog } from "./skill-dialog";
import { PasteDialog } from "./paste-dialog";
import { MenuDialog } from "./menu-dialog";
import { MapTypeIcon } from "./map-type-icon";
import {
  buildNode,
  deOverlapFlowNodes,
  flowToMap,
  mapToFlow,
  type StandardFlowEdge,
  type StandardFlowNode,
} from "@/lib/flow-adapter";
import {
  deleteRecent,
  getPrefs,
  getRecents,
  saveRecent,
  setPrefs,
  type RecentMap,
} from "@/lib/storage";
import {
  tryParseMap,
  type EdgeDirection,
  type EdgeStyle,
  type NodeShape,
  type MapDocument,
} from "@/lib/schema";
import { EXAMPLES, type ExampleEntry } from "@/lib/examples";
import { cn, downloadJson, slugify } from "@/lib/utils";
import { InlineMarkdown, stripMarkdown } from "@/lib/markdown";
import { useTheme } from "@/lib/theme";

interface ActiveMap {
  map: MapDocument;
  recent: RecentMap;
}

type SaveState = "idle" | "pending" | "saving";

const PERSIST_DEBOUNCE_MS = 600;

export function Studio() {
  const { theme, setTheme, isDark } = useTheme();
  const [active, setActive] = useState<ActiveMap | null>(null);
  const [recents, setRecents] = useState<RecentMap[]>([]);
  const [skillOpen, setSkillOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { fitView, setViewport, zoomIn, zoomOut, screenToFlowPosition } =
    useReactFlow();

  // React Flow state — owned at the Studio level so the properties panel and
  // toolbar can read/mutate it directly without round-tripping props.
  const [nodes, setNodes, onNodesChange] = useNodesState<StandardFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<StandardFlowEdge>([]);
  const [selection, setSelection] = useState<OnSelectionChangeParams>({
    nodes: [],
    edges: [],
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const activeRef = useRef<ActiveMap | null>(null);
  const persistRef = useRef<{
    active: ActiveMap;
    nodes: StandardFlowNode[];
    edges: StandardFlowEdge[];
  } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Restore the last opened map and the recents list on mount.
  useEffect(() => {
    const list = getRecents();
    setRecents(list);
    const lastId = getPrefs().lastOpenedId;
    if (lastId) {
      const r = list.find((x) => x.id === lastId);
      if (r) setActive({ map: r.map, recent: r });
    }
  }, []);

  // Persist the active map id between reloads.
  useEffect(() => {
    setPrefs({ lastOpenedId: active?.recent.id });
  }, [active]);

  // Tab title — strip markdown so the document title stays plain text.
  useEffect(() => {
    document.title = active
      ? `${stripMarkdown(active.map.title)} · Diagrammer`
      : "Diagrammer";
  }, [active]);

  // When the active map changes (different recent.id), seed RF state.
  useEffect(() => {
    if (!active) {
      seededRef.current = true;
      setNodes([]);
      setEdges([]);
      setIsEditing(false);
      setTitleEditing(false);
      return;
    }
    const graph = mapToFlow(active.map);
    seededRef.current = true;
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setTitleEditing(false);
    // Auto-enter edit mode for blank local maps.
    const isBlankLocal =
      active.recent.source === "local" && active.map.nodes.length <= 1;
    setIsEditing(isBlankLocal);
    // For freshly created blank docs keep zoom at 100% so the seed node
    // stays the size it will actually be at — don't auto-fit. For
    // populated maps, fit to content after the next paint.
    const t = setTimeout(() => {
      try {
        if (isBlankLocal) {
          setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
        } else {
          fitView({ padding: 0.18, duration: 250 });
        }
      } catch {
        // RF can throw if no nodes are measured yet — safe to ignore.
      }
    }, 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.recent.id]);

  // Synchronously persist any pending change. Safe to call repeatedly.
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const data = persistRef.current;
    if (!data) {
      setSaveState("idle");
      return;
    }
    persistRef.current = null;
    setSaveState("saving");
    const { active: a, nodes: n, edges: e } = data;
    const next = flowToMap(a.map, n, e);
    const updated = saveRecent({
      id: a.recent.id,
      title: next.title,
      type: next.type,
      nodeCount: next.nodes.length,
      edgeCount: next.edges.length,
      source: a.recent.source,
      fileName: a.recent.fileName,
      map: next,
    });
    setActive((prev) =>
      prev && prev.recent.id === updated.id
        ? { map: next, recent: updated }
        : prev,
    );
    setRecents(getRecents());
    setSaveState("idle");
  }, []);

  // Persist edits back to the recent (debounced). Skipped immediately after a
  // seed since the loaded content already matches what's on disk.
  useEffect(() => {
    if (seededRef.current) {
      seededRef.current = false;
      return;
    }
    const a = activeRef.current;
    if (!a) return;
    persistRef.current = { active: a, nodes, edges };
    setSaveState("pending");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSave, PERSIST_DEBOUNCE_MS);
  }, [nodes, edges, flushSave]);

  // Flush any pending save before the tab unloads, and confirm with the user
  // if a write is in flight.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (persistRef.current || saveTimerRef.current) {
        flushSave();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [flushSave]);

  const refreshRecents = useCallback(() => setRecents(getRecents()), []);

  // ---- Open helpers ----

  const openMap = useCallback(
    (
      map: MapDocument,
      source: RecentMap["source"],
      fileName: string | undefined,
    ) => {
      flushSave();
      const recent = saveRecent({
        title: map.title,
        type: map.type,
        nodeCount: map.nodes.length,
        edgeCount: map.edges.length,
        source,
        fileName,
        map,
      });
      setActive({ map, recent });
      setRecents(getRecents());
    },
    [flushSave],
  );

  const openExample = useCallback(
    (ex: ExampleEntry) => openMap(ex.map, "example", `${ex.slug}.json`),
    [openMap],
  );

  const openFromRecent = useCallback(
    (r: RecentMap) => {
      flushSave();
      setActive({ map: r.map, recent: r });
    },
    [flushSave],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file) return;
      const text = await file.text();
      const result = tryParseMap(text);
      if (!result.ok || !result.map) {
        alert(result.issues[0]?.message ?? "Invalid map file.");
        return;
      }
      openMap(result.map, "file", file.name);
    },
    [openMap],
  );

  const onPickFile = useCallback(() => fileInputRef.current?.click(), []);

  const onCloseMap = useCallback(() => {
    flushSave();
    setActive(null);
  }, [flushSave]);

  const onDownload = useCallback(() => {
    if (!active) return;
    const next = flowToMap(active.map, nodes, edges);
    downloadJson(`${slugify(stripMarkdown(next.title))}.json`, next);
  }, [active, edges, nodes]);

  const onNewMap = useCallback(() => {
    const seed = buildNode({
      id: `n_${Math.random().toString(36).slice(2, 8)}`,
      label: "Topic",
      shape: "rounded",
      emphasis: "strong",
    });
    const map: MapDocument = {
      version: "1",
      type: "mindmap",
      title: "Untitled map",
      nodes: [
        {
          id: seed.id,
          label: seed.label,
          shape: seed.shape,
          emphasis: seed.emphasis,
          x: 0,
          y: 0,
        },
      ],
      edges: [],
    };
    openMap(map, "local", undefined);
  }, [openMap]);

  // ---- React Flow event handlers ----

  const handleNodesChange = useCallback(
    (changes: NodeChange<StandardFlowNode>[]) => {
      // Block destructive edits when not in edit mode.
      const filtered = isEditing
        ? changes
        : changes.filter((c) => c.type === "select" || c.type === "dimensions");
      onNodesChange(filtered);
      // After a drag ends, push apart anything that ended up overlapping.
      // The dragged node stays pinned where the user dropped it.
      const endedDrag = filtered.find(
        (c) => c.type === "position" && c.dragging === false,
      );
      if (endedDrag && endedDrag.type === "position") {
        const pinId = endedDrag.id;
        setNodes((ns) => deOverlapFlowNodes(ns, pinId));
      }
      // Dimension changes (after RF measures) can reveal overlaps that the
      // initial unmeasured layout didn't catch.
      const dim = filtered.some((c) => c.type === "dimensions");
      if (dim) {
        setNodes((ns) => deOverlapFlowNodes(ns));
      }
    },
    [isEditing, onNodesChange, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<StandardFlowEdge>[]) => {
      const filtered = isEditing
        ? changes
        : changes.filter((c) => c.type === "select");
      onEdgesChange(filtered);
    },
    [isEditing, onEdgesChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isEditing) return;
      setEdges((eds) =>
        addEdge<StandardFlowEdge>(
          {
            ...connection,
            type: "standard",
            data: { style: "solid", direction: "forward" },
          },
          eds,
        ),
      );
    },
    [isEditing, setEdges],
  );

  const onSelectionChange = useCallback((s: OnSelectionChangeParams) => {
    setSelection({ nodes: s.nodes, edges: s.edges });
  }, []);

  const onPaneClick = useCallback(() => {
    if (titleEditing) setTitleEditing(false);
  }, [titleEditing]);

  const onNodeLabelChange = useCallback(
    (id: string, label: string) => {
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
      );
    },
    [setNodes],
  );

  // ---- Editor toolbar actions ----

  const addNodeAt = useCallback(
    (flowPosition: { x: number; y: number }, shape?: NodeShape) => {
      const id = `n_${Math.random().toString(36).slice(2, 8)}`;
      const built = buildNode({
        id,
        label: "New node",
        shape: shape ?? "rounded",
      });
      setNodes((ns) => {
        const withNew = ns
          .map((n) => ({ ...n, selected: false }))
          .concat([
            {
              id,
              type: "standard" as const,
              position: {
                x: flowPosition.x - built.width / 2,
                y: flowPosition.y - built.height / 2,
              },
              width: built.width,
              height: built.height,
              selected: true,
              data: {
                label: built.label,
                shape: built.shape ?? "rounded",
                color: built.color ?? "default",
                emphasis: built.emphasis ?? "normal",
                width: built.width,
                height: built.height,
              },
            },
          ]);
        // Pin the new node to the click/drop location; existing nodes shift
        // out of the way if the user dropped on top of one.
        return deOverlapFlowNodes(withNew, id);
      });
    },
    [setNodes],
  );

  const addNode = useCallback(
    (shape?: NodeShape) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const screenCenter = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const flowCenter = screenToFlowPosition(screenCenter);
      addNodeAt(flowCenter, shape);
    },
    [addNodeAt, screenToFlowPosition],
  );

  const updateSelectedNode = useCallback(
    (patch: Partial<StandardFlowNode["data"]>) => {
      const id = selection.nodes[0]?.id;
      if (!id) return;
      setNodes((ns) =>
        ns.map((n) => {
          if (n.id !== id) return n;
          const data = { ...n.data, ...patch };
          // Re-measure if the label or description changed.
          if ("label" in patch || "description" in patch) {
            const rebuilt = buildNode({
              id,
              label: data.label,
              description: data.description,
              shape: data.shape,
              color: data.color,
              emphasis: data.emphasis,
            });
            data.width = rebuilt.width;
            data.height = rebuilt.height;
            return {
              ...n,
              width: rebuilt.width,
              height: rebuilt.height,
              data,
            };
          }
          return { ...n, data };
        }),
      );
    },
    [selection.nodes, setNodes],
  );

  const deleteSelectedNode = useCallback(() => {
    const id = selection.nodes[0]?.id;
    if (!id) return;
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
  }, [selection.nodes, setNodes, setEdges]);

  const updateSelectedEdge = useCallback(
    (patch: {
      label?: string;
      style?: EdgeStyle;
      direction?: EdgeDirection;
    }) => {
      const id = selection.edges[0]?.id;
      if (!id) return;
      setEdges((es) =>
        es.map((e) => {
          if (e.id !== id) return e;
          const next: StandardFlowEdge = { ...e };
          if ("label" in patch) {
            next.label =
              patch.label && patch.label.length > 0 ? patch.label : undefined;
          }
          if (patch.style || patch.direction) {
            next.data = {
              style: patch.style ?? e.data?.style ?? "solid",
              direction: patch.direction ?? e.data?.direction ?? "forward",
            };
          }
          return next;
        }),
      );
    },
    [selection.edges, setEdges],
  );

  const deleteSelectedEdge = useCallback(() => {
    const id = selection.edges[0]?.id;
    if (!id) return;
    setEdges((es) => es.filter((e) => e.id !== id));
  }, [selection.edges, setEdges]);

  const onRenameTitle = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      if (!active || trimmed.length === 0 || trimmed === active.map.title) {
        setTitleEditing(false);
        return;
      }
      const updatedMap = { ...active.map, title: trimmed };
      const updatedRecent = saveRecent({
        id: active.recent.id,
        title: trimmed,
        type: updatedMap.type,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        source: active.recent.source,
        fileName: active.recent.fileName,
        map: flowToMap(updatedMap, nodes, edges),
      });
      setActive({ map: updatedMap, recent: updatedRecent });
      setRecents(getRecents());
      setTitleEditing(false);
    },
    [active, edges, nodes],
  );

  const selectedNode = useMemo(() => {
    if (selection.nodes.length === 0) return null;
    return nodes.find((n) => n.id === selection.nodes[0].id) ?? null;
  }, [nodes, selection.nodes]);

  const selectedEdge = useMemo(() => {
    if (selection.edges.length === 0) return null;
    return edges.find((e) => e.id === selection.edges[0].id) ?? null;
  }, [edges, selection.edges]);

  const showPropertiesPanel = isEditing && (selectedNode || selectedEdge);

  const [{ isOverFile }, drop] = useDrop<
    { files: File[] } | ShapeDragItem,
    void,
    { isOverFile: boolean }
  >(
    () => ({
      accept: [NativeTypes.FILE, SHAPE_DRAG_TYPE],
      drop: (item, monitor) => {
        const type = monitor.getItemType();
        const offset = monitor.getClientOffset();
        if (type === NativeTypes.FILE) {
          const fileItem = item as { files: File[] };
          if (fileItem.files && fileItem.files.length > 0) {
            void handleFiles(fileItem.files);
          }
          return;
        }
        if (type === SHAPE_DRAG_TYPE && offset) {
          if (!isEditing || !active) return;
          const flowPos = screenToFlowPosition({ x: offset.x, y: offset.y });
          addNodeAt(flowPos, (item as ShapeDragItem).shape);
        }
      },
      collect: (monitor) => ({
        isOverFile:
          monitor.canDrop() &&
          monitor.isOver() &&
          monitor.getItemType() === NativeTypes.FILE,
      }),
    }),
    [active, addNodeAt, handleFiles, isEditing, screenToFlowPosition],
  );

  useEffect(() => {
    drop(containerRef);
  }, [drop]);

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="relative h-screen w-full overflow-hidden"
      >
        <Flow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onNodeLabelChange={onNodeLabelChange}
          isDark={isDark}
          isEditing={isEditing}
        />

        {/* Top-left island */}
        <div className="absolute left-3 top-3 flex max-w-[min(60%,520px)] items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-card)/90 p-1 shadow-sm backdrop-blur">
          <Tooltip label="Menu">
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </Button>
          </Tooltip>
          <div className="flex items-center gap-1.5 px-1.5">
            <Logo />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              Diagrammer
            </span>
          </div>
          {active ? (
            <>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <div className="flex min-w-0 items-center gap-1.5 px-1.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-(--color-border) bg-(--color-muted) text-muted-foreground">
                  <MapTypeIcon type={active.map.type} />
                </div>
                {titleEditing ? (
                  <input
                    autoFocus
                    defaultValue={active.map.title}
                    onBlur={(e) => onRenameTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        onRenameTitle((e.target as HTMLInputElement).value);
                      if (e.key === "Escape") setTitleEditing(false);
                    }}
                    className="min-w-0 max-w-[260px] rounded-md border border-(--color-border) bg-(--color-background) px-1.5 py-0.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => isEditing && setTitleEditing(true)}
                    disabled={!isEditing}
                    aria-label={isEditing ? "Rename map" : undefined}
                    className={cn(
                      "truncate text-sm font-medium",
                      isEditing
                        ? "cursor-pointer hover:underline"
                        : "cursor-default disabled:opacity-100",
                    )}
                    title={
                      isEditing
                        ? "Click to rename"
                        : stripMarkdown(active.map.title)
                    }
                  >
                    <InlineMarkdown text={active.map.title} />
                  </button>
                )}
                <Badge
                  variant="muted"
                  className="ml-1 hidden font-mono sm:inline-flex"
                >
                  {active.map.type}
                </Badge>
                <SaveIndicator state={saveState} />
              </div>
            </>
          ) : null}
        </div>

        {/* Top-right island */}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-card)/90 p-1 shadow-sm backdrop-blur">
          {active ? (
            <>
              <Tooltip label={isEditing ? "View mode" : "Edit mode"}>
                <Button
                  variant={isEditing ? "default" : "ghost"}
                  size="iconSm"
                  aria-pressed={isEditing}
                  aria-label={
                    isEditing ? "Switch to view mode" : "Switch to edit mode"
                  }
                  onClick={() => setIsEditing((v) => !v)}
                >
                  <Pencil />
                </Button>
              </Tooltip>
              {isEditing ? (
                <Tooltip label="Add node">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label="Add node"
                    onClick={() => addNode()}
                  >
                    <Plus />
                  </Button>
                </Tooltip>
              ) : null}
              <Separator orientation="vertical" className="mx-0.5 h-5" />
            </>
          ) : null}
          <Tooltip label="New map">
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="New map"
              onClick={onNewMap}
            >
              <FilePlus2 />
            </Button>
          </Tooltip>
          <Tooltip label="Open file">
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="Open file"
              onClick={onPickFile}
            >
              <FolderOpen />
            </Button>
          </Tooltip>
          <Tooltip label="Paste JSON">
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="Paste JSON"
              onClick={() => setPasteOpen(true)}
            >
              <ClipboardPaste />
            </Button>
          </Tooltip>
          <Tooltip label="Authoring skill">
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="Authoring skill"
              onClick={() => setSkillOpen(true)}
            >
              <Sparkles />
            </Button>
          </Tooltip>
          {active ? (
            <Tooltip label="Download JSON">
              <Button
                variant="ghost"
                size="iconSm"
                aria-label="Download"
                onClick={onDownload}
              >
                <Download />
              </Button>
            </Tooltip>
          ) : null}
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <Tooltip label="GitHub">
            <Button variant="ghost" size="iconSm" aria-label="GitHub" asChild>
              <a
                href="https://github.com/IdraDev/diagrammer/"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Github />
              </a>
            </Button>
          </Tooltip>
          {active ? (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-5" />
              <Tooltip label="Close map">
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label="Close map"
                  onClick={onCloseMap}
                >
                  <X />
                </Button>
              </Tooltip>
            </>
          ) : null}
        </div>

        {/* Bottom-center shape palette (edit mode only) */}
        {active && isEditing ? (
          <ShapePalette onClick={(shape) => addNode(shape)} />
        ) : null}

        {/* Bottom-right zoom island */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-card)/90 p-1 shadow-sm backdrop-blur">
          <Tooltip label="Zoom out  −">
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="Zoom out"
              onClick={() => zoomOut({ duration: 120 })}
            >
              <Minus />
            </Button>
          </Tooltip>
          <Tooltip label="Fit  0">
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="Fit to view"
              onClick={() => fitView({ padding: 0.18, duration: 200 })}
            >
              <Maximize2 />
            </Button>
          </Tooltip>
          <Tooltip label="Zoom in  +">
            <Button
              variant="ghost"
              size="iconSm"
              aria-label="Zoom in"
              onClick={() => zoomIn({ duration: 120 })}
            >
              <Plus />
            </Button>
          </Tooltip>
        </div>

        {/* Right-side properties panel during edit */}
        {showPropertiesPanel ? (
          <div className="scrollbar-thin absolute right-3 top-16 max-h-[calc(100vh-140px)] w-72 overflow-auto rounded-lg border border-(--color-border) bg-(--color-card)/95 p-4 shadow-sm backdrop-blur">
            {selectedNode ? (
              <NodePropertiesPanel
                node={selectedNode}
                isDark={isDark}
                onChange={updateSelectedNode}
                onDelete={deleteSelectedNode}
              />
            ) : selectedEdge ? (
              <EdgePropertiesPanel
                edge={selectedEdge}
                onChange={updateSelectedEdge}
                onDelete={deleteSelectedEdge}
              />
            ) : null}
          </div>
        ) : null}

        {/* Empty state */}
        {!active ? (
          <EmptyState
            onPickFile={onPickFile}
            onPaste={() => setPasteOpen(true)}
            onSkill={() => setSkillOpen(true)}
            onNewMap={onNewMap}
            onPickExample={openExample}
          />
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />

        {isOverFile ? (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-(--color-background)/80 backdrop-blur-sm">
            <div className="rounded-lg border-2 border-dashed border-(--color-foreground)/40 px-8 py-6 text-center">
              <FileJson className="mx-auto mb-2 size-6" />
              <p className="text-sm font-medium">Drop a Diagrammer JSON file</p>
            </div>
          </div>
        ) : null}

        <SkillDialog open={skillOpen} onOpenChange={setSkillOpen} />
        <PasteDialog
          open={pasteOpen}
          onOpenChange={setPasteOpen}
          onLoad={(map) => openMap(map, "paste", undefined)}
        />
        <MenuDialog
          open={menuOpen}
          onOpenChange={setMenuOpen}
          recents={recents}
          onOpenRecent={(r) => {
            openFromRecent(r);
            setMenuOpen(false);
          }}
          onDeleteRecent={(id) => {
            deleteRecent(id);
            refreshRecents();
          }}
          onOpenExample={(ex) => {
            openExample(ex);
            setMenuOpen(false);
          }}
          onPickFile={() => {
            setMenuOpen(false);
            onPickFile();
          }}
          onPaste={() => {
            setMenuOpen(false);
            setPasteOpen(true);
          }}
          onSkill={() => {
            setMenuOpen(false);
            setSkillOpen(true);
          }}
          onNewMap={() => {
            setMenuOpen(false);
            onNewMap();
          }}
        />
      </div>
    </TooltipProvider>
  );
}

function EmptyState({
  onPickFile,
  onPaste,
  onSkill,
  onNewMap,
  onPickExample,
}: {
  onPickFile: () => void;
  onPaste: () => void;
  onSkill: () => void;
  onNewMap: () => void;
  onPickExample: (ex: ExampleEntry) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
      <div className="pointer-events-auto flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-card) text-(--color-foreground) shadow-sm">
          <Logo size={26} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Diagrammer
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Open a JSON map your model authored, or build one by hand on the
          canvas.
        </p>
        <p className="mt-3 max-w-sm rounded-md border border-(--color-border) bg-(--color-muted)/40 px-3 py-2 text-[11px] text-muted-foreground">
          <strong className="text-(--color-foreground)">
            No backend yet.
          </strong>{" "}
          Maps live in your browser only — export anything you want to keep.
          Persistent storage is on the roadmap, after the viewer + schema work.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onNewMap} className="gap-2">
            <FilePlus2 />
            New map
          </Button>
          <Button variant="outline" onClick={onPickFile} className="gap-2">
            <FolderOpen />
            Open file
          </Button>
          <Button variant="outline" onClick={onPaste} className="gap-2">
            <ClipboardPaste />
            Paste JSON
          </Button>
          <Button variant="outline" onClick={onSkill} className="gap-2">
            <Sparkles />
            Copy skill
          </Button>
        </div>
        <div className="mt-8 flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-(--color-border)" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            or try an example
          </span>
          <span className="h-px flex-1 bg-(--color-border)" />
        </div>
        <div className="mt-4 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.slug}
              type="button"
              onClick={() => onPickExample(ex)}
              className="group flex flex-col items-center gap-1.5 rounded-md border border-(--color-border) bg-(--color-card) p-3 transition-colors hover:border-(--color-foreground)/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-7 items-center justify-center rounded-md border border-(--color-border) bg-(--color-muted) text-muted-foreground transition-colors group-hover:text-(--color-foreground)">
                <MapTypeIcon type={ex.map.type} />
              </div>
              <span className="text-xs font-medium">{ex.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-[11px] text-muted-foreground">
          drag a <code className="font-mono">.json</code> file anywhere on this
          page
        </p>
      </div>
    </div>
  );
}

function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="5" r="1.6" />
      <circle cx="20" cy="5" r="1.6" />
      <circle cx="4" cy="19" r="1.6" />
      <circle cx="20" cy="19" r="1.6" />
      <line x1="9.6" y1="10.6" x2="5.2" y2="6" />
      <line x1="14.4" y1="10.6" x2="18.8" y2="6" />
      <line x1="9.6" y1="13.4" x2="5.2" y2="18" />
      <line x1="14.4" y1="13.4" x2="18.8" y2="18" />
    </svg>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const label = state === "saving" ? "Salvataggio…" : "Modifiche non salvate";
  return (
    <span
      className="ml-1 hidden items-center gap-1 rounded-md border border-(--color-border) bg-(--color-muted)/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex"
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          state === "saving"
            ? "animate-pulse bg-amber-500"
            : "bg-(--color-foreground)/40",
        )}
      />
      {label}
    </span>
  );
}

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: "system" | "light" | "dark";
  setTheme: (t: "system" | "light" | "dark") => void;
}) {
  const order: ("system" | "light" | "dark")[] = ["light", "dark", "system"];
  const next = order[(order.indexOf(theme) + 1) % order.length];
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <Tooltip label={`Theme: ${theme} (click for ${next})`}>
      <Button
        variant="ghost"
        size="iconSm"
        onClick={() => setTheme(next)}
        aria-label="Toggle theme"
      >
        <Icon />
      </Button>
    </Tooltip>
  );
}

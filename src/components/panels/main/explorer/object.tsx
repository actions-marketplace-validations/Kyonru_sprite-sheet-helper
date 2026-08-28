import * as React from "react";
import {
  UncontrolledTreeEnvironment,
  Tree,
  InteractionMode,
  type TreeDataProvider,
  type TreeItemIndex,
  type TreeItem,
} from "react-complex-tree";
import { useEntitiesStore } from "@/store/next/entities";
import { useSetEntityChildren } from "@/hooks/next/use-set-entity-children";
import { ItemTypeIconMap } from "./constants";
import { cn } from "@/lib/utils";
import { Boxes, Eye, EyeOff, ListTree, Trash2Icon } from "lucide-react";
import { confirm } from "@/components/confirm";
import { PanelEmpty } from "@/components/panels/panel-empty";
import { PanelHeader } from "@/components/panels/panel-header";
import { useRemoveEntity } from "@/hooks/next/use-remove-entity";
import type { Entity } from "@/types/ecs";

type SceneTreeItem = TreeItem<string> & { type: string };

export const ObjectExplorer = () => {
  const entities = useEntitiesStore((state) => state.entities);
  const children = useEntitiesStore((state) => state.children);
  const selected = useEntitiesStore((state) => state.selected);
  const setChildren = useSetEntityChildren();
  const selectEntity = useEntitiesStore((state) => state.selectEntity);
  const unselectEntity = useEntitiesStore((state) => state.unselectEntity);
  const removeEntity = useRemoveEntity();
  const setVisibility = useEntitiesStore((state) => state.setVisibility);

  const dataProvider = React.useMemo(() => {
    const data: Record<string, TreeItem<string> & { type: string }> = {
      root: {
        index: "root",
        isFolder: true,
        children: Object.keys(entities),
        data: "Root item",
        type: "root",
      },
    };
    const hasParent = new Set<string>();

    Object.entries(entities).forEach(([uuid, entity]) => {
      const entityChildren = Object.keys(children[uuid] ?? {}).filter(
        (child) => child !== uuid,
      );

      entityChildren.forEach((child) => hasParent.add(child));

      data[uuid] = {
        index: uuid,
        // TODO: Re-enable folder when parents are supported
        isFolder: false,
        children: entityChildren,
        data: entity.name,
        type: (entity.metadata?.type as string) || entity.type,
      };
    });

    // Only keep top-level entities at root (those without a parent)
    data["root"].children = Object.keys(entities).filter(
      (uuid) => !hasParent.has(uuid),
    );

    class CustomDataProviderImplementation<T> implements TreeDataProvider {
      data = { ...data };

      treeChangeListeners: Array<(changedItemIds: TreeItemIndex[]) => void> =
        [];

      async getTreeItem(itemId: TreeItemIndex) {
        return this.data[itemId];
      }

      async onChangeItemChildren(
        itemId: TreeItemIndex,
        newChildren: TreeItemIndex[],
      ) {
        this.data[itemId].children = newChildren;
        setChildren(itemId as string, newChildren as string[]);

        this.treeChangeListeners.forEach((listener) => listener([itemId]));
      }

      onDidChangeTreeData(listener: (changedItemIds: TreeItemIndex[]) => void) {
        this.treeChangeListeners.push(listener);
        return {
          dispose: () =>
            this.treeChangeListeners.splice(
              this.treeChangeListeners.indexOf(listener),
              1,
            ),
        };
      }

      async onRenameItem(item: TreeItem<T>, name: string) {
        this.data[item.index].data = name;
      }

      refresh() {
        this.treeChangeListeners.forEach((listener) => listener(["root"]));
      }
    }
    return new CustomDataProviderImplementation();
  }, [entities, children, setChildren]);

  React.useEffect(() => {
    dataProvider.refresh();
  }, [dataProvider, entities, children]);

  const onDelete = (title: string, data: TreeItem<string>) => {
    confirm.delete(title, {
      onConfirm: () => {
        removeEntity(data.index as string);
      },
    });
  };

  const onToggleVisibility = (
    event: React.MouseEvent,
    entity?: Entity,
  ) => {
    if (!entity) return;

    event.preventDefault();
    event.stopPropagation();
    setVisibility(entity.uuid, entity.visible === false);
  };

  const entityCount = Object.keys(entities).length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PanelHeader
        icon={ListTree}
        title="Scene"
        hint={
          entityCount > 0
            ? `${entityCount} object${entityCount === 1 ? "" : "s"}`
            : undefined
        }
        className="border-b"
      />

      {entityCount === 0 ? (
        <PanelEmpty
          icon={Boxes}
          title="Empty scene"
          description="Import a model to start posing and capturing frames."
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-1">
          <UncontrolledTreeEnvironment
            key={selected}
            dataProvider={dataProvider}
            getItemTitle={(item) => item.data}
            viewState={{
              "object-tree": {
                selectedItems: [selected ? selected : ""],
              },
            }}
            canDragAndDrop={false}
            canDropOnFolder={false}
            canReorderItems={false}
            onSelectItems={(item) => {
              if (item.length === 0 || item[0] === selected) {
                unselectEntity();
                return;
              }

              selectEntity(item[0] as string);
            }}
            defaultInteractionMode={InteractionMode.ClickItemToExpand}
            renderItemTitle={({ title, item, context }) => {
              const type = (item as SceneTreeItem).type;
              const entity = entities[item.index as string];
              const isHidden = entity?.visible === false;

              return (
                <div className="group relative flex w-full min-w-0 items-center">
                  <span
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground",
                      context.isSelected && "font-medium text-foreground",
                      isHidden && "opacity-60",
                    )}
                  >
                    {ItemTypeIconMap[type]}
                    <span className="truncate">{title}</span>
                  </span>
                  <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                    {type === "model" && (
                      <button
                        type="button"
                        title={isHidden ? "Show model" : "Hide model"}
                        aria-label={
                          isHidden ? `Show ${title}` : `Hide ${title}`
                        }
                        onClick={(event) => onToggleVisibility(event, entity)}
                        className={cn(
                          "inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground",
                          isHidden
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        {isHidden ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    )}
                    {type !== "camera" && (
                      <button
                        type="button"
                        title={`Delete ${title}`}
                        aria-label={`Delete ${title}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onDelete(title, item);
                        }}
                        className="inline-flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            }}
          >
            <Tree
              treeId="object-tree"
              rootItem="root"
              treeLabel="Scene objects"
            />
          </UncontrolledTreeEnvironment>
        </div>
      )}
    </div>
  );
};

import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  PanelTabsList,
  PanelTabsTrigger,
} from "@/components/panels/panel-tabs";
import { PanelEmpty } from "@/components/panels/panel-empty";
import { ObjectContext } from "./object";
import { useEntitiesStore, useEntity } from "@/store/next/entities";
import { capitalize } from "@/utils/strings";
import { useMemo } from "react";
import { AnimationContext } from "./animation";
import { useLight } from "@/store/next/lights";
import { TargetContext } from "./target";
import { MaterialContext } from "./material";
import { ItemTypeIconMap } from "../../explorer/constants";
import { BoxIcon, MousePointerClick } from "lucide-react";

const getTabs = (kind?: string, type?: string) => {
  const tabs: {
    value: string;
    label: string;
  }[] = [];

  if (kind === "model") {
    tabs.push({
      value: "animation",
      label: "Animation",
    });
    tabs.push({
      value: "material",
      label: "Material",
    });
  }

  if (kind === "camera") {
    tabs.push({
      value: "target",
      label: "Target",
    });
  }

  if (kind === "light" && type !== "ambient" && type !== "point") {
    tabs.push({
      value: "target",
      label: "Target",
    });
  }

  return tabs;
};

const TypeBasedTabs = ({ type }: { type: string }) => {
  if (type === "animation") {
    return <AnimationContext />;
  }

  if (type === "target") {
    return <TargetContext />;
  }

  if (type === "material") {
    return <MaterialContext />;
  }

  return null;
};

export const ExplorerTabs = () => {
  const selected = useEntitiesStore((state) => state.selected);
  const entity = useEntity(selected);
  const light = useLight(selected);

  const tabs = useMemo(
    () => getTabs(entity?.type, light?.type),
    [entity, light],
  );

  if (!selected || !entity) {
    return (
      <PanelEmpty
        icon={MousePointerClick}
        title="Nothing selected"
        description="Pick an object in the scene tree to inspect it."
      />
    );
  }

  const iconType = (entity.metadata?.type as string) || entity.type;
  const typeLabel = light
    ? `${capitalize(entity.type, true)} · ${capitalize(light.type, true)}`
    : capitalize(entity.type, true);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* The selected object names itself once, at the top of the pane; the
          tabs below it are all about this one thing, so they need no repeat. */}
      <div className="flex min-h-9 shrink-0 items-center gap-2 border-b px-3 py-2">
        <span className="shrink-0 text-muted-foreground [&_svg]:size-3.5">
          {ItemTypeIconMap[iconType] ?? <BoxIcon className="size-3.5" />}
        </span>
        <span className="truncate text-xs font-semibold tracking-wide">
          {entity.name}
        </span>
        <span className="ml-auto shrink-0 truncate text-[11px] text-muted-foreground">
          {typeLabel}
        </span>
      </div>
      <Tabs
        key={selected}
        defaultValue="object"
        className="flex min-h-0 w-full flex-1 flex-col gap-0"
      >
        <div className="shrink-0 px-3 py-2">
          <PanelTabsList>
            <PanelTabsTrigger value="object">Object</PanelTabsTrigger>
            {tabs.map((tab) => (
              <PanelTabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </PanelTabsTrigger>
            ))}
          </PanelTabsList>
        </div>
        <TabsContent
          value="object"
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 no-scrollbar"
        >
          <ObjectContext />
        </TabsContent>
        {tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 no-scrollbar"
          >
            <TypeBasedTabs key={tab.value} type={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

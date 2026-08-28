import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  PanelTabsList,
  PanelTabsTrigger,
} from "@/components/panels/panel-tabs";
import { useMainPanelStore, type MainPanelTab } from "../store";
import { ObjectExplorer } from "./object";
import { EffectsExplorer } from "./effects";

export const FileExplorer = () => {
  const setTab = useMainPanelStore((state) => state.setTab);
  const selected = useMainPanelStore((state) => state.tab);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs
        value={selected}
        defaultValue="explorer"
        className="flex h-full min-h-0 flex-col gap-0"
        onValueChange={(value) => setTab(value as MainPanelTab)}
      >
        {/* This strip switches what *both* panes of the left rail show, so it
            sits above them at the very top of the column rather than inside
            either one. */}
        <div className="flex min-h-9 shrink-0 items-center px-3 py-1">
          <PanelTabsList className="grid grid-cols-2">
            <PanelTabsTrigger value="explorer">Explorer</PanelTabsTrigger>
            <PanelTabsTrigger value="effects">Effects</PanelTabsTrigger>
          </PanelTabsList>
        </div>
        <TabsContent
          value="explorer"
          className="min-h-0 flex-1 overflow-hidden"
        >
          <ObjectExplorer />
        </TabsContent>
        <TabsContent value="effects" className="min-h-0 flex-1 overflow-hidden">
          <EffectsExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

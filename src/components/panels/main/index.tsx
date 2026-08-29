import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileExplorer } from "./explorer/index";
import { SelectedObjectTabs } from "./selected";

const MainPanel = () => {
  return (
    /* Two tiles, not one split pane: the scene and the thing you selected in
       it are separate concerns, and the gutter says so. */
    <ResizablePanelGroup orientation="vertical" className="min-h-50">
      <ResizablePanel
        defaultSize="30%"
        className="min-h-0 overflow-hidden rounded-lg border border-stroke bg-card"
      >
        <FileExplorer />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        defaultSize="70%"
        className="min-h-0 overflow-hidden rounded-lg border border-stroke bg-card"
      >
        <SelectedObjectTabs />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default MainPanel;

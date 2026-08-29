import useReloadPrompt from "./components/reload-prompt/prompt.web";
import TopPanel from "./components/panels/top";

export default function Layout({ children }: { children: React.ReactNode }) {
  useReloadPrompt();
  return (
    /*
      The shell is a ground with tiles on it, not a set of panes sharing
      borders. The 8px gutters are what make the structure legible; the tiles
      carry their own hairline and sit a step up the tonal ladder.
    */
    <div className="flex h-screen w-screen overflow-hidden bg-background p-2">
      <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-2">
        <TopPanel />
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

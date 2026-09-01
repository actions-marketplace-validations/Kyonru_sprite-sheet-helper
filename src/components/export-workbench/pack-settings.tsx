import { Grid2X2, Layers } from "lucide-react";
import { ScrubField } from "@/components/ui/scrub-field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/next/settings";

const SCALES = [1, 2, 4] as const;

/**
 * How the atlas is packed.
 *
 * The same controls appear in the Pack stage and in the export dialog, from
 * this one component. The rule they follow is that the map has to be in view:
 * changing padding or scale re-packs the page you are looking at. Both surfaces
 * show one, so both can host the controls — what is not allowed is a settings
 * screen you have to close to see what it did.
 */
export function PackSettings() {
  const atlasLayout = useSettingsStore((state) => state.atlasLayout);
  const atlasPadding = useSettingsStore((state) => state.atlasPadding);
  const atlasBleed = useSettingsStore((state) => state.atlasBleed);
  const atlasSpriteMargin = useSettingsStore(
    (state) => state.atlasSpriteMargin,
  );
  const atlasScale = useSettingsStore((state) => state.atlasScale);
  const maxAtlasSize = useSettingsStore((state) => state.maxAtlasSize);
  const allowMultiPage = useSettingsStore((state) => state.allowMultiPage);
  const setAtlasOptions = useSettingsStore((state) => state.setAtlasOptions);

  return (
    <div className="grid gap-2.5">
      <div className="grid gap-1">
        <span className="text-[9px] font-medium uppercase tracking-wider text-faint-foreground">
          Layout
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: "rows", label: "Rows", icon: Layers, hint: "Keeps order" },
              {
                id: "packed",
                label: "Packed",
                icon: Grid2X2,
                hint: "Less waste",
              },
            ] as const
          ).map((option) => {
            const selected = atlasLayout === option.id;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                data-testid={`atlas-layout-${option.id}-button`}
                title={option.hint}
                onClick={() => setAtlasOptions({ layout: option.id })}
                className={cn(
                  "flex h-6 items-center justify-center gap-1.5 rounded-md border text-[10px] transition-colors",
                  selected
                    ? "border-brand-line bg-brand-soft text-foreground"
                    : "border-stroke text-muted-foreground hover:bg-row-hover hover:text-foreground",
                )}
              >
                <Icon size={11} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-1">
        <span className="text-[9px] font-medium uppercase tracking-wider text-faint-foreground">
          Spacing
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <ScrubField
            label="Padding"
            value={atlasPadding}
            min={0}
            step={1}
            onValueChange={(value) => setAtlasOptions({ padding: value })}
            data-testid="atlas-padding-input"
          />
          <ScrubField
            label="Extrude"
            value={atlasBleed}
            min={0}
            step={1}
            onValueChange={(value) => setAtlasOptions({ extrude: value })}
            data-testid="atlas-extrude-input"
          />
          <ScrubField
            label="Margin"
            value={atlasSpriteMargin}
            min={0}
            step={1}
            onValueChange={(value) => setAtlasOptions({ spriteMargin: value })}
            data-testid="atlas-sprite-margin-input"
          />
          <ScrubField
            label="Max"
            unit="px"
            value={maxAtlasSize}
            min={1}
            step={1}
            onValueChange={(value) => setAtlasOptions({ maxAtlasSize: value })}
            data-testid="atlas-max-size-input"
          />
        </div>
      </div>

      <div className="grid gap-1">
        <span className="text-[9px] font-medium uppercase tracking-wider text-faint-foreground">
          Scale
        </span>
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] gap-1.5">
          {SCALES.map((scale) => (
            <button
              key={scale}
              type="button"
              data-testid={`atlas-scale-${scale}x-button`}
              onClick={() => setAtlasOptions({ scale })}
              className={cn(
                "h-6 rounded-md border font-mono text-[10px] tabular-nums transition-colors",
                atlasScale === scale
                  ? "border-brand-line bg-brand-soft text-foreground"
                  : "border-stroke text-muted-foreground hover:bg-row-hover hover:text-foreground",
              )}
            >
              {scale}x
            </button>
          ))}
          <ScrubField
            aria-label="Custom atlas scale"
            className="w-16"
            value={atlasScale}
            min={0.1}
            step={0.1}
            onValueChange={(value) => setAtlasOptions({ scale: value })}
          />
        </div>
      </div>

      <label className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">Allow multiple pages</span>
        <Switch
          checked={allowMultiPage}
          onCheckedChange={(checked) =>
            setAtlasOptions({ allowMultiPage: Boolean(checked) })
          }
        />
      </label>
    </div>
  );
}

import { useImagesStore } from "@/store/next/images";
import { PanelTile } from "@/components/panels/panel-tile";
import { SequencePreview } from "./sequence-preview";

/**
 * The sequence, as its own tile under the scene view.
 *
 * It lives in the centre column rather than the export rail because it is a
 * *viewing* surface — you watch it, the way you watch the scene view and the
 * camera preview. The rail beside it is for deciding, and mixing the two made
 * the rail scroll past the thing you were trying to look at.
 *
 * Collapses to nothing until something has been recorded, so an empty project
 * gives the whole column to the viewport.
 */
export function SequenceTile() {
  const rows = useImagesStore((state) => state.images);

  if (rows.length === 0) return null;

  /*
    No title row of its own. The panel's header puts the label, the sequence
    chips, loop and the frame counter on one line — splitting them across two
    rows spends height the column does not have, and left the tile stating a
    count the counter already gave.
  */
  return (
    <PanelTile className="max-h-[46%] shrink-0 overflow-y-auto">
      <SequencePreview />
    </PanelTile>
  );
}

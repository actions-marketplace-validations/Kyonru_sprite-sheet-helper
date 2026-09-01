import { Fragment } from "react";
import {
  Code2,
  FileArchive,
  FileJson,
  Film,
  Folder,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function FileIcon({ name, className }: { name: string; className?: string }) {
  const Icon = name.endsWith(".json")
    ? FileJson
    : name.endsWith(".gif")
      ? Film
      : name.endsWith(".png") || name.includes("*.png")
        ? ImageIcon
        : /\.(ts|rs|lua|gd|py|h|c|cs)$/.test(name) ||
            name.endsWith(".toml.snippet")
          ? Code2
          : FileArchive;

  return <Icon size={12} className={cn("shrink-0", className)} />;
}

type Group = { dir: string | null; files: string[] };

/**
 * Group paths by their directory, preserving the order the exporter emitted.
 *
 * Exporters write real trees — `assets/spritesheet.png` beside `src/main.rs`
 * and a bare `Cargo.toml.snippet` — and a flat list of full paths makes you
 * parse that structure yourself, one row at a time.
 */
function groupByDirectory(files: string[]): Group[] {
  const groups: Group[] = [];

  for (const file of files) {
    const slash = file.lastIndexOf("/");
    const dir = slash === -1 ? null : file.slice(0, slash);
    const name = slash === -1 ? file : file.slice(slash + 1);
    const last = groups[groups.length - 1];

    if (last && last.dir === dir) last.files.push(name);
    else groups.push({ dir, files: [name] });
  }

  return groups;
}

/**
 * What the export is about to write, as a tree.
 *
 * Files at the archive root sit flush; anything inside a directory is nested
 * under a folder row with a guide line, so the shape of the output is legible
 * before you commit to it.
 */
export function WritesTree({
  files,
  className,
}: {
  files: string[];
  className?: string;
}) {
  const groups = groupByDirectory(files);

  return (
    <div className={cn("grid gap-px", className)}>
      {groups.map((group) => (
        <Fragment key={group.dir ?? "__root__"}>
          {group.dir ? (
            <div className="flex items-center gap-1.5 px-1 pb-px pt-1.5">
              <Folder size={12} className="shrink-0 text-faint-foreground" />
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {group.dir}/
              </span>
            </div>
          ) : null}

          {group.files.map((name, index) => (
            <div
              key={`${group.dir ?? ""}/${name}/${index}`}
              className={cn(
                "flex h-[24px] items-center gap-2",
                // Nested files hang off a guide line rather than an indent
                // alone, so a long list still reads as belonging to its folder.
                group.dir
                  ? "ml-[6px] border-s border-stroke ps-[13px]"
                  : "px-1",
              )}
            >
              <FileIcon name={name} className="text-faint-foreground" />
              <span className="truncate font-mono text-[11px]">{name}</span>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

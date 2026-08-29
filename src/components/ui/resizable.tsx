import { GripVerticalIcon } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
 className,
 ...props
}: ResizablePrimitive.GroupProps) {
 return (
 <ResizablePrimitive.Group
 data-slot="resizable-panel-group"
 className={cn(
 "flex h-full w-full aria-[orientation=vertical]:flex-col",
 className
 )}
 {...props}
 />
 )
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
 return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
 withHandle,
 className,
 ...props
}: ResizablePrimitive.SeparatorProps & {
 withHandle?: boolean
}) {
 return (
 <ResizablePrimitive.Separator
 data-slot="resizable-handle"
 className={cn(
 // The handle is the gutter between tiles, so it is transparent space rather
      // than a drawn line. It reveals itself on hover and while dragging.
      "focus-visible:ring-ring group/handle relative flex w-2 items-center justify-center bg-transparent transition-colors after:absolute after:inset-y-0 after:start-1/2 after:w-2 after:-translate-x-1/2 rtl:after:translate-x-1/2 focus-visible:ring-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:start-0 aria-[orientation=horizontal]:after:h-2 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 rtl:aria-[orientation=horizontal]:after:-translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90",
 className
 )}
 {...props}
 >
 {withHandle && (
 <div className="bg-surface-highest border-stroke z-10 flex h-5 w-2.5 items-center justify-center rounded-sm border opacity-0 transition-opacity group-hover/handle:opacity-100">
 <GripVerticalIcon className="size-2.5" />
 </div>
 )}
 </ResizablePrimitive.Separator>
 )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ThHTMLAttributes,
} from "react";
import styles from "./DataTable.module.css";

// Extra props DataTable passes to every header cell via onHeaderCell
export interface HeaderCellExtra {
  columnKey?: string;
  movable?: boolean; // unpinned columns can be dragged in the header
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onResize?: (key: string, width: number) => void; // live, while dragging
  onResizeEnd?: (key: string, width: number) => void; // always, also when unchanged
  onResetWidth?: (key: string) => void;
  resizeLabel?: string;
}

type HeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & HeaderCellExtra;

// <th> of a DataTable: drag to reorder (unpinned columns), drag the right
// edge to resize, double-click the edge to go back to the default width.
// Cells AntD adds itself (selection, scrollbar) get no columnKey and render plain.
export function HeaderCell({
  columnKey,
  movable,
  width,
  minWidth = 72,
  maxWidth = 800,
  onResize,
  onResizeEnd,
  onResetWidth,
  resizeLabel,
  children,
  ...rest
}: HeaderCellProps) {
  const sortable = useSortable({
    id: columnKey ?? "",
    disabled: !columnKey || !movable,
  });

  if (!columnKey) return <th {...rest}>{children}</th>;

  const style: CSSProperties = {
    ...rest.style,
    ...(movable && {
      transform: CSS.Translate.toString(
        sortable.transform && { ...sortable.transform, y: 0, scaleX: 1, scaleY: 1 },
      ),
      transition: sortable.transition,
    }),
  };

  // Pointer capture: the handle keeps getting the moves (and shows its
  // col-resize cursor) even when the pointer leaves it
  const startResize = (event: ReactPointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation(); // not a column drag, not a sort click
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = width ?? (handle.parentElement?.offsetWidth || 160);
    let current = startWidth;
    let frame = 0;
    const clamp = (w: number) => Math.round(Math.min(maxWidth, Math.max(minWidth, w)));

    const move = (e: PointerEvent) => {
      current = clamp(startWidth + e.clientX - startX);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => onResize?.(columnKey, current));
    };
    const up = () => {
      cancelAnimationFrame(frame);
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      document.body.classList.remove(styles.resizing);
      onResizeEnd?.(columnKey, current);
    };
    document.body.classList.add(styles.resizing);
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  };

  return (
    <th
      {...rest}
      ref={movable ? sortable.setNodeRef : undefined}
      style={style}
      {...(movable ? sortable.listeners : {})}
      className={[
        rest.className,
        movable && styles.draggableHeader,
        sortable.isDragging && styles.draggingHeader,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {onResizeEnd && (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={resizeLabel}
          className={styles.resizeHandle}
          onPointerDown={startResize}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onResetWidth?.(columnKey);
          }}
        />
      )}
    </th>
  );
}

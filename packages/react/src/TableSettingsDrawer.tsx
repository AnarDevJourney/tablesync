import {
  CheckCircleFilled,
  ColumnHeightOutlined,
  HolderOutlined,
  PushpinOutlined,
  UndoOutlined,
  VerticalAlignMiddleOutlined,
} from "@ant-design/icons";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Checkbox, Drawer, Popconfirm, Segmented, Tooltip } from "antd";
import type { CSSProperties } from "react";
import { useTableSync } from "./context";
import type { ResolvedColumn } from "./resolveColumns";
import { TableViewPreview } from "./TableViewPreview";
import type { ColumnPin, TableDensity, TableViewId } from "./types";
import styles from "./TableSettingsDrawer.module.css";

interface TableSettingsDrawerProps<T> {
  open: boolean;
  onClose: () => void;
  columns: ResolvedColumn<T>[];
  density: TableDensity;
  view: TableViewId;
  views: readonly TableViewId[]; // the views this table supports
  themeVars: CSSProperties; // the drawer is portaled out of the table
  customized: boolean; // something differs from the defaults
  onColumnsChange: (columns: ResolvedColumn<T>[]) => void;
  onDensityChange: (density: TableDensity) => void;
  onViewChange: (view: TableViewId) => void;
  onReset: () => void;
}

type Zone = "left" | "none" | "right";
const zoneOf = (pinned: ColumnPin | null): Zone => pinned ?? "none";

// Everything about how one table looks: preset view (with live previews),
// row density, and the columns (show / hide, order, pin, width reset).
export function TableSettingsDrawer<T>({
  open,
  onClose,
  columns,
  density,
  view,
  views,
  themeVars,
  customized,
  onColumnsChange,
  onDensityChange,
  onViewChange,
  onReset,
}: TableSettingsDrawerProps<T>) {
  const { labels } = useTableSync();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleCount = columns.filter((c) => c.visible).length;
  const change = (key: string, patch: Partial<ResolvedColumn<T>>) =>
    onColumnsChange(columns.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  // Pinning moves the column to the end of the left zone / start of the right zone
  const pin = (key: string, pinned: ColumnPin | null) => {
    const column = columns.find((c) => c.key === key)!;
    const rest = columns.filter((c) => c.key !== key);
    const updated = { ...column, pinned };
    const at =
      pinned === "left"
        ? rest.filter((c) => c.pinned === "left").length
        : pinned === "right"
          ? rest.findIndex((c) => c.pinned === "right")
          : rest.filter((c) => c.pinned !== "right").length;
    const index = at < 0 ? rest.length : at;
    onColumnsChange([...rest.slice(0, index), updated, ...rest.slice(index)]);
  };

  // Reordering stays inside a zone (left-pinned / unpinned / right-pinned)
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = columns.findIndex((c) => c.key === active.id);
    const to = columns.findIndex((c) => c.key === over.id);
    if (zoneOf(columns[from].pinned) !== zoneOf(columns[to].pinned)) return;
    onColumnsChange(arrayMove(columns, from, to));
  };

  const zones: { zone: Zone; label: string }[] = [
    { zone: "left", label: labels.pinnedLeft },
    { zone: "none", label: labels.notPinned },
    { zone: "right", label: labels.pinnedRight },
  ];

  return (
    <Drawer
      title={labels.settings}
      open={open}
      styles={{ root: themeVars }}
      onClose={onClose}
      size={440}
      footer={
        <div className={styles.footer}>
          <Popconfirm
            title={labels.resetConfirmTitle}
            description={labels.resetConfirmBody}
            okText={labels.reset}
            cancelText={labels.cancel}
            onConfirm={onReset}
            disabled={!customized}
          >
            <Button icon={<UndoOutlined />} disabled={!customized}>
              {labels.reset}
            </Button>
          </Popconfirm>
          <Button type="primary" onClick={onClose}>
            {labels.done}
          </Button>
        </div>
      }
    >
      <section className={styles.section}>
        <h3 className={styles.heading}>{labels.view}</h3>
        <div className={styles.views} role="radiogroup" aria-label={labels.view}>
          {views.map((option) => {
            const selected = option === view;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[styles.viewCard, selected && styles.viewSelected]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onViewChange(option)}
              >
                {selected && <CheckCircleFilled className={styles.viewCheck} />}
                <TableViewPreview view={option} density={density} columns={columns} />
                <span className={styles.viewName}>{labels.views[option].name}</span>
                <span className={styles.viewDesc}>{labels.views[option].desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{labels.density}</h3>
        <Segmented<TableDensity>
          block
          value={density}
          onChange={onDensityChange}
          options={[
            {
              value: "compact",
              label: labels.compact,
              icon: <VerticalAlignMiddleOutlined />,
            },
            {
              value: "comfortable",
              label: labels.comfortable,
              icon: <ColumnHeightOutlined />,
            },
          ]}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.headingRow}>
          <h3 className={styles.heading}>{labels.columns}</h3>
          <span className={styles.count}>
            {labels.visibleCount(visibleCount, columns.length)}
          </span>
        </div>
        <p className={styles.hint}>{labels.columnsHint}</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          {zones.map(({ zone, label }) => {
            const items = columns.filter((c) => zoneOf(c.pinned) === zone);
            if (items.length === 0 && zone !== "none") return null;
            return (
              <div key={zone} className={styles.zone}>
                <div className={styles.zoneLabel}>{label}</div>
                <SortableContext
                  items={items.map((c) => c.key)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={styles.list}>
                    {items.map((column) => (
                      <ColumnRow
                        key={column.key}
                        column={column}
                        // the last visible column can't be hidden
                        lockVisible={
                          column.def.hideable === false ||
                          (column.visible && visibleCount === 1)
                        }
                        onVisibleChange={(visible) => change(column.key, { visible })}
                        onPinChange={(pinned) => pin(column.key, pinned)}
                        onResetWidth={() =>
                          change(column.key, {
                            customWidth: false,
                            width: column.def.width ?? 160,
                          })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </DndContext>
        <Button
          type="link"
          size="small"
          className={styles.showAll}
          disabled={visibleCount === columns.length}
          onClick={() => onColumnsChange(columns.map((c) => ({ ...c, visible: true })))}
        >
          {labels.showAll}
        </Button>
      </section>
    </Drawer>
  );
}

interface ColumnRowProps<T> {
  column: ResolvedColumn<T>;
  lockVisible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onPinChange: (pinned: ColumnPin | null) => void;
  onResetWidth: () => void;
}

function ColumnRow<T>({
  column,
  lockVisible,
  onVisibleChange,
  onPinChange,
  onResetWidth,
}: ColumnRowProps<T>) {
  const { labels } = useTableSync();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={[
        styles.columnRow,
        isDragging && styles.dragging,
        !column.visible && styles.hidden,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={styles.handle}
        aria-label={labels.dragColumn(column.def.title)}
        {...attributes}
        {...listeners}
      >
        <HolderOutlined />
      </button>
      <Tooltip title={lockVisible ? labels.alwaysVisible : undefined}>
        <Checkbox
          checked={column.visible}
          disabled={lockVisible}
          onChange={(event) => onVisibleChange(event.target.checked)}
          className={styles.columnName}
        >
          {column.def.title}
        </Checkbox>
      </Tooltip>
      {column.customWidth && (
        <Tooltip title={labels.resetWidth}>
          <button type="button" className={styles.width} onClick={onResetWidth}>
            {column.width} px
          </button>
        </Tooltip>
      )}
      <Segmented<Zone>
        size="small"
        value={zoneOf(column.pinned)}
        onChange={(zone) => onPinChange(zone === "none" ? null : zone)}
        options={[
          {
            value: "left",
            icon: <PushpinOutlined rotate={-45} />,
            title: labels.pinLeft,
          },
          { value: "none", label: "—", title: labels.unpin },
          {
            value: "right",
            icon: <PushpinOutlined rotate={45} />,
            title: labels.pinRight,
          },
        ]}
      />
    </div>
  );
}

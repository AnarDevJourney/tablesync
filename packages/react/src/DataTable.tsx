import {
  ExclamationCircleOutlined,
  InboxOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import {
  Button,
  ConfigProvider,
  Skeleton,
  Table,
  Tooltip,
  type TableColumnsType,
  type TableProps,
} from "antd";
import type { SorterResult } from "antd/es/table/interface";
import {
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type Key,
} from "react";
import { useTableSync } from "./context.js";
import { HeaderCell, type HeaderCellExtra } from "./HeaderCell.js";
import { RowActionsMenu } from "./RowActionsMenu.js";
import {
  clampWidth,
  maxWidthOf,
  minWidthOf,
  resolveColumns,
  toSavedColumns,
  type ResolvedColumn,
} from "./resolveColumns.js";
import { TableSettingsDrawer } from "./TableSettingsDrawer.js";
import { DEFAULT_TABLE_VIEW, isTableView, TABLE_VIEWS } from "./tableViews.js";
import { useThemeVars } from "./themeVars.js";
import type { DataTableProps, TableDensity } from "./types.js";
import { useTableSettings } from "./useTableSettings.js";
import styles from "./DataTable.module.css";

const SKELETON_ROWS = 8;
const horizontalOnly: Modifier = ({ transform }) => ({ ...transform, y: 0 });
const SELECTION_WIDTH = 48;
const ROW_ACTIONS_WIDTH = 56;

// Row heights: compact ≈ 40px (default for dense lists), comfortable ≈ 52px.
// No tinted "sorted column" band — it fights with the striped / card views.
const tableTokens = { bodySortBg: "transparent" };
const DENSITY_THEME: Record<
  TableDensity,
  NonNullable<Parameters<typeof ConfigProvider>[0]["theme"]>
> = {
  compact: {
    components: {
      Table: { ...tableTokens, cellPaddingBlockSM: 9, cellPaddingInlineSM: 12 },
    },
  },
  comfortable: {
    components: {
      Table: { ...tableTokens, cellPaddingBlock: 15, cellPaddingInline: 16 },
    },
  },
};

// A table whose columns are described once in code; how they
// look for each user (visible, order, width, pinned, density, view) comes
// from the TableSyncProvider's storage and is edited in the table itself or in the
// settings drawer. Loading / empty / error states are built in.
export function DataTable<T extends object>({
  tableKey,
  columns: defs,
  data,
  rowKey,
  loading = false,
  error,
  onRetry,
  empty,
  pagination,
  sort,
  onSortChange,
  onRowClick,
  rowAccent,
  rowSelection,
  rowActions,
  onViewDetails,
  rowLabel,
  toolbar,
  actions,
  defaultDensity = "compact",
  defaultView = DEFAULT_TABLE_VIEW,
  configurable = true,
  stickyOffset,
}: DataTableProps<T>) {
  const { labels, stickyOffset: defaultStickyOffset } = useTableSync();
  const vars = useThemeVars();
  const { settings, update, reset } = useTableSettings(tableKey);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Width of the column being resized, before it is saved
  const [liveWidth, setLiveWidth] = useState<{ key: string; width: number } | null>(null);

  const columns = useMemo(
    () => resolveColumns(defs, settings?.columns ?? null),
    [defs, settings?.columns],
  );
  const density = settings?.density ?? defaultDensity;
  // "accent" only makes sense when the table says what color a row is
  const views = rowAccent ? TABLE_VIEWS : TABLE_VIEWS.filter((v) => v !== "accent");
  const savedView = settings?.view;
  const view =
    isTableView(savedView) && views.includes(savedView) ? savedView : defaultView;
  const customized = Boolean(settings?.columns || settings?.density || settings?.view);

  const saveColumns = (next: ResolvedColumn<T>[]) =>
    update({ columns: toSavedColumns(next) });

  const setWidth = (key: string, width: number | null) =>
    saveColumns(
      columns.map((c) =>
        c.key === key
          ? {
              ...c,
              width: width === null ? (c.def.width ?? 160) : clampWidth(c.def, width),
              customWidth: width !== null,
            }
          : c,
      ),
    );

  // Header drag: only unpinned columns, only among themselves
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const onHeaderDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = columns.findIndex((c) => c.key === active.id);
    const to = columns.findIndex((c) => c.key === over.id);
    if (from < 0 || to < 0 || columns[to].pinned) return;
    saveColumns(arrayMove(columns, from, to));
  };

  const visible = columns.filter((c) => c.visible);
  const widthOf = (c: ResolvedColumn<T>) =>
    liveWidth?.key === c.key ? liveWidth.width : c.width;
  const waitingForSettings = !settings;
  // Skeleton rows until the settings and the first page of data are there
  const showSkeleton = waitingForSettings || (loading && !data?.length && !error);

  const antColumns: TableColumnsType<T> = visible.map((c) => ({
    key: c.key,
    dataIndex: c.def.dataIndex as string | string[] | undefined,
    title: c.def.header ?? c.def.title,
    width: widthOf(c),
    fixed: c.pinned ?? undefined,
    align: c.def.align ?? (c.def.numeric ? "right" : undefined),
    ellipsis: c.def.ellipsis ?? true,
    className: c.def.numeric ? styles.numeric : undefined,
    sorter: c.def.sortable ? true : undefined,
    sortOrder: sort?.key === c.key ? (sort.order === "asc" ? "ascend" : "descend") : null,
    showSorterTooltip: false,
    render: showSkeleton
      ? (_value: unknown, _record: T, index: number) => (
          // slightly different lengths per row look like real content
          <div
            className={styles.skeletonCell}
            style={{ width: `${60 + ((index * 23) % 35)}%` }}
          >
            <Skeleton.Input active size="small" block />
          </div>
        )
      : c.def.render,
    // AntD types onHeaderCell as <th> attributes; HeaderCell reads these extras
    onHeaderCell: () =>
      ({
        columnKey: c.key,
        movable: configurable && !c.pinned,
        width: widthOf(c),
        minWidth: minWidthOf(c.def),
        maxWidth: maxWidthOf(c.def),
        onResize: configurable ? (key, width) => setLiveWidth({ key, width }) : undefined,
        onResizeEnd: configurable
          ? (key, width) => {
              setLiveWidth(null);
              if (width !== c.width) setWidth(key, width);
            }
          : undefined,
        onResetWidth: configurable ? (key) => setWidth(key, null) : undefined,
        resizeLabel: labels.resizeColumn(c.def.title),
      }) satisfies HeaderCellExtra as unknown as HTMLAttributes<HTMLElement>,
  }));

  // ⋮ column: always last, pinned right, outside the user's column settings
  // (no onHeaderCell extras → HeaderCell renders a plain <th>)
  const hasRowMenu = Boolean(rowActions || onViewDetails);
  if (hasRowMenu) {
    antColumns.push({
      key: "__row-actions",
      title: <span className={styles.srOnly}>{labels.actions}</span>,
      width: ROW_ACTIONS_WIDTH,
      fixed: "right",
      align: "center",
      render: (_value: unknown, record: T) =>
        showSkeleton ? null : (
          <RowActionsMenu
            items={rowActions?.(record) ?? []}
            onViewDetails={onViewDetails && (() => onViewDetails(record))}
            label={rowLabel?.(record)}
          />
        ),
    });
  }

  const scrollX =
    visible.reduce((sum, c) => sum + widthOf(c), 0) +
    (rowSelection ? SELECTION_WIDTH : 0) +
    (hasRowMenu ? ROW_ACTIONS_WIDTH : 0);

  const onChange: TableProps<T>["onChange"] = (_pagination, _filters, sorter, extra) => {
    if (extra.action !== "sort" || !onSortChange) return;
    const s = (Array.isArray(sorter) ? sorter[0] : sorter) as SorterResult<T>;
    onSortChange(
      s?.order && s.columnKey
        ? { key: String(s.columnKey), order: s.order === "ascend" ? "asc" : "desc" }
        : null,
    );
  };

  const emptyContent = error ? (
    <div className={styles.state} role="alert">
      <ExclamationCircleOutlined className={`${styles.stateIcon} ${styles.stateError}`} />
      <div className={styles.stateTitle}>{labels.errorTitle}</div>
      <div className={styles.stateText}>{error.message}</div>
      {onRetry && <Button onClick={onRetry}>{labels.retry}</Button>}
    </div>
  ) : (
    <div className={styles.state}>
      <span className={styles.stateIcon}>{empty?.icon ?? <InboxOutlined />}</span>
      <div className={styles.stateTitle}>{empty?.title ?? labels.emptyTitle}</div>
      {(empty?.description || !empty) && (
        <div className={styles.stateText}>{empty?.description ?? labels.emptyText}</div>
      )}
      {empty?.action}
    </div>
  );

  const rows = showSkeleton
    ? (Array.from({ length: SKELETON_ROWS }, (_, i) => ({
        __skeleton: i,
      })) as unknown as T[])
    : (data ?? []);

  const getRowKey = (record: T): Key =>
    "__skeleton" in record
      ? `skeleton-${String((record as { __skeleton: number }).__skeleton)}`
      : typeof rowKey === "function"
        ? rowKey(record)
        : (record[rowKey] as Key);

  return (
    <div className={styles.wrapper} style={vars}>
      {(toolbar || actions || configurable) && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarStart}>{toolbar}</div>
          <div className={styles.toolbarEnd}>
            {actions}
            {configurable && (
              <Tooltip title={labels.settings}>
                <Button
                  icon={<SettingOutlined />}
                  aria-label={labels.settings}
                  onClick={() => setDrawerOpen(true)}
                  disabled={waitingForSettings}
                />
              </Tooltip>
            )}
          </div>
        </div>
      )}

      <ConfigProvider theme={DENSITY_THEME[density]}>
        <DndContext
          sensors={sensors}
          modifiers={[horizontalOnly]}
          onDragEnd={onHeaderDragEnd}
        >
          <SortableContext
            items={visible.filter((c) => !c.pinned).map((c) => c.key)}
            strategy={horizontalListSortingStrategy}
          >
            <Table<T>
              className={[
                styles.table,
                styles[`view-${view}`],
                loading && !showSkeleton && styles.refetching,
                onRowClick && styles.clickable,
              ]
                .filter(Boolean)
                .join(" ")}
              size={density === "compact" ? "small" : "middle"}
              tableLayout="fixed"
              bordered={view === "grid"}
              columns={antColumns}
              dataSource={rows}
              rowKey={getRowKey}
              components={{ header: { cell: HeaderCell } }}
              scroll={{ x: scrollX }}
              sticky={{ offsetHeader: stickyOffset ?? defaultStickyOffset }}
              showSorterTooltip={false}
              locale={{ emptyText: emptyContent }}
              rowSelection={showSkeleton ? undefined : rowSelection}
              onChange={onChange}
              onRow={(record) => {
                if ("__skeleton" in record) return {};
                const accent = view === "accent" ? rowAccent?.(record) : undefined;
                return {
                  style: accent
                    ? ({ "--row-accent": accent } as CSSProperties)
                    : undefined,
                  ...(onRowClick && {
                    onClick: () => onRowClick(record),
                    onKeyDown: (event) => {
                      if (event.key === "Enter") onRowClick(record);
                    },
                    tabIndex: 0,
                  }),
                };
              }}
              pagination={
                pagination && !showSkeleton
                  ? {
                      current: pagination.page,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      onChange: pagination.onChange,
                      showSizeChanger: true,
                      pageSizeOptions: pagination.pageSizeOptions ?? [10, 20, 50, 100],
                      showTotal: (total, [from, to]) => labels.total(from, to, total),
                    }
                  : false
              }
            />
          </SortableContext>
        </DndContext>
      </ConfigProvider>

      {configurable && settings && (
        <TableSettingsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          columns={columns}
          density={density}
          view={view}
          views={views}
          themeVars={vars}
          customized={customized}
          onColumnsChange={saveColumns}
          onDensityChange={(value) => update({ density: value })}
          onViewChange={(value) => update({ view: value })}
          onReset={reset}
        />
      )}
    </div>
  );
}

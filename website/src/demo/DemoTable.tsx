import {
  CheckCircleFilled,
  ClockCircleFilled,
  DeleteOutlined,
  EditOutlined,
  MinusCircleFilled,
  SearchOutlined,
} from "@ant-design/icons";
import { App, Avatar, Input, Segmented } from "antd";
import { useMemo, useState } from "react";
import {
  createLocalStorage,
  DataTable,
  TableSyncProvider,
  type DataTableColumn,
  type DataTableSort,
} from "tablesync";
import { MEMBERS, type Member, type MemberStatus } from "./demoData";
import styles from "./DemoTable.module.css";

// The visitor's layout stays in their browser (in your app: your API)
const storage = createLocalStorage({ prefix: "tablesync-demo:" });

const STATUS: Record<
  MemberStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  active: { label: "Active", color: "#16a34a", icon: <CheckCircleFilled /> },
  invited: { label: "Invited", color: "#d97706", icon: <ClockCircleFilled /> },
  suspended: { label: "Suspended", color: "#8a959c", icon: <MinusCircleFilled /> },
};

const dateFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Mode = "data" | "loading" | "empty" | "error";

const columns: DataTableColumn<Member>[] = [
  {
    key: "name",
    title: "Name",
    width: 220,
    hideable: false,
    sortable: true,
    render: (_, member) => (
      <span className={styles.person}>
        <Avatar size={28} gap={2} className={styles.avatar}>
          {member.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </Avatar>
        <span className={styles.personName}>{member.name}</span>
      </span>
    ),
  },
  { key: "email", title: "Email", dataIndex: "email", width: 230, sortable: true },
  { key: "role", title: "Role", dataIndex: "role", width: 160, sortable: true },
  { key: "team", title: "Team", dataIndex: "team", width: 120, sortable: true },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    width: 120,
    sortable: true,
    render: (value) => {
      const status = STATUS[value as MemberStatus];
      return (
        <span className={styles.status} style={{ color: status.color }}>
          {status.icon}
          <span className={styles.statusText}>{status.label}</span>
        </span>
      );
    },
  },
  {
    key: "location",
    title: "Location",
    dataIndex: "location",
    width: 130,
    defaultHidden: true,
  },
  {
    key: "projects",
    title: "Projects",
    dataIndex: "projects",
    width: 110,
    numeric: true,
    sortable: true,
  },
  {
    key: "joined",
    title: "Joined",
    dataIndex: "joined",
    width: 130,
    numeric: true,
    sortable: true,
    defaultHidden: true,
    render: (value) => dateFormat.format(new Date(value as string)),
  },
  {
    key: "lastActive",
    title: "Last active",
    dataIndex: "lastActive",
    width: 140,
    numeric: true,
    defaultHidden: true,
    render: (value) => dateFormat.format(new Date(value as string)),
  },
];

function compare(a: Member, b: Member, key: string): number {
  const x = a[key as keyof Member];
  const y = b[key as keyof Member];
  return typeof x === "number" && typeof y === "number"
    ? x - y
    : String(x).localeCompare(String(y));
}

// A live tablesync table: everything the visitor changes is saved
export function DemoTable() {
  const { message } = App.useApp();
  const [mode, setMode] = useState<Mode>("data");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = term
      ? MEMBERS.filter((m) =>
          [m.name, m.email, m.role, m.team].some((v) => v.toLowerCase().includes(term)),
        )
      : MEMBERS;
    if (!sort) return rows;
    const direction = sort.order === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => compare(a, b, sort.key) * direction);
  }, [search, sort]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const data = mode === "empty" ? [] : mode === "loading" ? undefined : pageRows;

  return (
    <TableSyncProvider storage={storage} stickyOffset={64}>
      <div className={styles.demoBar}>
        <span className={styles.demoLabel}>Show the table</span>
        <Segmented<Mode>
          size="small"
          value={mode}
          onChange={setMode}
          options={[
            { value: "data", label: "With data" },
            { value: "loading", label: "Loading" },
            { value: "empty", label: "Empty" },
            { value: "error", label: "Error" },
          ]}
          aria-label="Table state"
        />
      </div>
      <DataTable<Member>
        tableKey="team-members"
        columns={columns}
        data={data}
        rowKey="id"
        loading={mode === "loading"}
        error={
          mode === "error"
            ? new Error("The server did not answer. (A demo error.)")
            : null
        }
        onRetry={() => setMode("data")}
        empty={
          search
            ? { title: "No members match", description: `Nothing found for “${search}”.` }
            : undefined
        }
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        pagination={
          mode === "data"
            ? {
                page,
                pageSize,
                total: filtered.length,
                pageSizeOptions: [10, 20, 50],
                onChange: (p, size) => {
                  setPage(size === pageSize ? p : 1);
                  setPageSize(size);
                },
              }
            : false
        }
        onRowClick={(member) => void message.info(`Clicked ${member.name}`)}
        onViewDetails={(member) => void message.info(`Details of ${member.name}`)}
        rowLabel={(member) => member.name}
        rowAccent={(member) => STATUS[member.status].color}
        rowActions={(member) => [
          {
            key: "edit",
            label: "Edit",
            icon: <EditOutlined />,
            onClick: () => void message.info(`Edit ${member.name}`),
          },
          "divider",
          {
            key: "remove",
            label: "Remove",
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => void message.warning(`Remove ${member.name}`),
          },
        ]}
        toolbar={
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search members"
            className={styles.search}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search members"
          />
        }
      />
    </TableSyncProvider>
  );
}

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { DataTable, TableSyncProvider, type DataTableColumn } from "../src";
import type { TableSettingsStorage } from "../src/types";

// AntD needs these in jsdom
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

type User = { id: number; name: string; email: string };
const columns: DataTableColumn<User>[] = [
  { key: "name", title: "Name", dataIndex: "name" },
  { key: "email", title: "Email", dataIndex: "email" },
];
const data: User[] = [
  { id: 1, name: "Ada", email: "ada@example.com" },
  { id: 2, name: "Linus", email: "linus@example.com" },
];

let container: HTMLDivElement;
afterEach(() => container?.remove());

async function render(ui: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(ui));
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
  return root;
}

const headers = () =>
  [...container.querySelectorAll("thead th")].map((th) => th.textContent).filter(Boolean);

describe("DataTable", () => {
  it("renders rows with the saved settings and custom labels", async () => {
    const storage: TableSettingsStorage = {
      load: async () => ({
        columns: [
          { key: "email", visible: true, width: null, pinned: null },
          { key: "name", visible: true, width: null, pinned: null },
        ],
      }),
      save: async () => {},
      reset: async () => {},
    };
    await render(
      <TableSyncProvider storage={storage} labels={{ settings: "Réglages" }}>
        <DataTable tableKey="users" columns={columns} data={data} rowKey="id" />
      </TableSyncProvider>,
    );

    expect(container.querySelectorAll("tbody tr.ant-table-row")).toHaveLength(2);
    expect(headers()).toEqual(["Email", "Name"]);
    expect(container.querySelector('button[aria-label="Réglages"]')).not.toBeNull();
  });

  it("works without a provider (localStorage, English)", async () => {
    window.localStorage.setItem(
      "tablesync:people",
      JSON.stringify({
        columns: [{ key: "name", visible: false, width: null, pinned: null }],
      }),
    );
    await render(
      <DataTable tableKey="people" columns={columns} data={data} rowKey="id" />,
    );
    expect(headers()).toEqual(["Email"]);
    expect(container.querySelector('button[aria-label="Table settings"]')).not.toBeNull();
  });

  it("shows the empty state", async () => {
    await render(<DataTable tableKey="empty" columns={columns} data={[]} rowKey="id" />);
    expect(container.textContent).toContain("Nothing here yet");
  });
});

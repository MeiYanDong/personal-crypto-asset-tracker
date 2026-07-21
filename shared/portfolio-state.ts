export const UNCLASSIFIED_ASSET_GROUP_ID = "unclassified";

export type AssetGroupColor = "green" | "blue" | "violet" | "gold" | "gray" | "red";

export type AssetGroup = {
  id: string;
  name: string;
  color: AssetGroupColor;
  order: number;
  createdAt: string;
  system?: boolean;
};

export type AssetGroupAssignments = Record<string, string>;

export const defaultAssetGroups: AssetGroup[] = [
  {
    id: "okx-boost",
    name: "OKX Boost",
    color: "green",
    order: 10,
    createdAt: "2026-07-21T00:00:00.000Z"
  },
  {
    id: "42-space",
    name: "42 Space",
    color: "blue",
    order: 20,
    createdAt: "2026-07-21T00:00:00.000Z"
  },
  {
    id: "virtuals",
    name: "Virtuals",
    color: "violet",
    order: 30,
    createdAt: "2026-07-21T00:00:00.000Z"
  },
  {
    id: "robinhood",
    name: "Robinhood",
    color: "gold",
    order: 40,
    createdAt: "2026-07-21T00:00:00.000Z"
  },
  {
    id: UNCLASSIFIED_ASSET_GROUP_ID,
    name: "未分类",
    color: "gray",
    order: 9999,
    createdAt: "2026-07-21T00:00:00.000Z",
    system: true
  }
];

const allowedColors = new Set<AssetGroupColor>(["green", "blue", "violet", "gold", "gray", "red"]);

export function normalizeAssetGroups(input: unknown): AssetGroup[] {
  const source = Array.isArray(input) ? input : defaultAssetGroups;
  const seen = new Set<string>();
  const groups = source.flatMap((entry, index): AssetGroup[] => {
    const item = entry as Partial<AssetGroup>;
    const id = String(item.id || "").trim();
    const name = String(item.name || "").trim();
    if (!id || !name || seen.has(id)) {
      return [];
    }

    seen.add(id);
    const color = allowedColors.has(item.color as AssetGroupColor) ? (item.color as AssetGroupColor) : "gray";
    return [
      {
        id,
        name,
        color,
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : (index + 1) * 10,
        createdAt: item.createdAt || new Date().toISOString(),
        system: id === UNCLASSIFIED_ASSET_GROUP_ID || Boolean(item.system)
      }
    ];
  });

  if (!seen.has(UNCLASSIFIED_ASSET_GROUP_ID)) {
    groups.push({ ...defaultAssetGroups.find((group) => group.id === UNCLASSIFIED_ASSET_GROUP_ID)! });
  }

  return groups.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, "zh-CN"));
}

export function inferAssetGroupId(labels: Array<string | undefined>) {
  const text = labels.filter(Boolean).join(" ").toLowerCase();
  if (/42\s*space|42space/.test(text)) {
    return "42-space";
  }
  return UNCLASSIFIED_ASSET_GROUP_ID;
}

export function assetGroupColorForIndex(index: number): AssetGroupColor {
  const colors: AssetGroupColor[] = ["green", "blue", "violet", "gold", "red"];
  return colors[index % colors.length];
}

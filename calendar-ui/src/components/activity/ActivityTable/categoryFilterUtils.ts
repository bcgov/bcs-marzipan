export interface CategoryFilterOption {
  value: string;
  label: string;
}

export function categoryNamesToIds(
  names: string[],
  options: CategoryFilterOption[]
): number[] {
  return names
    .map((name) => options.find((option) => option.label === name)?.value)
    .map((value) => Number(value))
    .filter((id) => Number.isFinite(id));
}

export function categoryIdsToNames(
  ids: number[],
  options: CategoryFilterOption[]
): string[] {
  const labelById = new Map(
    options.map((option) => [Number(option.value), option.label] as const)
  );
  return ids
    .map((id) => labelById.get(id))
    .filter((name): name is string => name != null && name.length > 0);
}

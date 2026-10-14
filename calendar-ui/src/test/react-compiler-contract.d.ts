declare module '@babel/core' {
  export function transformAsync(
    code: string,
    options?: unknown
  ): Promise<{ code?: string | null } | null>;
}

declare module '*.ts?raw' {
  const content: string;
  export default content;
}

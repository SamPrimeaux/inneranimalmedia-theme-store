/** Published CMS delivery reads. All mutation rights remain in AgentSam CMS. */
export type PublishedCmsDB = {
  prepare(sql: string): {
    bind(...values: unknown[]): { first<T=Record<string,unknown>>(): Promise<T | null> };
  };
};
export function publishedStoreSettings(db: PublishedCmsDB | undefined): Promise<Record<string, unknown> | null>;
export function publishedStoreGlobal(db: PublishedCmsDB | undefined, globalKey: 'header' | 'footer'): Promise<Record<string, unknown> | null>;

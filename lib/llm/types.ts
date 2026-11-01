export type PageImage = { mime: "image/png" | "image/jpeg" | "image/webp"; data: Buffer };

export interface PayslipExtractor {
  /** Retourneert ruwe (nog niet gevalideerde) JSON van het model. */
  extract(pages: PageImage[]): Promise<unknown>;
}

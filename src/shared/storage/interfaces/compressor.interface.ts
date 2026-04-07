export interface ICompressor {
  compress(input: Buffer, options?: CompressOptions): Promise<Buffer>;
}

export interface CompressOptions {
  quality?: number;
  width?: number;
  height?: number;
}

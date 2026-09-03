import sharp from 'sharp';
import type { CompressOptions, CompressorPort } from '../storage.port';

export class CompressorService implements CompressorPort {
  async compress(input: Buffer, options: CompressOptions = {}): Promise<Buffer> {
    const { quality = 80, width, height } = options;

    let pipeline = sharp(input);

    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
    }

    return pipeline.webp({ quality }).toBuffer();
  }
}

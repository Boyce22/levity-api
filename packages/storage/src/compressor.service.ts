import sharp from 'sharp';
import type { CompressOptions, ICompressor } from './interfaces/compressor.interface';

export class CompressorService implements ICompressor {
  async compress(input: Buffer, options: CompressOptions = {}): Promise<Buffer> {
    const { quality = 80, width, height } = options;

    let pipeline = sharp(input);

    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
    }

    return pipeline.webp({ quality }).toBuffer();
  }
}

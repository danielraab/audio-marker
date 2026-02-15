import { execFile } from 'child_process';
import { writeFile } from 'fs/promises';
import path from 'path';

/**
 * Number of peaks per second of audio.
 * Higher values = more detail but larger file.
 * 800 peaks/sec provides good waveform detail at typical zoom levels.
 */
const PEAKS_PER_SECOND = 100;

/**
 * Sample rate to use when decoding audio for peak extraction.
 * Lower than source (typically 44100) to reduce processing.
 */
const DECODE_SAMPLE_RATE = 8000;

export interface PeaksData {
  /** Array of peak values, normalized to [-1, 1] */
  peaks: number[];
  /** Duration of the audio in seconds */
  duration: number;
  /** Number of samples per peak bucket */
  sampleRate: number;
  /** Length of peaks array */
  length: number;
}

/**
 * Generate a peak list from an audio file using ffmpeg.
 *
 * Decodes the audio to mono raw PCM float32 at a reduced sample rate,
 * then downsamples to a fixed number of peaks per second by taking the
 * max absolute value in each bucket.
 *
 * @param audioFilePath - Absolute path to the audio file (MP3)
 * @returns The peaks data object
 */
export async function generatePeaks(audioFilePath: string): Promise<PeaksData> {
  // Step 1: Get duration via ffprobe
  const duration = await getAudioDuration(audioFilePath);

  // Step 2: Decode to raw PCM float32 mono via ffmpeg
  const rawPcm = await decodeToRawPcm(audioFilePath, DECODE_SAMPLE_RATE);

  // Step 3: Convert raw buffer to Float32Array
  const samples = new Float32Array(rawPcm.buffer, rawPcm.byteOffset, rawPcm.byteLength / 4);

  // Step 4: Compute peaks by downsampling
  const totalPeaks = Math.ceil(duration * PEAKS_PER_SECOND);
  const samplesPerPeak = Math.max(1, Math.floor(samples.length / totalPeaks));
  const peaks: number[] = new Array(totalPeaks) as number[];

  for (let i = 0; i < totalPeaks; i++) {
    const start = i * samplesPerPeak;
    const end = Math.min(start + samplesPerPeak, samples.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(samples[j]!);
      if (abs > max) max = abs;
    }
    // Round to 4 decimal places to reduce JSON size
    peaks[i] = Math.round(max * 10000) / 10000;
  }

  return {
    peaks,
    duration,
    sampleRate: PEAKS_PER_SECOND,
    length: peaks.length,
  };
}

/**
 * Generate peaks and save them as a JSON file alongside the audio file.
 * The JSON file has the same base name with a .json extension.
 *
 * @param audioFilePath - Absolute path to the audio file
 * @returns The path to the generated JSON file
 */
export async function generateAndSavePeaks(audioFilePath: string): Promise<string> {
  const peaksData = await generatePeaks(audioFilePath);

  // Same filename with .json extension
  const parsed = path.parse(audioFilePath);
  const jsonPath = path.join(parsed.dir, `${parsed.name}.json`);

  await writeFile(jsonPath, JSON.stringify(peaksData));

  return jsonPath;
}

/**
 * Get the duration of an audio file in seconds using ffprobe.
 */
function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffprobe',
      [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        filePath,
      ],
      { maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(new Error(`ffprobe failed: ${error.message}`));
          return;
        }
        try {
          const data = JSON.parse(stdout) as { format?: { duration?: string } };
          const duration = parseFloat(data.format?.duration ?? '0');
          if (isNaN(duration) || duration <= 0) {
            reject(new Error('Could not determine audio duration'));
            return;
          }
          resolve(duration);
        } catch (e) {
          reject(new Error(`Failed to parse ffprobe output: ${(e as Error).message}`));
        }
      }
    );
  });
}

/**
 * Decode an audio file to raw PCM float32 mono using ffmpeg.
 */
function decodeToRawPcm(filePath: string, sampleRate: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      [
        '-i', filePath,
        '-ac', '1',             // mono
        '-ar', String(sampleRate),
        '-f', 'f32le',          // raw 32-bit float, little-endian
        '-acodec', 'pcm_f32le',
        'pipe:1',
      ],
      { maxBuffer: 50 * 1024 * 1024, encoding: 'buffer' },
      (error, stdout) => {
        if (error) {
          reject(new Error(`ffmpeg decode failed: ${error.message}`));
          return;
        }
        resolve(stdout as unknown as Buffer);
      }
    );
  });
}

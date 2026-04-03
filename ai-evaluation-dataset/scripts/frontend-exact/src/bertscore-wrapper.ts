import { spawn } from 'child_process';
import * as path from 'path';

export interface BERTScoreResult {
  precision: number;
  recall: number;
  f1: number;
}

export interface BERTScoreOptions {
  lang?: string;
  modelType?: string;
}

export class BERTScoreCalculator {
  private pythonScript: string;

  constructor() {
    this.pythonScript = path.join(__dirname, 'bertscore-calculator.py');
  }

  async calculateSingle(
    prediction: string,
    reference: string,
    options: BERTScoreOptions = {}
  ): Promise<BERTScoreResult> {
    const results = await this.calculateBatch(
      [prediction],
      [reference],
      options
    );
    return results[0];
  }

  async calculateBatch(
    predictions: string[],
    references: string[],
    options: BERTScoreOptions = {}
  ): Promise<BERTScoreResult[]> {
    if (predictions.length !== references.length) {
      throw new Error('Predictions and references must have the same length');
    }

    const input = {
      predictions,
      references,
      lang: options.lang || 'en',
      model_type:
        options.modelType || process.env.BERTSCORE_MODEL || 'bert-base-uncased',
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        python.kill();
        reject(
          new Error(
            'BERTScore calculation timed out after 300 seconds. Model loading may be taking too long. Consider using a smaller model like "microsoft/deberta-base-mnli".'
          )
        );
      }, 300000);

      const python = spawn('python3', [this.pythonScript]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          const errorMsg = `Python script failed with code ${code}`;
          const stderrMsg = stderr ? `\nStderr: ${stderr}` : '';
          const stdoutMsg = stdout
            ? `\nStdout: ${stdout.substring(0, 500)}`
            : '';
          reject(new Error(`${errorMsg}${stderrMsg}${stdoutMsg}`));
          return;
        }

        try {
          const results = JSON.parse(stdout);

          if (results.error) {
            reject(new Error(`BERTScore Python error: ${results.error}`));
            return;
          }

          resolve(results);
        } catch (error) {
          const parseError =
            error instanceof Error ? error.message : String(error);
          reject(
            new Error(
              `Failed to parse BERTScore results: ${parseError}\nOutput: ${stdout.substring(0, 200)}`
            )
          );
        }
      });

      python.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });

      python.stdin.write(JSON.stringify(input));
      python.stdin.end();
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      console.log('   Testing with simple input (using fast model)...');
      const result = await this.calculateSingle('test', 'test', {
        modelType: 'bert-base-uncased',
      });
      console.log(
        `   Result: P=${result.precision}, R=${result.recall}, F1=${result.f1}`
      );
      return result.f1 > 0;
    } catch (error) {
      console.log(`   Error during availability check: ${error}`);
      return false;
    }
  }
}

let bertScoreCalculator: BERTScoreCalculator | null = null;

export function getBERTScoreCalculator(): BERTScoreCalculator {
  if (!bertScoreCalculator) {
    bertScoreCalculator = new BERTScoreCalculator();
  }
  return bertScoreCalculator;
}

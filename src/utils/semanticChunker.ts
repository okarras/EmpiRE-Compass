import type { PageContent } from './structuredPdfExtractor';

export interface SemanticChunk {
  text: string;

  pageNumber: number;

  startIndex: number;
  endIndex: number;

  embedding: number[];

  tokenEstimate: number;
}

export interface SemanticDocument {
  chunks: SemanticChunk[];

  metadata: {
    filename: string;
    totalPages: number;
    totalChunks: number;
    extractedAt: number;
  };
}

class SemanticChunker {
  private model: any = null;
  private modelLoading: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.model) {
      console.log('[SemanticChunker] Model already loaded');
      return;
    }

    if (this.modelLoading) {
      console.log('[SemanticChunker] Model loading in progress, waiting...');
      return this.modelLoading;
    }

    console.log('[SemanticChunker] Starting model initialization...');
    this.modelLoading = (async () => {
      try {
        const transformers = await import('@xenova/transformers');
        const { pipeline, env } = transformers;

        console.log(
          '[SemanticChunker] Transformers.js imported, configuring environment...'
        );

        env.allowLocalModels = true;
        env.allowRemoteModels = true;
        env.useBrowserCache = true;

        env.localModelPath = '/models/';

        console.log('[SemanticChunker] Attempting to load model...');
        console.log(
          '[SemanticChunker] Trying local model first, then CDN if needed...'
        );

        this.model = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          {
            quantized: true,
          }
        );

        console.log('[SemanticChunker] ✅ Model loaded successfully');
      } catch (error) {
        console.error(
          '[SemanticChunker] ❌ Model initialization failed:',
          error
        );
        console.error(
          '[SemanticChunker] Error details:',
          error instanceof Error ? error.message : String(error)
        );

        if (error instanceof Error) {
          if (error.message.includes('registerBackend')) {
            console.error(
              '[SemanticChunker] ONNX backend initialization failed. This may be a Vite optimization issue.'
            );
            console.error(
              '[SemanticChunker] Try: 1) Clear browser cache, 2) Restart dev server, 3) Check Vite config'
            );
          } else if (error.message.includes('JSON')) {
            console.error(
              '[SemanticChunker] Network error: Received HTML instead of model files. CDN may be blocked or unavailable.'
            );
          } else if (
            error.message.includes('fetch') ||
            error.message.includes('network')
          ) {
            console.error(
              '[SemanticChunker] Network error: Cannot download model files. Check your internet connection.'
            );
          }
        }

        this.modelLoading = null;
        throw new Error(
          'Failed to load embedding model. Please check your internet connection and try again.'
        );
      }
    })();

    await this.modelLoading;
  }

  async chunkAndEmbedDocument(
    pages: PageContent[],
    filename: string
  ): Promise<SemanticDocument> {
    console.log(
      `[SemanticChunker] Starting chunking for ${filename} (${pages.length} pages)`
    );

    await this.initialize();

    const chunks = this.splitIntoChunks(pages);
    console.log(`[SemanticChunker] Created ${chunks.length} chunks`);

    const chunksWithEmbeddings = await this.embedChunks(chunks);
    console.log(`[SemanticChunker] Generated embeddings for all chunks`);

    const document: SemanticDocument = {
      chunks: chunksWithEmbeddings,
      metadata: {
        filename,
        totalPages: pages.length,
        totalChunks: chunks.length,
        extractedAt: Date.now(),
      },
    };

    console.log(`[SemanticChunker] Document processing complete:`, {
      filename,
      pages: pages.length,
      chunks: chunks.length,
      avgChunksPerPage: (chunks.length / pages.length).toFixed(2),
    });

    return document;
  }

  async findRelevantChunks(
    question: string,
    document: SemanticDocument,
    maxTokens: number = 4000
  ): Promise<SemanticChunk[]> {
    console.log(
      `[SemanticChunker] Finding relevant chunks for question (max ${maxTokens} tokens)`
    );

    await this.initialize();

    const questionEmbedding = await this.embed(question);
    console.log(`[SemanticChunker] Generated question embedding`);

    const scored = document.chunks.map((chunk) => ({
      chunk,
      similarity: this.cosineSimilarity(questionEmbedding, chunk.embedding),
    }));

    scored.sort((a, b) => b.similarity - a.similarity);
    console.log(
      `[SemanticChunker] Top 5 similarity scores:`,
      scored.slice(0, 5).map((s) => s.similarity.toFixed(4))
    );

    const selected: SemanticChunk[] = [];
    let tokenCount = 0;

    for (const { chunk } of scored) {
      if (tokenCount + chunk.tokenEstimate <= maxTokens) {
        selected.push(chunk);
        tokenCount += chunk.tokenEstimate;
      }
    }

    console.log(
      `[SemanticChunker] Selected ${selected.length} chunks (${tokenCount} tokens)`
    );

    selected.sort((a, b) => a.pageNumber - b.pageNumber);
    const uniquePages = Array.from(new Set(selected.map((c) => c.pageNumber)));
    console.log(`[SemanticChunker] Chunks span pages:`, uniquePages.join(', '));

    return selected;
  }

  private splitIntoChunks(
    pages: PageContent[]
  ): Omit<SemanticChunk, 'embedding'>[] {
    const chunks: Omit<SemanticChunk, 'embedding'>[] = [];
    const targetChunkSize = 2000;
    const overlapSize = 500;

    console.log(
      `[SemanticChunker] Splitting with target size ${targetChunkSize}, overlap ${overlapSize}`
    );

    for (const page of pages) {
      const sentences = page.text.split(/(?<=[.!?])(?=\s)/);
      let currentChunk = '';
      let startIndex = 0;

      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;

        if (
          currentChunk &&
          currentChunk.length + trimmedSentence.length + 1 > targetChunkSize
        ) {
          chunks.push({
            text: currentChunk.trim(),
            pageNumber: page.pageNumber,
            startIndex,
            endIndex: startIndex + currentChunk.length,
            tokenEstimate: Math.ceil(currentChunk.length / 4),
          });

          const words = currentChunk.trim().split(/\s+/);
          const overlapWords = words.slice(-Math.ceil(overlapSize / 5)); // ~32 words for 160 char overlap
          currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
          startIndex += currentChunk.length - overlapSize;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
        }
      }

      if (currentChunk.trim()) {
        chunks.push({
          text: currentChunk.trim(),
          pageNumber: page.pageNumber,
          startIndex,
          endIndex: startIndex + currentChunk.length,
          tokenEstimate: Math.ceil(currentChunk.length / 4),
        });

        currentChunk = '';
        startIndex = 0;
      }
    }

    console.log(
      `[SemanticChunker] Created ${chunks.length} chunks from ${pages.length} pages`
    );
    return chunks;
  }

  private async embedChunks(
    chunks: Omit<SemanticChunk, 'embedding'>[]
  ): Promise<SemanticChunk[]> {
    const batchSize = 10;
    const result: SemanticChunk[] = [];

    console.log(
      `[SemanticChunker] Embedding ${chunks.length} chunks in batches of ${batchSize}`
    );

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c) => c.text);
      const embeddings = await this.embedBatch(texts);

      for (let j = 0; j < batch.length; j++) {
        result.push({
          ...batch[j],
          embedding: embeddings[j],
        });
      }

      console.log(
        `[SemanticChunker] Embedded ${i + batch.length}/${chunks.length} chunks`
      );
    }

    return result;
  }

  private async embed(text: string): Promise<number[]> {
    const output = await this.model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      embeddings.push(await this.embed(text));
    }
    return embeddings;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Export singleton instance
export const semanticChunker = new SemanticChunker();

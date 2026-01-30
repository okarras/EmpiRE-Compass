import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false;

interface PageContent {
  pageNumber: number;
  text: string;
  wordCount: number;
}

interface SemanticChunk {
  text: string;
  pageNumber: number;
  startIndex: number;
  endIndex: number;
  tokenEstimate: number;
}

interface SemanticChunkWithScore extends SemanticChunk {
  similarity: number;
}

class BackendSemanticChunker {
  private model: any = null;
  private modelLoading: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.model) {
      return;
    }

    if (this.modelLoading) {
      return this.modelLoading;
    }

    console.log('[BackendSemanticChunker] Initializing model...');
    this.modelLoading = (async () => {
      try {
        this.model = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          { quantized: true }
        );
        console.log('[BackendSemanticChunker] Model loaded successfully');
      } catch (error) {
        console.error(
          '[BackendSemanticChunker] Model initialization failed:',
          error
        );
        this.modelLoading = null;
        throw error;
      }
    })();

    await this.modelLoading;
  }

  private splitIntoChunks(pages: PageContent[]): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    const targetChunkSize = 2000; // ~200 tokens per chunk
    const overlapSize = 400; // ~40 tokens overlap

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
          const overlapWords = words.slice(-Math.ceil(overlapSize / 5));
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

    const chunksDictionary: Record<
      number,
      {
        count: number;
        totalChars: number;
        totalTokens: number;
        avgChunkSize: number;
      }
    > = {};

    for (const chunk of chunks) {
      if (!chunksDictionary[chunk.pageNumber]) {
        chunksDictionary[chunk.pageNumber] = {
          count: 0,
          totalChars: 0,
          totalTokens: 0,
          avgChunkSize: 0,
        };
      }
      chunksDictionary[chunk.pageNumber].count++;
      chunksDictionary[chunk.pageNumber].totalChars += chunk.text.length;
      chunksDictionary[chunk.pageNumber].totalTokens += chunk.tokenEstimate;
    }

    for (const pageNum in chunksDictionary) {
      const page = chunksDictionary[pageNum];
      page.avgChunkSize = Math.round(page.totalChars / page.count);
    }

    console.log('[BackendSemanticChunker] Chunks Dictionary (by page):');
    console.log(JSON.stringify(chunksDictionary, null, 2));
    console.log(
      `[BackendSemanticChunker] Total chunks: ${chunks.length}, Target size: ${targetChunkSize} chars`
    );

    return chunks;
  }

  private async embed(text: string): Promise<number[]> {
    const output = await this.model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
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

  async findRelevantChunks(
    question: string,
    pages: PageContent[],
    maxTokens: number = 4000
  ): Promise<SemanticChunkWithScore[]> {
    console.log(
      `[BackendSemanticChunker] Finding relevant chunks for question (max ${maxTokens} tokens)`
    );

    await this.initialize();

    const chunks = this.splitIntoChunks(pages);
    console.log(
      `[BackendSemanticChunker] Created ${chunks.length} chunks from ${pages.length} pages`
    );

    console.log(`[BackendSemanticChunker] Generating embeddings...`);
    const chunkEmbeddings = await Promise.all(
      chunks.map((chunk) => this.embed(chunk.text))
    );

    const questionEmbedding = await this.embed(question);

    const scored: SemanticChunkWithScore[] = chunks.map((chunk, i) => ({
      ...chunk,
      similarity: this.cosineSimilarity(questionEmbedding, chunkEmbeddings[i]),
    }));

    scored.sort((a, b) => b.similarity - a.similarity);
    console.log(
      `[BackendSemanticChunker] Top 5 similarity scores:`,
      scored.slice(0, 5).map((s) => s.similarity.toFixed(4))
    );

    const selected: SemanticChunkWithScore[] = [];
    let tokenCount = 0;

    for (const chunk of scored) {
      if (tokenCount + chunk.tokenEstimate <= maxTokens) {
        selected.push(chunk);
        tokenCount += chunk.tokenEstimate;
      }
    }

    console.log(
      `[BackendSemanticChunker] Selected ${selected.length} chunks (${tokenCount} tokens)`
    );

    selected.sort((a, b) => a.pageNumber - b.pageNumber);
    const uniquePages = Array.from(new Set(selected.map((c) => c.pageNumber)));
    console.log(
      `[BackendSemanticChunker] Chunks span pages:`,
      uniquePages.join(', ')
    );

    return selected;
  }
}

export const backendSemanticChunker = new BackendSemanticChunker();

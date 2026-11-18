import { describe, expect, it } from 'vitest';
import { isReasoningDump, readGeneratedText } from './aiText.js';

const leakedReasoning = JSON.stringify([
  {
    type: 'reasoning',
    text: '',
    providerMetadata: {
      openai: { itemId: 'rs_tmp_yp8a26i43m9', reasoningEncryptedContent: null },
    },
  },
]);

describe('readGeneratedText', () => {
  it('does not surface an empty reasoning-part payload as the answer', () => {
    const result = readGeneratedText({
      text: '',
      reasoning: [
        {
          type: 'reasoning',
          text: '',
          providerMetadata: {
            openai: {
              itemId: 'rs_tmp_example',
              reasoningEncryptedContent: null,
            },
          },
        },
      ],
    });

    expect(result.text).toBe('');
    expect(result.reasoning).toBeUndefined();
    expect(isReasoningDump(leakedReasoning)).toBe(true);
  });

  it('prefers answer text over reasoning metadata', () => {
    const result = readGeneratedText({
      text: leakedReasoning,
      content: [{ type: 'text', text: 'Studies increased after 2010.' }],
      reasoning: [{ type: 'reasoning', text: '' }],
    });

    expect(result.text).toBe('Studies increased after 2010.');
  });

  it('keeps a real reasoning string when the answer text is empty', () => {
    const result = readGeneratedText({
      text: '   ',
      reasoningText: 'Count papers by publication period.',
    });

    expect(result.text).toBe('Count papers by publication period.');
    expect(result.reasoning).toBe('Count papers by publication period.');
  });
});

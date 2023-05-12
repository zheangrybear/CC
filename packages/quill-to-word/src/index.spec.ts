import * as docx from 'docx';

import { expectEqualNeglectTime } from '@/test-utils/equal';

import { generateWord } from './index';
import {
  align_simple,
  alignSimple,
  blank_doc_input,
  blankDocOutput,
  block_quote_simple,
  blockquoteSimple,
  bullet_formatted,
  bullet_simple,
  bulletFormatted,
  bulletSimple,
  code_block_simple,
  codeblockSimple,
  custom_code_delta,
  custom_style_block_quote,
  custom_style_code_block,
  custom_style_header,
  custom_style_list,
  custom_style_normal,
  custom_styles_delta,
  customCodeStyle,
  customListStyle,
  customStyleBlockquote,
  customStyleHeader,
  customStyleNormal,
  embeds_simple,
  embedsSimple,
  header_simple,
  headerSimple,
  hyperlinks_simple,
  hyperlinksSimple,
  multi_paragraph_input,
  multiParagraphOutput,
  ordered_simple,
  orderedSimple,
  parsed_delta,
  parsedDelta,
  parsedDeltaArray,
  run_formatting,
  runFormatting,
  simple_paragraph_input,
  simpleParagraphOutput,
} from './test-io';

describe('converts quill to docx', () => {
  test('blank doc', async () => {
    const input = await generateWord(blank_doc_input);
    const output = await blankDocOutput();
    expectEqualNeglectTime(input, output);
  });

  test('simple paragraph', async () => {
    const input = await generateWord(simple_paragraph_input);
    const output = await simpleParagraphOutput();
    expectEqualNeglectTime(input, output);
  });

  test('multi paragraph', async () => {
    const input = await generateWord(multi_paragraph_input);
    const output = await multiParagraphOutput();
    expectEqualNeglectTime(input, output);
  });

  test('run formatting', async () => {
    const input = await generateWord(run_formatting);
    const output = await runFormatting();
    expectEqualNeglectTime(input, output);
  });

  test.skip('simple hyperlinks', async () => {
    const input = await generateWord(hyperlinks_simple);
    const output = await hyperlinksSimple();
    expectEqualNeglectTime(input, output);
  });

  test('simple headers', async () => {
    const input = await generateWord(header_simple);
    const output = await headerSimple();
    expectEqualNeglectTime(input, output);
  });

  test('simple code block', async () => {
    const input = await generateWord(code_block_simple);
    const output = await codeblockSimple();
    expectEqualNeglectTime(input, output);
  });

  test('simple block quote', async () => {
    const input = await generateWord(block_quote_simple);
    const output = await blockquoteSimple();
    expectEqualNeglectTime(input, output);
  });

  test('simple alignment', async () => {
    const input = await generateWord(align_simple);
    const output = await alignSimple();
    expectEqualNeglectTime(input, output);
  });

  test('simple bullet', async () => {
    const input = await generateWord(bullet_simple);
    const output = await bulletSimple();
    expectEqualNeglectTime(input, output);
  });

  test('bullet with format', async () => {
    const input = await generateWord(bullet_formatted);
    const output = await bulletFormatted();
    expectEqualNeglectTime(input, output);
  });

  test('ordered list', async () => {
    const input = await generateWord(ordered_simple);
    const output = await orderedSimple();
    expectEqualNeglectTime(input, output);
  });

  test('embeds simple', async () => {
    const input = await generateWord(embeds_simple);
    const output = await embedsSimple();
    expectEqualNeglectTime(input, output);
  });

  test('input parsed delta', async () => {
    const input = await generateWord(parsed_delta);
    const output = await parsedDelta();
    expectEqualNeglectTime(input, output);
  });

  test('parsed delta array', async () => {
    const input = await generateWord([parsed_delta, parsed_delta]);
    const output = await parsedDeltaArray();
    expectEqualNeglectTime(input, output);
  });
});

describe('custom style configuration', () => {
  test('custom heading style', async () => {
    const input = await generateWord(custom_styles_delta, custom_style_header);
    const output = await customStyleHeader();
    expectEqualNeglectTime(input, output);
  });

  test('custom normal style', async () => {
    const input = await generateWord(custom_styles_delta, custom_style_normal);
    const output = await customStyleNormal();
    expectEqualNeglectTime(input, output);
  });

  test('custom style blockquote', async () => {
    const input = await generateWord(custom_styles_delta, custom_style_block_quote);
    const output = await customStyleBlockquote();
    expectEqualNeglectTime(input, output);
  });

  test('custom code style', async () => {
    const input = await generateWord(custom_code_delta, custom_style_code_block);
    const output = await customCodeStyle();
    expectEqualNeglectTime(input, output);
  });

  test('custom style list', async () => {
    const input = await generateWord(bullet_simple, custom_style_list);
    const output = await customListStyle();
    expectEqualNeglectTime(input, output);
  });
});

describe('custom export format configuration', () => {
  test('export to blob', async () => {
    const output = await generateWord(bullet_formatted, { exportAs: 'blob' });
    expect(output instanceof Blob).toBe(true);
  });

  test('export to buffer', async () => {
    const output = await generateWord(simple_paragraph_input, { exportAs: 'buffer' });
    const buffer = Buffer.isBuffer(output);
    const uint8 = output instanceof Uint8Array;
    expect(buffer || uint8).toBe(true);
  });

  test('export to base64 string', async () => {
    const output = await generateWord(header_simple, { exportAs: 'base64' });
    expect(typeof output).toBe('string');
  });

  test('export to doc', async () => {
    const output = await generateWord(ordered_simple, { exportAs: 'doc' });
    expect(output instanceof docx.Document).toBe(true);
  });
});

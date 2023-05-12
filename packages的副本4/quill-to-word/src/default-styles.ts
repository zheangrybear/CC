import { AlignmentType } from 'docx';

import type { CustomLevels } from './interfaces';

export const defaultStyles = [
  {
    id: 'normal_font',
    name: 'Normal',
    next: 'normal',
    basedOn: 'normal',
    quickFormat: true,
    run: {
      size: 24,
    },
    paragraph: {
      spacing: {
        line: 240,
        before: 0,
        after: 0,
      },
    },
  },
  {
    id: 'header_1',
    name: 'Heading 1',
    next: 'normal',
    quickFormat: true,
    run: {
      font: 'Calibri',
      size: 44,
      bold: true,
    },
    paragraph: {
      spacing: {
        before: 450,
        after: 400,
      },
    },
  },
  {
    id: 'header_2',
    name: 'Heading 2',
    basedOn: 'normal',
    next: 'normal',
    quickFormat: true,
    run: {
      font: 'Calibri',
      size: 36,
      bold: true,
    },
    paragraph: {
      spacing: {
        before: 250,
        after: 150,
      },
    },
  },
  {
    id: 'header_3',
    name: 'Heading 3',
    basedOn: 'normal',
    next: 'normal',
    quickFormat: true,
    run: {
      font: 'Calibri',
      size: 30,
      bold: true,
    },
    paragraph: {
      spacing: {
        before: 200,
        after: 100,
      },
    },
  },
  {
    id: 'header_4',
    name: 'Heading 4',
    basedOn: 'normal',
    next: 'normal',
    quickFormat: true,
    run: {
      font: 'Calibri',
      size: 28,
      bold: true,
    },
    paragraph: {
      spacing: {
        before: 200,
        after: 100,
      },
    },
  },
  {
    id: 'list_paragraph',
    name: 'List Paragraph',
    basedOn: 'normal',
    quickFormat: true,
    run: {
      size: 24,
    },
  },
  {
    id: 'code_block',
    name: 'Code Block',
    basedOn: 'normal',
    quickFormat: true,
    run: {
      size: 24,
      font: 'Courier New',
    },
    paragraph: {
      indent: { left: 720, right: 720 },
    },
  },
  {
    id: 'block_quote',
    name: 'Block Quote',
    basedOn: 'normal',
    quickFormat: true,
    run: {
      italics: true,
      size: 24,
    },
    paragraph: {
      indent: { left: 250 },
      spacing: {
        after: 120,
        before: 120,
      },
      border: {
        left: {
          size: 25,
          space: 10,
          color: 'cccccc',
          value: 'single',
        },
      },
    },
  },
  {
    id: 'citation',
    name: 'Citation',
    basedOn: 'normal',
    quickFormat: true,
    run: {
      size: 24,
    },
    paragraph: {
      indent: {
        left: 0,
        hanging: 320,
      },
      spacing: {
        line: 480,
      },
    },
  },
  {
    id: 'banner',
    name: 'Banner',
    basedOn: 'normal',
    quickFormat: true,
    run: {
      size: 24,
    },
  },
  {
    id: 'banner_yellow',
    name: 'Banner Yellow',
    basedOn: 'banner',
    paragraph: {
      indent: { left: 250 },
      shading: {
        fill: 'fff9ec',
      },
      spacing: {
        after: 120,
        before: 120,
      },
      border: {
        left: {
          size: 25,
          space: 10,
          color: 'fcb414',
          value: 'single',
        },
      },
    },
  },
  {
    id: 'banner_blue',
    name: 'Banner Blue',
    basedOn: 'banner',
    paragraph: {
      indent: { left: 250 },
      shading: {
        fill: 'f2f8ff',
      },
      spacing: {
        after: 120,
        before: 120,
      },
      border: {
        left: {
          size: 25,
          space: 10,
          color: '207af1',
          value: 'single',
        },
      },
    },
  },
  {
    id: 'banner_red',
    name: 'Banner Red',
    basedOn: 'banner',
    paragraph: {
      indent: { left: 250 },
      shading: {
        fill: 'fef4f2',
      },
      spacing: {
        after: 120,
        before: 120,
      },
      border: {
        left: {
          size: 25,
          space: 10,
          color: 'ff4343',
          value: 'single',
        },
      },
    },
  },
  {
    id: 'banner_green',
    name: 'Banner Green',
    basedOn: 'banner',
    paragraph: {
      indent: { left: 250 },
      shading: {
        fill: 'edfef6',
      },
      spacing: {
        after: 120,
        before: 120,
      },
      border: {
        left: {
          size: 25,
          space: 10,
          color: '04be8c',
          value: 'single',
        },
      },
    },
  },
];

export const customNumberedLevels: CustomLevels[] = [
  {
    level: 0,
    format: 'decimal',
    text: '%1.',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 360, hanging: 360 },
      },
    },
  },
  {
    level: 1,
    format: 'lowerLetter',
    text: '%2）',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 1080, hanging: 360 },
      },
    },
  },
  {
    level: 2,
    format: 'lowerRoman',
    text: '%3.',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 1800, hanging: 360 },
      },
    },
  },
  {
    level: 3,
    format: 'decimal',
    text: '%4.',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 2520, hanging: 360 },
      },
    },
  },
  {
    level: 4,
    format: 'lowerLetter',
    text: '%5）',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 3240, hanging: 360 },
      },
    },
  },
  {
    level: 5,
    format: 'lowerRoman',
    text: '%6.',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 3960, hanging: 360 },
      },
    },
  },
  {
    level: 6,
    format: 'decimal',
    text: '%7.',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 4680, hanging: 360 },
      },
    },
  },
  {
    level: 7,
    format: 'lowerLetter',
    text: '%8）',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 5400, hanging: 360 },
      },
    },
  },
  {
    level: 8,
    format: 'lowerRoman',
    text: '%9.',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 6120, hanging: 360 },
      },
    },
  },
];

export const customBulletLevels: CustomLevels[] = [
  {
    level: 0,
    format: 'bullet',
    text: '\u25cf',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 360, hanging: 360 },
      },
    },
  },
  {
    level: 1,
    format: 'bullet',
    text: '\u25cb',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 1080, hanging: 360 },
      },
    },
  },
  {
    level: 2,
    format: 'bullet',
    text: '\u25a0',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 1800, hanging: 360 },
      },
    },
  },
  {
    level: 3,
    format: 'bullet',
    text: '\u25a0',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 2520, hanging: 360 },
      },
    },
  },
  {
    level: 4,
    format: 'bullet',
    text: '\u25a0',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 3240, hanging: 360 },
      },
    },
  },
  {
    level: 5,
    format: 'bullet',
    text: '\u25a0',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 3960, hanging: 360 },
      },
    },
  },
  {
    level: 6,
    format: 'bullet',
    text: '\u25a0',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 3960, hanging: 360 },
      },
    },
  },
  {
    level: 7,
    format: 'bullet',
    text: '\u25a0',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 3960, hanging: 360 },
      },
    },
  },
  {
    level: 8,
    format: 'bullet',
    text: '\u25a0',
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 3960, hanging: 360 },
      },
    },
  },
];

export const defaultNumbering = {
  config: [
    {
      reference: 'default-numbering',
      levels: customNumberedLevels,
    },
  ],
};

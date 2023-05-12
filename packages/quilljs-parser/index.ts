export interface InsertEmbed {
  image?: string;
  formula?: string;
  video?: string;
}

export interface RunAttributes {
  script?: 'super' | 'sub';
  color?: string;
  background?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  font?: string;
  link?: string;
  table?: string;
  size?: 'small' | 'large' | 'huge';
}

export interface LineAttributes {
  header?: 1 | 2;
  direction?: 'rtl';
  align?: 'right' | 'left' | 'center' | 'justify';
  indent?: number;
  blockquote?: boolean;
  width?: number;
  height?: number;
  thematic_break?: boolean;
  banner?: 'yellow' | 'red' | 'blue' | 'green';
  list?: 'ordered' | 'bullet' | 'unordered' | 'checked' | 'unchecked';
  'code-block'?: boolean;
}

export interface Attributes extends RunAttributes, LineAttributes {}

export interface QuillOp {
  insert?: string | InsertEmbed;
  attributes?: Attributes;
  lineAttributes?: LineAttributes;
  runAttributes?: RunAttributes;
}

export interface RawQuillDelta {
  ops: QuillOp[];
}

// OUTPUT

export interface TextRun {
  text: string;
  attributes?: RunAttributes;
}

export interface FormulaRun {
  formula: string;
  attributes?: RunAttributes;
}

export interface Paragraph {
  textRuns?: (TextRun | FormulaRun)[];
  embed?: InsertEmbed;
  attributes?: LineAttributes;
}

export interface QHyperLink {
  text: string;
  link: string;
}

export interface SetupInfo {
  numberedLists: number;
  hyperlinks: QHyperLink[];
}

export interface ParsedQuillDelta {
  paragraphs: Paragraph[];
  setup: SetupInfo;
}

// Functions
let activeNumberedList = false;
const parsedOps: QuillOp[] = [];

export function parseQuillDelta(quill: RawQuillDelta): ParsedQuillDelta {
  activeNumberedList = false;
  const parsed: ParsedQuillDelta = {
    paragraphs: [],
    setup: {
      numberedLists: 0,
      hyperlinks: [],
    },
  };
  // eslint-disable-next-line no-restricted-syntax
  for (const op of quill.ops) {
    parseOp(op, parsed);
  }
  return parsed;
}

function parseOp(op: QuillOp, parsed: ParsedQuillDelta) {
  // handle videos and images
  if ((op.insert as InsertEmbed).video || (op.insert as InsertEmbed).image) {
    insertEmbedParagraph(op, parsed);
    // handle formulas
  } else if ((op.insert as InsertEmbed).formula) {
    insertFormula(op, parsed);
    // handle table newlines
  } else if ((op.attributes as RunAttributes)?.table) {
    insertTableLine(op, parsed);
    // handle exclusive newlines
  } else if ((op.insert as string)?.match(/^[\n]+$/g)) {
    insertNewline(op, parsed);
    // handle text and text with newlines intermixed
  } else {
    insertText(op, parsed);
  }
  parsedOps.push(op);
}

// insert a blank paragraph
function startNewParagraph(parsed: ParsedQuillDelta) {
  parsed.paragraphs.push({
    textRuns: [],
  });
}

// inserts a video or image embed
function insertEmbedParagraph(op: QuillOp, parsed: ParsedQuillDelta) {
  parsed.paragraphs.push({
    embed: op.insert as InsertEmbed,
    attributes: op.attributes,
  });
  activeNumberedList = false;
  startNewParagraph(parsed);
}

// inserts a formula embed
function insertFormula(op: QuillOp, parsed: ParsedQuillDelta) {
  if (parsed.paragraphs.length === 0) {
    startNewParagraph(parsed);
  }
  parsed.paragraphs[parsed.paragraphs.length - 1].textRuns?.push({
    formula: (op.insert as InsertEmbed).formula!,
    attributes: op.attributes,
  });
}

// inserts a new table
function insertTableLine(op: QuillOp, parsed: ParsedQuillDelta) {
  // first line is table
  if (parsed.paragraphs.length === 0) {
    startNewParagraph(parsed);
  }

  if (
    parsed.paragraphs[parsed.paragraphs.length - 1].textRuns?.length === 0 ||
    (parsedOps[parsedOps.length - 1]?.attributes?.table && ((op.insert as string).match(/\n/g) || []).length >= 1)
  ) {
    const count = ((op.insert as string).match(/\n/g) || []).length;
    for (let i = 0; i < count; i += 1) {
      insertSimpleString('', parsed, op.attributes);
    }
  } else {
    const runs = parsed.paragraphs[parsed.paragraphs.length - 1].textRuns;
    if (runs) {
      const count = ((op.insert as string).match(/\n/g) || []).length;
      const lastRun = runs[runs.length - 1];
      if (lastRun) (lastRun as TextRun).attributes = { ...((lastRun as TextRun).attributes ?? {}), ...op.attributes };
      for (let i = 0; i < count - 1; i += 1) {
        insertSimpleString('', parsed, op.attributes);
      }
    }
  }
}

// inserts a new paragraph and applies line formatting
function insertNewline(op: QuillOp, parsed: ParsedQuillDelta) {
  if (parsed.paragraphs.length === 0) {
    startNewParagraph(parsed);
  }
  // if line attributes, apply those to the previous paragraph
  if (op.attributes) {
    if (parsedOps[parsedOps.length - 2]?.attributes?.table && !op.attributes?.table) {
      // remove last element from table
      const runs = parsed.paragraphs[parsed.paragraphs.length - 1].textRuns;
      const run = runs?.splice(runs.length - 1, 1)?.[0];
      const text = (run as TextRun)?.text ?? (run as FormulaRun)?.formula;
      if (text) {
        parsed.paragraphs.push({ textRuns: [{ text }] });
      }
    }

    if (op.attributes?.thematic_break && parsed.paragraphs.length > 1) {
      const lastParsedParagraph = parsed.paragraphs[parsed.paragraphs.length - 1];
      const runs = lastParsedParagraph.textRuns;
      if (
        (runs?.length === 1 && !(runs[0] as TextRun).text && !(runs[0] as FormulaRun).formula) ||
        runs?.length === 0
      ) {
        parsed.paragraphs.splice(parsed.paragraphs.length - 1);
        // eslint-disable-next-line no-param-reassign
        parsed.paragraphs[parsed.paragraphs.length - 1].attributes = parsed.paragraphs[parsed.paragraphs.length - 1]
          .attributes
          ? {
              ...parsed.paragraphs[parsed.paragraphs.length - 1].attributes,
              thematic_break: true,
            }
          : { thematic_break: true };
      } else if (parsed.paragraphs.length > 2) {
        // eslint-disable-next-line no-param-reassign
        parsed.paragraphs[parsed.paragraphs.length - 2].attributes = parsed.paragraphs[parsed.paragraphs.length - 1]
          .attributes
          ? {
              ...parsed.paragraphs[parsed.paragraphs.length - 1].attributes,
              thematic_break: true,
            }
          : { thematic_break: true };
      }
    } else {
      // eslint-disable-next-line no-param-reassign
      parsed.paragraphs[parsed.paragraphs.length - 1].attributes = {
        ...(parsed.paragraphs[parsed.paragraphs.length - 1].attributes ?? {}),
        ...op.attributes,
      };
    }

    if (op.attributes.list === 'ordered') {
      // if already an active numbered list
      if (activeNumberedList) {
        // do not increment
        // leave active list true
      } else {
        // incrememnt
        // set active to true
        // eslint-disable-next-line no-plusplus, no-param-reassign
        parsed.setup.numberedLists++;
        activeNumberedList = true;
      }
    } else {
      activeNumberedList = false;
    }
  }

  if (
    !op.attributes?.thematic_break ||
    (parsed.paragraphs.length === 1 && parsed.paragraphs[0].attributes?.thematic_break)
  ) {
    const count = ((op.insert as string).match(/\n/g) || []).length;
    for (let i = 0; i < count; i += 1) {
      startNewParagraph(parsed);
    }
  }
}

// inserts text with intermixed newlines and run attributes
function insertText(op: QuillOp, parsed: ParsedQuillDelta) {
  if (parsed.paragraphs.length === 0) {
    startNewParagraph(parsed);
  }

  // if it contains newline characters
  if ((op.insert as string).match(/\n/)) {
    if (parsedOps[parsedOps.length - 1]?.attributes?.table) {
      startNewParagraph(parsed);
    }
    const strings = splitStrings(op.insert as string);
    // eslint-disable-next-line no-restricted-syntax
    for (const text of strings) {
      if (text === '\n') {
        startNewParagraph(parsed);
        activeNumberedList = false;
      } else if (text) {
        insertSimpleString(text, parsed);
      }
    }
  } else {
    insertSimpleString(op.insert as string, parsed, op.attributes);
  }
}

// inserts simple string with attributes
function insertSimpleString(text: string, parsed: ParsedQuillDelta, attributes?: RunAttributes) {
  if (attributes) {
    parsed.paragraphs[parsed.paragraphs.length - 1].textRuns?.push({
      text,
      attributes,
    });
    if (attributes.link) {
      parsed.setup.hyperlinks.push({ text, link: attributes.link });
    }
  } else {
    parsed.paragraphs[parsed.paragraphs.length - 1].textRuns?.push({
      text,
    });
  }
}

// splits strings on every newline character, keeping the newline characters; returns array
function splitStrings(string: string): string[] {
  return string.split(/(\n)/);
}

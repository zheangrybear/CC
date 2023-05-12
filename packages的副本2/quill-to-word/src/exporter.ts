/* eslint-disable */
import {
  ParsedQuillDelta,
  Paragraph as QParagraph,
  TextRun as QTextRun,
  parseQuillDelta,
  RawQuillDelta,
  QHyperLink,
  LineAttributes,
  FormulaRun as QFormulaRun,
} from '../../quilljs-parser';
import * as docx from 'docx';
import {
  AlignmentType,
  HyperlinkRef,
  HyperlinkType,
  MathRun,
  Media,
  Math,
  Numbering,
  Packer,
  Paragraph,
  SymbolRun,
  TextRun,
  UnderlineType,
  Table,
  TableRow,
  TableCell,
  ITableOptions,
  WidthType,
} from 'docx';
import { customBulletLevels, customNumberedLevels, defaultStyles } from './default-styles';
import {
  Config,
  CustomLevels,
  ExportObject,
  NumberedList,
  NumberingConfig,
  StyleConfig,
  StyleProperties,
} from './interfaces';

interface LineAttr extends LineAttributes {
  citation: boolean;
}

interface ParagraphAlt extends QParagraph {
  attributes: LineAttr;
}

let linkTracker = 0;
let numberedTracker = -1;
let styles = defaultStyles;
let levels: CustomLevels[] = customNumberedLevels;
let customBullets = false;

// main public function to generate docx document
export async function generateWord(
  delta: RawQuillDelta | ParsedQuillDelta | ParsedQuillDelta[],
  config?: Config
): Promise<ExportObject> {
  linkTracker = 0; // reset link tracker
  numberedTracker = -1; // reset numered list tracker
  customBullets = false; // reset custom bullets
  let doc: docx.Document;
  // create a container for the docx doc sections
  const sections: (Paragraph | Table)[][] = [];
  // create a container for the parsed Quill deltas
  const parsedDeltas: ParsedQuillDelta[] = [];
  // if input is a raw quill delta
  if ((delta as RawQuillDelta).ops) {
    const parsedDelta = parseQuillDelta(delta as RawQuillDelta);
    parsedDeltas.push(parsedDelta);
    // if input is an array of parsed quill deltas
  } else if (Array.isArray(delta)) {
    for (const eachDelta of delta) {
      parsedDeltas.push(eachDelta);
    }
    // if input is a single parsed quill delta
  } else if ((delta as ParsedQuillDelta).paragraphs) {
    parsedDeltas.push(delta as ParsedQuillDelta);
    // if input is not recognized
  } else {
    throw new Error(
      'Please provide a raw Quill Delta, a parsed Quill delta, or an Array of parsed Quill deltas. See QuillTodocx readme.'
    );
  }
  // set up the docx document based on configuration
  doc = setupDoc(parsedDeltas[0], config);
  // build docx sections
  for (const delta of parsedDeltas) {
    sections.push(await buildSection(delta.paragraphs, doc));
  }
  // add docx sections to doc
  for (const section of sections) {
    doc.addSection({
      children: section,
    });
  }
  // return the appropriate export object based on configuration
  return exportDoc(doc, config);
}

// set a style's paragraph and run properties
function setStyle(style: StyleProperties, styleId: string, index: number) {
  if (style.paragraph) {
    styles[index].paragraph = style.paragraph as any;
  }
  if (style.run) {
    styles[index].run = style.run as any;
  }
}

// apply custom paragraph styles from the user
function setParagraphsStyles(paragraphStyles: StyleConfig) {
  if (paragraphStyles.normal) {
    const index = styles.findIndex((style) => style.id === 'normal_font');
    setStyle(paragraphStyles.normal, 'normal', index);
  }
  if (paragraphStyles.header_1) {
    const index = styles.findIndex((style) => style.id === 'header_1');
    setStyle(paragraphStyles.header_1, 'header_1', index);
  }
  if (paragraphStyles.header_2) {
    const index = styles.findIndex((style) => style.id === 'header_2');
    setStyle(paragraphStyles.header_2, 'header_2', index);
  }
  if (paragraphStyles.list_paragraph) {
    const index = styles.findIndex((style) => style.id === 'list_paragraph');
    setStyle(paragraphStyles.list_paragraph, 'list_paragraph', index);
  }
  if (paragraphStyles.code_block) {
    const index = styles.findIndex((style) => style.id === 'code_block');
    setStyle(paragraphStyles.code_block, 'code_block', index);
  }
  if (paragraphStyles.block_quote) {
    const index = styles.findIndex((style) => style.id === 'block_quote');
    setStyle(paragraphStyles.block_quote, 'block_quote', index);
  }
  if (paragraphStyles.citation) {
    const index = styles.findIndex((style) => style.id === 'citation');
    setStyle(paragraphStyles.citation, 'citation', index);
  }
}

// apply custom configuration from the user
function setupConfig(config: Config) {
  if (config.paragraphStyles) {
    setParagraphsStyles(config.paragraphStyles);
  }
  if (config.customLevels) {
    levels = config.customLevels;
  }
}

// sets up the docx document
function setupDoc(parsedDelta: ParsedQuillDelta, config?: Config): docx.Document {
  styles = defaultStyles; // reset back to original
  levels = customNumberedLevels; // reset back to original
  if (config) {
    setupConfig(config);
  }
  let hyperlinks: any = undefined;
  let numbering: NumberingConfig | undefined = undefined;
  // build the hyperlinks property
  if (parsedDelta.setup.hyperlinks.length > 0) {
    hyperlinks = buildHyperlinks(parsedDelta.setup.hyperlinks);
  }
  // build the numbering property
  if (parsedDelta.setup.numberedLists > 0) {
    numbering = buildNumbering(parsedDelta.setup.numberedLists);
  }
  if (config?.customBulletLevels) {
    numbering = addCustomBullets(numbering, config.customBulletLevels);
    customBullets = true;
  }

  const doc = new docx.Document({
    styles: {
      paragraphStyles: styles,
    },
    numbering: numbering as any,
    hyperlinks: hyperlinks,
  });
  return doc;
}

// export the appropriate object based on configuration
async function exportDoc(doc: docx.Document, config?: Config): Promise<ExportObject> {
  if (!config || !config.exportAs || config.exportAs === 'doc') {
    return doc;
  }
  if (config.exportAs === 'blob') {
    return Packer.toBlob(doc);
  }
  if (config.exportAs === 'buffer') {
    console.log('returning buffer');
    return Packer.toBuffer(doc);
  }
  if (config.exportAs === 'base64') {
    return Packer.toBase64String(doc);
  }
  throw new Error('Please set exportAs configuration to blob, buffer, doc, or base64.');
}

// build docx numbering object from quill numbered lists
function buildNumbering(numberOfLists: number): NumberingConfig {
  let config: any[] = [];
  let numberTracker = 0;
  // create a new docx numbering object for each quill numbered list
  while (numberTracker < numberOfLists) {
    const newList = {
      reference: `numbered_${numberTracker}`,
      levels: levels,
    };
    config.push(newList);
    numberTracker++;
  }
  const numberConfig = {
    config: config,
  };
  return numberConfig;
}

// adds a custom bullet styled list to the numbering configuration
function addCustomBullets(numberConfig: NumberingConfig | undefined, bulletLevels: CustomLevels[]): NumberingConfig {
  const customBullets: NumberedList = {
    reference: 'customBullets',
    levels: bulletLevels,
  };
  if (numberConfig) {
    numberConfig.config.push(customBullets);
    return numberConfig;
  } else {
    return {
      config: [customBullets],
    };
  }
}

// build a docx hyperlinks object from the quill hyperlinks
function buildHyperlinks(quillLinks: QHyperLink[]): object {
  let hyperlinks: any = {};
  let linkTracker = 0;
  // generate a new docx link object from each quill link; merge into hyperlinks object
  for (const link of quillLinks) {
    const docLink = {
      link: link.link,
      text: link.text,
      type: HyperlinkType.EXTERNAL,
    };
    hyperlinks = {
      ...hyperlinks,
      [`link${linkTracker}`]: docLink,
    };
    linkTracker++;
  }
  return hyperlinks;
}

// generate a section as an array of paragraphs
async function buildSection(quillParagraphs: QParagraph[], doc: docx.Document): Promise<(Paragraph | Table)[]> {
  let quillParagraphTracker = 0;
  // create a container to hold the docx paragraphs
  const paragraphs: (Paragraph | Table)[] = [];
  // build a docx paragraph from each delta paragraph
  for (const paragraph of quillParagraphs) {
    // if embed video or image
    if (paragraph.embed?.image) {
      const imageBuffer = await fetch(paragraph.embed.image).then((response) => response.arrayBuffer());
      let w = paragraph.attributes?.width ?? 300;
      let h = paragraph.attributes?.height ?? 250;
      if (w > 580) {
        h = (580 * h) / w;
        w = 580;
      }
      const image = Media.addImage(doc, imageBuffer, w, h + 1);
      paragraphs.push(
        new Paragraph({
          children: [image],
          alignment:
            paragraph.attributes?.align === 'left'
              ? AlignmentType.LEFT
              : paragraph.attributes?.align === 'right'
              ? AlignmentType.RIGHT
              : AlignmentType.CENTER,
        })
      );
    } else if (paragraph.embed?.video) {
      const run = buildVideo(paragraph.embed.video);
      paragraphs.push(new Paragraph({ children: [run] }));
      // if text runs
    } else if (paragraph.textRuns) {
      if (paragraph.textRuns.length > 0 && paragraph.textRuns[0].attributes?.table) {
        // handle table
        paragraphs.push(buildTable(paragraph));
      } else {
        // handle ordered list tracking
        if (paragraph.attributes?.list === 'ordered') {
          if (quillParagraphTracker > 0 && quillParagraphs[quillParagraphTracker - 1].attributes?.list === 'ordered') {
            numberedTracker = numberedTracker;
          } else {
            numberedTracker++;
          }
        }
        paragraphs.push(buildParagraph(paragraph));
      }
    }
    quillParagraphTracker++;
  }
  return paragraphs;
}

function buildTable(paragraph: QParagraph): Table {
  const table = new Table({
    rows: buildTableRows(paragraph),
  });
  return table;
}

function buildTableRows(paragraph: QParagraph): TableRow[] {
  const rows = [] as TableRow[];
  let rowID: string | undefined = paragraph.textRuns![0].attributes?.table;
  let cells: TableCell[] = [];
  let length = paragraph.textRuns!.length;
  for (let i = 0; i < length; i++) {
    if (paragraph.textRuns![i].attributes?.table !== rowID) {
      rows.push(buildTableRow(cells));
      rowID = paragraph.textRuns![i].attributes?.table;
      cells = [];
    }
    cells.push(buildTableCell(paragraph.textRuns![i] as QTextRun));
    if (i === length - 1) {
      rows.push(buildTableRow(cells));
    }
  }
  return rows;
}

function buildTableRow(cells: TableCell[]): TableRow {
  return new TableRow({
    children: cells,
  });
}

function buildTableCell(run: QTextRun): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [buildTextRun(run)] })],
    width: { size: 1, type: WidthType.PERCENTAGE },
  });
}

// generate a paragraph as an array of text runs
function buildParagraph(paragraph: QParagraph): Paragraph {
  // container to hold docx text runs
  const runs: (TextRun | HyperlinkRef | Math)[] = [];
  if (paragraph.attributes?.list === 'checked') {
    runs.push(new SymbolRun({ char: 'F0FE' }));
  } else if (paragraph.attributes?.list === 'unchecked') {
    runs.push(new SymbolRun({ char: 'F06F' }));
  }

  // build a docx run from each delta run
  for (const run of paragraph.textRuns!) {
    // if formula
    if ((run as QFormulaRun).formula) {
      runs.push(buildFormula(run as QFormulaRun));
      // if text
    } else if ((run as QTextRun).text) {
      runs.push(buildTextRun(run as QTextRun));
    }
  }

  const docxParagraph = new Paragraph({
    children: runs,

    thematicBreak: paragraph.attributes?.['thematic_break'],

    heading:
      paragraph.attributes?.header === 1
        ? docx.HeadingLevel.HEADING_1
        : paragraph.attributes?.header === 2
        ? docx.HeadingLevel.HEADING_2
        : paragraph.attributes?.header === 3
        ? docx.HeadingLevel.HEADING_3
        : paragraph.attributes?.header === 4
        ? docx.HeadingLevel.HEADING_4
        : undefined,

    bullet:
      (paragraph.attributes?.list === 'bullet' || paragraph.attributes?.list === 'unordered') && !customBullets
        ? { level: paragraph.attributes.indent ? paragraph.attributes.indent : 0 }
        : undefined,

    numbering:
      paragraph.attributes?.list === 'ordered'
        ? {
            reference: `numbered_${numberedTracker}`,
            level: paragraph.attributes.indent ? paragraph.attributes.indent : 0,
          }
        : (paragraph.attributes?.list === 'bullet' || paragraph.attributes?.list === 'unordered') && customBullets
        ? { reference: 'customBullets', level: paragraph.attributes.indent ? paragraph.attributes.indent : 0 }
        : undefined,

    alignment:
      paragraph.attributes?.align === 'left'
        ? AlignmentType.LEFT
        : paragraph.attributes?.align === 'center'
        ? AlignmentType.CENTER
        : paragraph.attributes?.align === 'right'
        ? AlignmentType.RIGHT
        : paragraph.attributes?.align === 'justify'
        ? AlignmentType.JUSTIFIED
        : undefined,

    style: paragraph.attributes?.banner
      ? `banner_${paragraph.attributes.banner}`
      : paragraph.attributes?.['code-block']
      ? 'code_block'
      : paragraph.attributes?.blockquote
      ? 'block_quote'
      : (paragraph as ParagraphAlt).attributes?.citation
      ? 'citation'
      : undefined,
    // bidirectional: paragraph.attributes?.direction === 'rtl' ? true : undefined,
    // indent
  });
  return docxParagraph;
}

// generate a docx text run from quill text run
function buildTextRun(run: QTextRun): TextRun | HyperlinkRef {
  let textRun: TextRun | HyperlinkRef;
  if (run.attributes?.link) {
    textRun = new HyperlinkRef(`link${linkTracker}`);
    linkTracker++;
  } else {
    textRun = new TextRun({
      text: run.text,
      bold: run.attributes?.bold ? true : false,
      italics: run.attributes?.italic ? true : false,
      subScript: run.attributes?.script === 'sub' ? true : false,
      superScript: run.attributes?.script === 'super' ? true : false,
      strike: run.attributes?.strike ? true : false,
      underline: run.attributes?.underline ? { type: UnderlineType.SINGLE, color: 'auto' } : undefined,
      color: run.attributes?.color ? run.attributes?.color.slice(1) : undefined,
      size:
        run.attributes?.size === 'huge'
          ? 36
          : run.attributes?.size === 'large'
          ? 32
          : run.attributes?.size === 'small'
          ? 20
          : undefined,
      // rightToLeft: paragraph.attributes?.direction === 'rtl' ? true : undefined
      // font
      // highlight: run.attributes?.background ? 'yellow' : undefined,
    });
  }
  return textRun;
}

// build a formula
function buildFormula(formula: QFormulaRun) {
  return new Math({
    children: [new MathRun(formula.formula)],
  });
}

// build a video
function buildVideo(video: string) {
  return new TextRun({
    text: video,
  });
}

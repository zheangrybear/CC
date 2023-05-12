import type * as docx from 'docx';

export type ExportObject = docx.Document | Blob | Buffer | string;

export interface ParagraphProperties {
  spacing?: {
    line?: number;
    before?: number;
    after?: number;
  };
  alignment?: docx.AlignmentType;
  indent?: {
    left?: number;
    hanging?: number;
    right?: number;
  };
}

export interface RunProperties {
  font?: string;
  size?: number;
  bold?: boolean;
  color?: string;
  underline?: {
    type?: docx.UnderlineType;
    color?: string;
  };
  italics?: boolean;
  highlight?: string;
}

export interface CustomLevels {
  level: number;
  format: 'decimal' | 'lowerLetter' | 'lowerRoman' | 'upperRoman' | 'upperLetter' | 'bullet';
  text: string;
  alignment: docx.AlignmentType;
  style?: {
    paragraph?: ParagraphProperties;
    run?: RunProperties;
  };
}

export interface StyleProperties {
  paragraph?: ParagraphProperties;
  run?: RunProperties;
}

export interface StyleConfig {
  normal?: StyleProperties;
  header_1?: StyleProperties;
  header_2?: StyleProperties;
  list_paragraph?: StyleProperties;
  code_block?: StyleProperties;
  block_quote?: StyleProperties;
  citation?: StyleProperties;
}

export interface Config {
  paragraphStyles?: StyleConfig;
  customLevels?: CustomLevels[];
  customBulletLevels?: CustomLevels[];
  exportAs?: 'doc' | 'blob' | 'buffer' | 'base64';
}

export interface NumberedList {
  reference: string;
  levels: CustomLevels[];
}

export interface NumberingConfig {
  config: NumberedList[];
}

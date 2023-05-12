import Quill from 'quill';

import {
  cellId,
  rowId,
  TableBody,
  TableCell,
  TableCellLine,
  TableCol,
  TableColGroup,
  TableContainer,
  TableRow,
  TableViewWrapper,
} from './formats/table';
import TableColumnTool from './modules/table-column-tool';
import TableOperationMenu from './modules/table-operation-menu';
import TableSelection from './modules/table-selection';
import { getEventComposedPath } from './utils/index';

const Module = Quill.import('core/module');
const Delta = Quill.import('delta');

class XMLTable extends Module {
  static register() {
    Quill.register(TableCol, true);
    Quill.register(TableColGroup, true);
    Quill.register(TableCellLine, true);
    Quill.register(TableCell, true);
    Quill.register(TableRow, true);
    Quill.register(TableBody, true);
    Quill.register(TableContainer, true);
    Quill.register(TableViewWrapper, true);
  }

  constructor(quill, options) {
    super(quill, options);
    this.quill = quill;
    this.options = options;

    this.quill.root.addEventListener(
      'click',
      (evt) => {
        if (!this.quill.isEnabled()) {
          return;
        }
        // bugfix: evt.path is undefined in Safari, FF, Micro Edge
        const path = getEventComposedPath(evt);

        if (!path || path.length <= 0) return;

        const tableNode = path.filter((node) => {
          return node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('xml-quill-table');
        })[0];

        if (tableNode) {
          // current table clicked
          if (this.table === tableNode) return;
          // other table clicked
          if (this.table) this.hideTableTools();
          this.showTableTools(tableNode, quill, { ...options, evt });
        } else if (this.table) {
          // other clicked
          this.hideTableTools();
        }
      },
      false
    );

    // handle right click on xml-table
    this.quill.root.addEventListener(
      'contextmenu',
      (evt) => {
        if (!this.table) return true;
        evt.preventDefault();

        // bugfix: evt.path is undefined in Safari, FF, Micro Edge
        const path = getEventComposedPath(evt);
        if (!path || path.length <= 0) return true;

        const tableNode = path.filter((node) => {
          return node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('xml-quill-table');
        })[0];

        const rowNode = path.filter((node) => {
          return node.tagName && node.tagName.toUpperCase() === 'TR' && node.getAttribute('data-row');
        })[0];

        const cellNode = path.filter((node) => {
          return node.tagName && node.tagName.toUpperCase() === 'TD' && node.getAttribute('data-row');
        })[0];

        const isTargetCellSelected = this.tableSelection.selectedTds
          .map((tableCell) => tableCell.domNode)
          .includes(cellNode);

        if (this.tableSelection.selectedTds.length <= 0 || !isTargetCellSelected) {
          this.tableSelection.setSelection(cellNode.getBoundingClientRect(), cellNode.getBoundingClientRect());
        }

        if (this.tableOperationMenu) this.tableOperationMenu = this.tableOperationMenu.destroy();

        if (tableNode) {
          this.tableOperationMenu = new TableOperationMenu(
            {
              table: tableNode,
              row: rowNode,
              cell: cellNode,
              left: evt.pageX,
              top: evt.pageY,
            },
            quill,
            options.operationMenu
          );
        }
        return true;
      },
      false
    );

    // since only one matched bindings callback will excute.
    // expected my binding callback excute first
    // I changed the order of binding callbacks
    const thisBinding = quill.keyboard.bindings.Tab.pop();
    quill.keyboard.bindings.Tab.unshift(thisBinding);
  }

  getTable(range = this.quill.getSelection()) {
    if (range == null) return [null, null, null, -1];
    const [cellLine, offset] = this.quill.getLine(range.index);
    if (cellLine == null || cellLine.statics.blotName !== TableCellLine.blotName) {
      return [null, null, null, -1];
    }
    const cell = cellLine.tableCell();
    const row = cell.row();
    const table = row.table();
    return [table, row, cell, offset];
  }

  insertTable(rows, columns) {
    const range = this.quill.getSelection(true);
    if (range == null) return;
    const currentBlot = this.quill.getLeaf(range.index)[0];
    let delta = new Delta().retain(range.index);

    if (isInTableCell(currentBlot)) {
      console.warn(`Can not insert table into a table cell.`);
      return;
    }

    // insert table column
    delta = new Array(columns).fill('\n').reduce((memo, text) => {
      memo.insert(text, { 'xml-table-col': true });
      return memo;
    }, delta);
    // insert table cell line with empty line
    delta = new Array(rows).fill(0).reduce((memo) => {
      const tableRowId = rowId();
      return new Array(columns).fill('\n').reduce((m, text) => {
        m.insert(text, { 'xml-table-cell-line': { row: tableRowId, cell: cellId() } });
        return m;
      }, memo);
    }, delta);

    this.quill.updateContents(delta, Quill.sources.USER);
    setTimeout(() => {
      this.quill.setSelection(range.index - 1, Quill.sources.API);
    });
  }

  showTableTools(table, quill, options) {
    this.table = table;
    this.columnTool = new TableColumnTool(table, quill, options);
    this.tableSelection = new TableSelection(table, quill, options);
  }

  hideTableTools() {
    if (this.columnTool) this.columnTool.destroy();
    if (this.tableSelection) this.tableSelection.destroy();
    if (this.tableOperationMenu) this.tableOperationMenu.destroy();
    this.columnTool = null;
    this.tableSelection = null;
    this.tableOperationMenu = null;
    this.table = null;
  }
}

XMLTable.keyboardBindings = {
  'xml-table-cell-line backspace': {
    key: 'Backspace',
    format: ['xml-table-cell-line'],
    collapsed: true,
    offset: 0,
    handler() {},
  },
  'xml-table-cell-line delete': {
    key: 'Delete',
    format: ['xml-table-cell-line'],
    collapsed: true,
    suffix: /^$/,
    handler() {},
  },
  'xml-table-cell-line enter': {
    key: 'Enter',
    shiftKey: null,
    format: ['xml-table-cell-line'],
    handler(range) {
      const module = this.quill.getModule('xml-table');
      if (module) {
        const [table, row, cell, offset] = module.getTable(range);
        const shift = tableSide(table, row, cell, offset);
        if (shift == null) return;
        let index = table.parent.offset();
        if (shift < 0) {
          const delta = new Delta().retain(index).insert('\n');
          this.quill.updateContents(delta, Quill.sources.USER);
          this.quill.setSelection(range.index + 1, range.length, Quill.sources.SILENT);
          module.hideTableTools();
        } else if (shift > 0) {
          index += table.length();
          const delta = new Delta().retain(index).insert('\n');
          this.quill.updateContents(delta, Quill.sources.USER);
          this.quill.setSelection(index, Quill.sources.USER);
        }
      }
    },
  },
  'xml-table-cell-line tab': {
    key: 'Tab',
    shiftKey: null,
    format: ['xml-table-cell-line'],
    handler(range, context) {
      const { event, line: cell } = context;
      const offset = cell.offset(this.quill.scroll);
      if (event.shiftKey) {
        this.quill.setSelection(offset - 1, Quill.sources.USER);
      } else {
        this.quill.setSelection(offset + cell.length(), Quill.sources.USER);
      }
    },
  },
};

function tableSide(table, row, cell, offset) {
  if (row.prev == null && row.next == null) {
    if (cell.prev == null && cell.next == null) {
      return offset === 0 ? -1 : 1;
    }
    return cell.prev == null ? -1 : 1;
  }
  if (row.prev == null) {
    return -1;
  }
  if (row.next == null) {
    return 1;
  }
  return null;
}

function isTableCell(blot) {
  return blot.statics.blotName === TableCell.blotName;
}

function isInTableCell(current) {
  if (current && current.parent) {
    return isTableCell(current.parent) ? true : isInTableCell(current.parent);
  }
  return false;
}

export default XMLTable;

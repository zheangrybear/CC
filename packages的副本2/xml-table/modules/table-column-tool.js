import Quill from 'quill';

import { css } from '../utils';

const COL_TOOL_HEIGHT = 12;
const COL_TOOL_CELL_HEIGHT = 12;
const CELL_MIN_WIDTH = 50;
const PRIMARY_COLOR = '#35A7ED';

export default class TableColumnTool {
  constructor(table, quill, options) {
    if (!table) return;
    this.table = table;
    this.quill = quill;
    this.options = options;
    this.domNode = null;

    this.initColTool();
  }

  initColTool() {
    const parent = this.quill.root.parentNode;
    const containerRect = parent.getBoundingClientRect();
    const tableViewRect = this.table.parentNode.getBoundingClientRect();
    const tableRect = this.table.getBoundingClientRect();

    this.domNode = document.createElement('div');
    this.domNode.classList.add('xml-ql-col-tool');
    this.updateToolCells();
    parent.appendChild(this.domNode);
    css(this.domNode, {
      width: `${tableViewRect.width}px`,
      height: `${COL_TOOL_HEIGHT}px`,
      left: `${tableViewRect.left - containerRect.left + parent.scrollLeft}px`,
      top: `${tableRect.top - containerRect.top + parent.scrollTop - COL_TOOL_HEIGHT}px`,
    });
  }

  createToolCell() {
    const toolCell = document.createElement('div');
    toolCell.classList.add('xml-ql-col-tool-cell');
    const resizeHolder = document.createElement('div');
    resizeHolder.classList.add('xml-ql-col-tool-cell-holder');
    css(toolCell, {
      height: `${COL_TOOL_CELL_HEIGHT}px`,
    });
    toolCell.appendChild(resizeHolder);
    return toolCell;
  }

  updateToolCells() {
    const tableContainer = Quill.find(this.table);
    const CellsInFirstRow = tableContainer.children.tail.children.head.children;
    const tableCols = tableContainer.colGroup().children;
    const cellsNumber = computeCellsNumber(CellsInFirstRow);
    const existCells = Array.from(this.domNode.querySelectorAll('.xml-ql-col-tool-cell'));

    for (let index = 0; index < Math.max(cellsNumber, existCells.length); index += 1) {
      const col = tableCols.at(index);
      let colWidth = col && +col.formats()[col.statics.blotName].width;
      if (index === 0) colWidth += 1;
      // if cell already exist
      let toolCell = null;
      if (!existCells[index]) {
        toolCell = this.createToolCell();
        this.domNode.appendChild(toolCell);
        this.addColCellHolderHandler(toolCell);
        // set tool cell min-width
        css(toolCell, {
          'min-width': `${colWidth}px`, // left line is table line
        });
      } else if (existCells[index] && index >= cellsNumber) {
        existCells[index].remove();
      } else {
        toolCell = existCells[index];
        // set tool cell min-width
        css(toolCell, {
          'min-width': `${colWidth}px`,
        });
      }
    }
  }

  destroy() {
    this.domNode.remove();
    return null;
  }

  addColCellHolderHandler(cell) {
    const tableContainer = Quill.find(this.table);
    const $holder = cell.querySelector('.xml-ql-col-tool-cell-holder');
    let dragging = false;
    let x0 = 0;
    let x = 0;
    let delta = 0;
    let width0 = 0;
    // helpLine relation varrible
    let tableRect = {};
    let cellRect = {};
    let $helpLine = null;

    const handleDrag = (e) => {
      e.preventDefault();

      if (dragging) {
        x = e.clientX;

        if (width0 + x - x0 >= CELL_MIN_WIDTH) {
          delta = x - x0;
        } else {
          delta = CELL_MIN_WIDTH - width0;
        }

        css($helpLine, {
          left: `${cellRect.left + cellRect.width - 1 + delta}px`,
        });
      }
    };

    const handleMouseup = (e) => {
      e.preventDefault();
      const existCells = Array.from(this.domNode.querySelectorAll('.xml-ql-col-tool-cell'));
      const colIndex = existCells.indexOf(cell);
      const colBlot = tableContainer.colGroup().children.at(colIndex);

      if (dragging) {
        colBlot.format('width', width0 + delta);
        css(cell, { 'min-width': `${colIndex === 0 ? width0 + delta + 1 : width0 + delta}px` });

        x0 = 0;
        x = 0;
        delta = 0;
        width0 = 0;
        dragging = false;
        $holder.classList.remove('dragging');
      }

      document.removeEventListener('mousemove', handleDrag, false);
      document.removeEventListener('mouseup', handleMouseup, false);
      tableRect = {};
      cellRect = {};
      $helpLine.remove();
      $helpLine = null;
      tableContainer.updateTableWidth();

      const { tableSelection } = this.quill.getModule('xml-table');
      if (tableSelection) {
        tableSelection.clearSelection();
      }
    };

    const handleMousedown = (e) => {
      document.addEventListener('mousemove', handleDrag, false);
      document.addEventListener('mouseup', handleMouseup, false);

      tableRect = this.table.getBoundingClientRect();
      cellRect = cell.getBoundingClientRect();
      $helpLine = document.createElement('div');
      css($helpLine, {
        position: 'fixed',
        top: `${cellRect.top}px`,
        left: `${cellRect.left + cellRect.width - 1}px`,
        zIndex: '100',
        height: `${tableRect.height + COL_TOOL_HEIGHT}px`,
        width: '2px',
        backgroundColor: PRIMARY_COLOR,
      });

      document.body.appendChild($helpLine);
      dragging = true;
      x0 = e.clientX;
      width0 = cellRect.width;
      $holder.classList.add('dragging');
    };
    $holder.addEventListener('mousedown', handleMousedown, false);
  }

  colToolCells() {
    return Array.from(this.domNode.querySelectorAll('.xml-ql-col-tool-cell'));
  }
}

function computeCellsNumber(CellsInFirstRow) {
  return CellsInFirstRow.reduce((sum, cell) => {
    let s = sum;
    const cellColspan = cell.formats().colspan;
    s += parseInt(cellColspan, 10);
    return s;
  }, 0);
}

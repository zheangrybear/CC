import _ from 'lodash';
import Quill from 'quill';

// svg icons
import operationIcon1 from '../assets/icons/icon_operation_1.svg';
import operationIcon2 from '../assets/icons/icon_operation_2.svg';
import operationIcon3 from '../assets/icons/icon_operation_3.svg';
import operationIcon4 from '../assets/icons/icon_operation_4.svg';
import operationIcon5 from '../assets/icons/icon_operation_5.svg';
import operationIcon6 from '../assets/icons/icon_operation_6.svg';
import operationIcon7 from '../assets/icons/icon_operation_7.svg';
import operationIcon8 from '../assets/icons/icon_operation_8.svg';
import operationIcon9 from '../assets/icons/icon_operation_9.svg';
import { css, getRelativeRect } from '../utils';

const MENU_MIN_HEIHGT = 150;
const MENU_WIDTH = 200;
const ERROR_LIMIT = 5;
const DEFAULT_CELL_COLORS = ['white', 'red', 'yellow', 'blue'];
const DEFAULT_COLOR_SUBTITLE = 'Background Colors';

const MENU_ITEM_MERGES = {
  mergeCells: {
    text: '合并单元格',
    iconSrc: operationIcon5,
    handler() {
      const tableContainer = Quill.find(this.table);
      // compute merged Cell rowspan, equal to length of selected rows
      const rowspan = tableContainer.rows().reduce((sum, row) => {
        let s = sum;
        const rowRect = getRelativeRect(row.domNode.getBoundingClientRect(), this.quill.root.parentNode);
        if (
          rowRect.y > this.boundary.y - ERROR_LIMIT &&
          rowRect.y + rowRect.height < this.boundary.y + this.boundary.height + ERROR_LIMIT
        ) {
          s += 1;
        }
        return s;
      }, 0);

      // compute merged cell colspan, equal to length of selected cols
      const colspan = this.columnToolCells.reduce((sum, cell) => {
        let s = sum;
        const cellRect = getRelativeRect(cell.getBoundingClientRect(), this.quill.root.parentNode);
        if (
          cellRect.x > this.boundary.x - ERROR_LIMIT &&
          cellRect.x + cellRect.width < this.boundary.x + this.boundary.width + ERROR_LIMIT
        ) {
          s += 1;
        }
        return s;
      }, 0);

      const mergedCell = tableContainer.mergeCells(
        this.boundary,
        this.selectedTds,
        rowspan,
        colspan,
        this.quill.root.parentNode
      );
      this.quill.update(Quill.sources.USER);
      this.tableSelection.setSelection(
        mergedCell.domNode.getBoundingClientRect(),
        mergedCell.domNode.getBoundingClientRect()
      );
    },
  },
};

const MENU_ITEM_UNMERGES = {
  unmergeCells: {
    text: '拆分单元格',
    iconSrc: operationIcon6,
    handler() {
      const tableContainer = Quill.find(this.table);
      tableContainer.unmergeCells(this.selectedTds, this.quill.root.parentNode);
      this.quill.update(Quill.sources.USER);
      this.tableSelection.clearSelection();
    },
  },
};

const MENU_ITEMS_DEFAULT = {
  insertColumnRight: {
    text: '右插入一列',
    iconSrc: operationIcon1,
    handler() {
      const tableContainer = Quill.find(this.table);
      const colIndex = getColToolCellIndexByBoundary(
        this.columnToolCells,
        this.boundary,
        (cellRect, boundary) => {
          return Math.abs(cellRect.x + cellRect.width - boundary.x1) <= ERROR_LIMIT;
        },
        this.quill.root.parentNode
      );

      const newColumn = tableContainer.insertColumn(this.boundary, colIndex, true, this.quill.root.parentNode);

      this.tableColumnTool.updateToolCells();
      this.quill.update(Quill.sources.USER);
      this.quill.setSelection(this.quill.getIndex(newColumn[0]), 0, Quill.sources.SILENT);
      this.tableSelection.setSelection(
        newColumn[0].domNode.getBoundingClientRect(),
        newColumn[0].domNode.getBoundingClientRect()
      );
    },
  },

  insertColumnLeft: {
    text: '左插入一列',
    iconSrc: operationIcon2,
    handler() {
      const tableContainer = Quill.find(this.table);
      const colIndex = getColToolCellIndexByBoundary(
        this.columnToolCells,
        this.boundary,
        (cellRect, boundary) => {
          return Math.abs(cellRect.x - boundary.x) <= ERROR_LIMIT;
        },
        this.quill.root.parentNode
      );

      const newColumn = tableContainer.insertColumn(this.boundary, colIndex, false, this.quill.root.parentNode);

      this.tableColumnTool.updateToolCells();
      this.quill.update(Quill.sources.USER);
      this.quill.setSelection(this.quill.getIndex(newColumn[0]), 0, Quill.sources.SILENT);
      this.tableSelection.setSelection(
        newColumn[0].domNode.getBoundingClientRect(),
        newColumn[0].domNode.getBoundingClientRect()
      );
    },
  },

  insertRowAbove: {
    text: '上插入一行',
    iconSrc: operationIcon3,
    handler() {
      const tableContainer = Quill.find(this.table);
      const affectedCells = tableContainer.insertRow(this.boundary, false, this.quill.root.parentNode);
      this.quill.update(Quill.sources.USER);
      this.quill.setSelection(this.quill.getIndex(affectedCells[0]), 0, Quill.sources.SILENT);
      this.tableSelection.setSelection(
        affectedCells[0].domNode.getBoundingClientRect(),
        affectedCells[0].domNode.getBoundingClientRect()
      );
    },
  },

  insertRowBelow: {
    text: '下插入一行',
    iconSrc: operationIcon4,
    handler() {
      const tableContainer = Quill.find(this.table);
      const affectedCells = tableContainer.insertRow(this.boundary, true, this.quill.root.parentNode);
      this.quill.update(Quill.sources.USER);
      this.quill.setSelection(this.quill.getIndex(affectedCells[0]), 0, Quill.sources.SILENT);
      this.tableSelection.setSelection(
        affectedCells[0].domNode.getBoundingClientRect(),
        affectedCells[0].domNode.getBoundingClientRect()
      );
    },
  },

  deleteColumn: {
    text: '删除一列',
    iconSrc: operationIcon7,
    handler() {
      const tableContainer = Quill.find(this.table);
      const colIndexes = getColToolCellIndexesByBoundary(
        this.columnToolCells,
        this.boundary,
        (cellRect, boundary) => {
          return cellRect.x + ERROR_LIMIT > boundary.x && cellRect.x + cellRect.width - ERROR_LIMIT < boundary.x1;
        },
        this.quill.root.parentNode
      );

      const isDeleteTable = tableContainer.deleteColumns(this.boundary, colIndexes, this.quill.root.parentNode);
      if (!isDeleteTable) {
        this.tableColumnTool.updateToolCells();
        this.quill.update(Quill.sources.USER);
        this.tableSelection.clearSelection();
      }
    },
  },

  deleteRow: {
    text: '删除一行',
    iconSrc: operationIcon8,
    handler() {
      const tableContainer = Quill.find(this.table);
      tableContainer.deleteRow(this.boundary, this.quill.root.parentNode);
      this.quill.update(Quill.sources.USER);
      this.tableSelection.clearSelection();
    },
  },

  deleteTable: {
    text: '删除表格',
    iconSrc: operationIcon9,
    handler() {
      const tableModule = this.quill.getModule('xml-table');
      const tableContainer = Quill.find(this.table);
      tableModule.hideTableTools();
      tableContainer.remove();
      this.quill.update(Quill.sources.USER);
    },
  },
};

export default class TableOperationMenu {
  constructor(params, quill, options) {
    const tableModule = quill.getModule('xml-table');
    this.tableSelection = tableModule.tableSelection;
    this.table = params.table;
    this.quill = quill;
    this.options = options;
    this.tableColumnTool = tableModule.columnTool;
    this.boundary = this.tableSelection.boundary;
    this.selectedTds = this.tableSelection.selectedTds;
    this.menuItems = {
      ...(this.selectedTds.length > 1 ? MENU_ITEM_MERGES : {}),
      ...(this.supportUnmerge() ? MENU_ITEM_UNMERGES : {}),
      ...MENU_ITEMS_DEFAULT,
      ...options?.items,
    };
    this.destroyHandler = this.destroy.bind(this);
    this.columnToolCells = this.tableColumnTool.colToolCells();
    this.colorSubTitle = options?.color && options.color.text ? options.color.text : DEFAULT_COLOR_SUBTITLE;
    this.cellColors = options?.color && options.color.colors ? options.color.colors : DEFAULT_CELL_COLORS;

    this.menuInitial(params);
    this.mount();
    document.addEventListener('click', this.destroyHandler, false);
  }

  supportUnmerge() {
    let unmerge = false;
    Array.from(this.selectedTds).some((tableCell) => {
      const cellFormats = tableCell.formats();
      const cellRowspan = cellFormats.rowspan;
      const cellColspan = cellFormats.colspan;
      unmerge = cellRowspan > 1 || cellColspan > 1;
      return unmerge;
    });
    return unmerge;
  }

  mount() {
    document.body.appendChild(this.domNode);
  }

  destroy() {
    this.domNode.remove();
    document.removeEventListener('click', this.destroyHandler, false);
    return null;
  }

  menuInitial({ left, top }) {
    this.domNode = document.createElement('div');
    this.domNode.classList.add('xml-table-operation-menu');

    let domTop = top;
    const availableSpaceBottom = document.documentElement.clientHeight;
    if (availableSpaceBottom - top <= 42 * _.keys(this.menuItems).length) {
      domTop -= 42 * _.keys(this.menuItems).length;
    }

    css(this.domNode, {
      position: 'fixed',
      left: `${left}px`,
      top: `${domTop}px`,
      'min-height': `${MENU_MIN_HEIHGT}px`,
      width: `${MENU_WIDTH}px`,
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const name in this.menuItems) {
      if (this.menuItems[name]) {
        this.domNode.appendChild(this.menuItemCreator({ ...MENU_ITEMS_DEFAULT[name], ...this.menuItems[name] }));
      }
    }

    // if colors option is false, disabled bg color
    if (this.options?.color && this.options.color !== false) {
      this.domNode.appendChild(dividingCreator());
      this.domNode.appendChild(subTitleCreator(this.colorSubTitle));
      this.domNode.appendChild(this.colorsItemCreator(this.cellColors));
    }

    // create dividing line
    function dividingCreator() {
      const dividing = document.createElement('div');
      dividing.classList.add('xml-table-operation-menu-dividing');
      return dividing;
    }

    // create subtitle for menu
    function subTitleCreator(title) {
      const subTitle = document.createElement('div');
      subTitle.classList.add('xml-table-operation-menu-subtitle');
      subTitle.innerText = title;
      return subTitle;
    }
  }

  colorsItemCreator(colors) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const node = document.createElement('div');
    node.classList.add('xml-table-operation-color-picker');

    colors.forEach((color) => {
      const colorBox = colorBoxCreator(color);
      node.appendChild(colorBox);
    });

    function colorBoxCreator(color) {
      const box = document.createElement('div');
      box.classList.add('xml-table-operation-color-picker-item');
      box.setAttribute('data-color', color);
      box.style.backgroundColor = color;

      box.addEventListener(
        'click',
        () => {
          const { selectedTds } = self.tableSelection;
          if (selectedTds && selectedTds.length > 0) {
            selectedTds.forEach((tableCell) => {
              tableCell.format('cell-bg', color);
            });
          }
        },
        false
      );

      return box;
    }

    return node;
  }

  menuItemCreator({ text, iconSrc, handler }) {
    const node = document.createElement('div');
    node.classList.add('xml-table-operation-menu-item');

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('xml-table-operation-menu-icon');
    iconSpan.innerHTML = `<img src='${iconSrc.src}' alt='next' />`;

    const textSpan = document.createElement('span');
    textSpan.classList.add('xml-table-operation-menu-text');
    textSpan.innerText = text;

    node.appendChild(iconSpan);
    node.appendChild(textSpan);
    node.addEventListener('click', handler.bind(this), false);
    return node;
  }
}

function getColToolCellIndexByBoundary(cells, boundary, conditionFn, container) {
  return cells.reduce((findIndex, cell) => {
    let index = findIndex;
    const cellRect = getRelativeRect(cell.getBoundingClientRect(), container);
    if (conditionFn(cellRect, boundary)) {
      index = cells.indexOf(cell);
    }
    return index;
  }, false);
}

function getColToolCellIndexesByBoundary(cells, boundary, conditionFn, container) {
  return cells.reduce((findIndexes, cell) => {
    const cellRect = getRelativeRect(cell.getBoundingClientRect(), container);
    if (conditionFn(cellRect, boundary)) {
      findIndexes.push(cells.indexOf(cell));
    }
    return findIndexes;
  }, []);
}

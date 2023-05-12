// @ts-nocheck
/**
 * Object used to hold the data that is being dragged during drag and drop operations.
 *
 * It may hold one or more data items of different types. For more information about
 * drag and drop operations and data transfer objects, see
 * <a href="https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer">HTML Drag and Drop API</a>.
 *
 * This object is created automatically by the @see:DragDropTouch singleton and is
 * accessible through the @see:dataTransfer property of all drag events.
 */
class DataTransfer {
  _dropEffect: string;
  _effectAllowed: string;
  _data: any;

  constructor() {
    this._dropEffect = 'move';
    this._effectAllowed = 'all';
    this._data = {};
  }

  /**
   * Gets or sets the type of drag-and-drop operation currently selected.
   * The value must be 'none',  'copy',  'link', or 'move'.
   */
  get dropEffect() {
    return this._dropEffect;
  }

  set dropEffect(value) {
    this._dropEffect = value;
  }

  /**
   * Gets or sets the types of operations that are possible.
   * Must be one of 'none', 'copy', 'copyLink', 'copyMove', 'link',
   * 'linkMove', 'move', 'all' or 'uninitialized'.
   */
  get effectAllowed() {
    return this._effectAllowed;
  }

  set effectAllowed(value) {
    this._effectAllowed = value;
  }

  /**
   * Gets an array of strings giving the formats that were set in the @see:dragstart event.
   */
  get types() {
    return Object.keys(this._data);
  }

  /**
   * Removes the data associated with a given type.
   *
   * The type argument is optional. If the type is empty or not specified, the data
   * associated with all types is removed. If data for the specified type does not exist,
   * or the data transfer contains no data, this method will have no effect.
   *
   * @param type Type of data to remove.
   */
  clearData(type) {
    if (type != null) {
      delete this._data[type.toLowerCase()];
    } else {
      this._data = {};
    }
  }

  /**
   * Retrieves the data for a given type, or an empty string if data for that type does
   * not exist or the data transfer contains no data.
   *
   * @param type Type of data to retrieve.
   */
  getData(type) {
    return this._data[type.toLowerCase()] || '';
  }

  /**
   * Set the data for a given type.
   *
   * For a list of recommended drag types, please see
   * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Recommended_Drag_Types.
   *
   * @param type Type of data to add.
   * @param value Data to add.
   */
  setData(type, value) {
    this._data[type.toLowerCase()] = value;
  }

  /**
   * Set the image to be used for dragging if a custom one is desired.
   *
   * @param img An image element to use as the drag feedback image.
   * @param offsetX The horizontal offset within the image.
   * @param offsetY The vertical offset within the image.
   */
  setDragImage(img, offsetX, offsetY) {
    // var ddt = DragDropTouch._instance;
    // ddt._imgCustom = img;
    // ddt._imgOffset = { x: offsetX, y: offsetY };
  }
}

/**
 * Defines a class that adds support for touch-based HTML5 drag/drop operations.
 *
 * The @see:DragDropTouch class listens to touch events and raises the
 * appropriate HTML5 drag/drop events as if the events had been caused
 * by mouse actions.
 *
 * The purpose of this class is to enable using existing, standard HTML5
 * drag/drop code on mobile devices running IOS or Android.
 *
 * To use, include the DragDropTouch.js file on the page. The class will
 * automatically start monitoring touch events and will raise the HTML5
 * drag drop events (dragstart, dragenter, dragleave, drop, dragend) which
 * should be handled by the application.
 *
 * For details and examples on HTML drag and drop, see
 * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations.
 */
class DragDropTouch {
  static _THRESHOLD = 5; // pixels to move before drag starts
  static _OPACITY = 0.5; // drag image opacity
  static _DBLCLICK = 500; // max ms between clicks in a double click
  static _CTXMENU = 750; // ms to hold before raising 'contextmenu' event
  static _ISPRESSHOLDMODE = false; // decides of press & hold mode presence
  static _PRESSHOLDAWAIT = 400; // ms to wait before press & hold is detected
  static _PRESSHOLDMARGIN = 25; // pixels that finger might shiver while pressing
  static _PRESSHOLDTHRESHOLD = 0; // pixels to move before drag starts
  // copy styles/attributes from drag source to drag image element
  static _rmvAtts = 'id,class,style,draggable'.split(',');
  // synthesize and dispatch an event
  // returns true if the event has been handled (e.preventDefault == true)
  static _kbdProps = 'altKey,ctrlKey,metaKey,shiftKey'.split(',');
  static _ptProps =
    'pageX,pageY,clientX,clientY,screenX,screenY,offsetX,offsetY'.split(',');

  _container: HTMLElement;
  _lastClick: number;
  _longTapTimeout: any;
  _preV: { x: number; y: number };
  _pinchStartLen: number;
  _dragSource: HTMLElement;
  _ptDown: { x: number; y: number };
  _lastTouch: any;
  _lastTarget: any;
  _img: any;
  _isDropZone: boolean;
  _isDragEnabled: boolean;
  _dataTransfer: DataTransfer;
  _imgCustom: any;
  _pressHoldInterval: any;
  _imgOffset: any;

  constructor(container) {
    this._container = container;
    this._lastClick = 0;
    this._longTapTimeout;
    this._preV = { x: null, y: null };
    this._pinchStartLen = null;
    // detect passive event support
    // https://github.com/Modernizr/Modernizr/issues/1894
    let supportsPassive = false;
    container.addEventListener('test', () => {}, {
      get passive() {
        supportsPassive = true;
        return true;
      },
    });
    // listen to touch events
    if (navigator.maxTouchPoints) {
      const d = container;
      const ts = this._touchstart.bind(this);
      const tm = this._touchmove.bind(this);
      const te = this._touchend.bind(this);
      const opt = supportsPassive ? { passive: false, capture: false } : false;
      d.addEventListener('touchstart', ts, opt);
      d.addEventListener('touchmove', tm, opt);
      d.addEventListener('touchend', te);
      d.addEventListener('touchcancel', te);
    }
  }

  _cancelLongTap() {
    clearTimeout(this._longTapTimeout);
  }

  getLen(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  // ** event handlers
  _touchstart(e) {
    const _this = this;
    if (this._shouldHandle(e)) {
      // raise double-click and prevent zooming
      // if (Date.now() - this._lastClick < DragDropTouch._DBLCLICK) {
      //     if (this._dispatchEvent(e, 'dblclick', e.target)) {
      //         e.preventDefault();
      //         this._reset();
      //         return;
      //     }
      // }
      // clear all variables
      this._reset();
      // detect pinch
      const len = e.touches.length;
      if (len > 1) {
        this._cancelLongTap();
        const v = {
          x: e.touches[1].pageX - e.touches[0].pageX,
          y: e.touches[1].pageY - e.touches[0].pageY,
        };
        this._preV.x = v.x;
        this._preV.y = v.y;
        this._pinchStartLen = this.getLen(this._preV);
        this._container.dispatchEvent(new Event('multiTouchStart'));
        return;
      }
      // get nearest draggable element
      const src = this._closestDraggable(e.target);
      if (src) {
        // give caller a chance to handle the hover/move events
        if (
          !this._dispatchEvent(e, 'mousemove', e.target) &&
          !this._dispatchEvent(e, 'mousedown', e.target)
        ) {
          // get ready to start dragging
          this._dragSource = src;
          this._ptDown = this._getPoint(e);
          this._lastTouch = e;
          // e.preventDefault();
          // show context menu if the user hasn't started dragging after a while
          this._longTapTimeout = setTimeout(() => {
            if (_this._dragSource == src && _this._img == null) {
              if (_this._dispatchEvent(e, 'contextmenu', src)) {
                _this._reset();
              }
            }
          }, DragDropTouch._CTXMENU);
          // if (DragDropTouch._ISPRESSHOLDMODE) {
          //     this._pressHoldInterval = setTimeout(function () {
          //         console.info('dragEnabled')
          //         _this._isDragEnabled = true;
          //         _this._touchmove(e);
          //     }, DragDropTouch._PRESSHOLDAWAIT);
          // }
        }
      }
    }
  }

  _touchmove(e) {
    if (this._shouldCancelPressHoldMove(e)) {
      this._reset();
      return;
    }
    this._cancelLongTap();
    if (e.touches.length > 1) {
      const v = {
        x: e.touches[1].pageX - e.touches[0].pageX,
        y: e.touches[1].pageY - e.touches[0].pageY,
      };
      if (this._preV.x !== null) {
        if (this._pinchStartLen > 0) {
          const newEvent = new CustomEvent<any>('pinch', {
            detail: { zoom: this.getLen(v) / this._pinchStartLen },
          });
          this._container.dispatchEvent(newEvent);
        }
      }
      this._preV.x = v.x;
      this._preV.y = v.y;
      e.preventDefault();
      return;
    }
    if (this._shouldHandleMove(e) || this._shouldHandlePressHoldMove(e)) {
      // see if target wants to handle move
      const target = this._getTarget(e);
      if (this._dispatchEvent(e, 'mousemove', target)) {
        this._lastTouch = e;
        e.preventDefault();
        return;
      }
      // start dragging
      if (this._dragSource && !this._img && this._shouldStartDragging(e)) {
        this._dispatchEvent(e, 'dragstart', this._dragSource);
        this._createImage(e);
        this._dispatchEvent(e, 'dragenter', target);
      }
      // continue dragging
      if (this._img) {
        this._lastTouch = e;
        e.preventDefault(); // prevent scrolling
        this._dispatchEvent(e, 'drag', this._dragSource);
        if (target != this._lastTarget) {
          this._dispatchEvent(this._lastTouch, 'dragleave', this._lastTarget);
          this._dispatchEvent(e, 'dragenter', target);
          this._lastTarget = target;
        }
        this._moveImage(e);
        this._isDropZone = this._dispatchEvent(e, 'dragover', target);
      }
    }
  }

  _touchend(e) {
    this._cancelLongTap();
    if (this._shouldHandle(e)) {
      // see if target wants to handle up
      if (this._dispatchEvent(this._lastTouch, 'mouseup', e.target)) {
        e.preventDefault();
        return;
      }
      // user clicked the element but didn't drag, so clear the source and simulate a click
      if (!this._img) {
        this._dragSource = null;
        this._dispatchEvent(this._lastTouch, 'click', e.target);
        this._lastClick = Date.now();
      }
      // finish dragging
      this._destroyImage();
      if (this._dragSource) {
        if (e.type.indexOf('cancel') < 0 && this._isDropZone) {
          this._dispatchEvent(this._lastTouch, 'drop', this._lastTarget);
        }
        this._dispatchEvent(this._lastTouch, 'dragend', this._dragSource);
        this._reset();
      }
    }
  }
  // ** utilities
  // ignore events that have been handled or that involve more than one touch
  _shouldHandle(e) {
    return e && !e.defaultPrevented && e.touches;
  }

  // use regular condition outside of press & hold mode
  _shouldHandleMove(e) {
    return !DragDropTouch._ISPRESSHOLDMODE && this._shouldHandle(e);
  }

  // allow to handle moves that involve many touches for press & hold
  _shouldHandlePressHoldMove(e) {
    return (
      DragDropTouch._ISPRESSHOLDMODE &&
      this._isDragEnabled &&
      e &&
      e.touches &&
      e.touches.length
    );
  }

  // reset data if user drags without pressing & holding
  _shouldCancelPressHoldMove(e) {
    return (
      DragDropTouch._ISPRESSHOLDMODE &&
      !this._isDragEnabled &&
      this._getDelta(e) > DragDropTouch._PRESSHOLDMARGIN
    );
  }

  // start dragging when specified delta is detected
  _shouldStartDragging(e) {
    const delta = this._getDelta(e);
    return (
      delta > DragDropTouch._THRESHOLD ||
      (DragDropTouch._ISPRESSHOLDMODE &&
        delta >= DragDropTouch._PRESSHOLDTHRESHOLD)
    );
  }

  // clear all members
  _reset() {
    this._destroyImage();
    this._dragSource = null;
    this._lastTouch = null;
    this._lastTarget = null;
    this._ptDown = null;
    this._isDragEnabled = false;
    this._isDropZone = false;
    this._dataTransfer = new DataTransfer();
    clearInterval(this._pressHoldInterval);
    clearTimeout(this._longTapTimeout);
  }
  // get point for a touch event
  _getPoint(e, page = undefined) {
    if (e && e.touches) {
      e = e.touches[0];
    }
    return { x: page ? e.pageX : e.clientX, y: page ? e.pageY : e.clientY };
  }
  // get distance between the current touch event and the first one
  _getDelta(e) {
    if (DragDropTouch._ISPRESSHOLDMODE && !this._ptDown) {
      return 0;
    }
    const p = this._getPoint(e);
    return Math.abs(p.x - this._ptDown.x) + Math.abs(p.y - this._ptDown.y);
  }
  // get the element at a given touch event
  _getTarget(e) {
    const pt = this._getPoint(e);
    let el = document.elementFromPoint(pt.x, pt.y);
    while (el && getComputedStyle(el).pointerEvents == 'none') {
      el = el.parentElement;
    }
    return el;
  }
  // create drag image from source element
  _createImage(e) {
    // just in case...
    if (this._img) {
      this._destroyImage();
    }
    // create drag image from custom element or drag source
    const src = this._imgCustom || this._dragSource;
    this._img = src.cloneNode(true);
    this._copyStyle(src, this._img);
    this._img.style.top = this._img.style.left = '-9999px';
    // if creating from drag source, apply offset and opacity
    if (!this._imgCustom) {
      const rc = src.getBoundingClientRect();
      const pt = this._getPoint(e);
      this._imgOffset = { x: pt.x - rc.left, y: pt.y - rc.top };
      this._img.style.opacity = DragDropTouch._OPACITY.toString();
    }
    // add image to document
    this._moveImage(e);
    document.body.appendChild(this._img);
  }
  // dispose of drag image element
  _destroyImage() {
    if (this._img && this._img.parentElement) {
      this._img.parentElement.removeChild(this._img);
    }
    this._img = null;
    this._imgCustom = null;
  }
  // move the drag image element
  _moveImage(e) {
    const _this = this;
    requestAnimationFrame(() => {
      if (_this._img) {
        const pt = _this._getPoint(e, true);
        const s = _this._img.style;
        s.position = 'absolute';
        s.pointerEvents = 'none';
        s.zIndex = '999999';
        s.left = `${Math.round(pt.x - _this._imgOffset.x)}px`;
        s.top = `${Math.round(pt.y - _this._imgOffset.y)}px`;
      }
    });
  }
  // copy properties from an object to another
  _copyProps(dst, src, props) {
    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      dst[p] = src[p];
    }
  }
  _copyStyle(src, dst) {
    // remove potentially troublesome attributes
    DragDropTouch._rmvAtts.forEach((att) => {
      dst.removeAttribute(att);
    });
    // copy canvas content
    if (src instanceof HTMLCanvasElement) {
      const cSrc = src;
      const cDst = dst;
      cDst.width = cSrc.width;
      cDst.height = cSrc.height;
      cDst.getContext('2d').drawImage(cSrc, 0, 0);
    }
    // copy style (without transitions)
    const cs = getComputedStyle(src);
    for (var i = 0; i < cs.length; i++) {
      const key = cs[i];
      if (key.indexOf('transition') < 0) {
        dst.style[key] = cs[key];
      }
    }
    dst.style.pointerEvents = 'none';
    // and repeat for all children
    for (var i = 0; i < src.children.length; i++) {
      this._copyStyle(src.children[i], dst.children[i]);
    }
  }
  _dispatchEvent(e, type, target) {
    if (e && target) {
      const evt = document.createEvent('Event');
      const t = e.touches ? e.touches[0] : e;
      evt.initEvent(type, true, true);
      // evt.button = 0;
      // evt.which = evt.buttons = 1;
      this._copyProps(evt, e, DragDropTouch._kbdProps);
      this._copyProps(evt, t, DragDropTouch._ptProps);
      // evt.dataTransfer = this._dataTransfer;
      target.dispatchEvent(evt);
      return evt.defaultPrevented;
    }
    return false;
  }
  // gets an element's closest draggable ancestor
  _closestDraggable(e) {
    for (; e; e = e.parentElement) {
      if (e.hasAttribute('draggable') && e.draggable) {
        return e;
      }
    }
    return null;
  }
}

export function initDragDropTouch(container) {
  new DragDropTouch(container);
}

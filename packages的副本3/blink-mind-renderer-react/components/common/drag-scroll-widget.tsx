// @ts-nocheck
import debug from 'debug';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import styled from 'styled-components';

const log = debug('node:drag-scroll-widget');

const DragScrollView = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: scroll;
`;

const DragScrollContent = styled.div`
  position: relative;
  width: max-content;
`;

const useWindowListener = false;

interface DragScrollWidgetProps {
  mouseKey?: 'left' | 'right';
  needKeyPressed?: boolean;
  canDragFunc?: () => Boolean;
  enableMouseWheel: boolean;
  zoomFactor: number;
  children: (
    setViewBoxScroll: (left: number, top: number) => void,
    setViewBoxScrollDelta: (left: number, top: number) => void
  ) => React.ReactNode;
}

export class DragScrollWidget extends React.Component<
  DragScrollWidgetProps,
  any
> {
  constructor(props: DragScrollWidgetProps) {
    super(props);
  }

  static defaultProps = {
    mouseKey: 'left',
    needKeyPressed: false,
  };

  contentResizeCallback = (
    entries: ResizeObserverEntry[],
    observer: ResizeObserver
  ) => {
    if (this.oldContentRect) {
      const widgetStyle = {
        width: this.content.clientWidth + this.viewBox.clientWidth * 2,
        height: this.content.clientHeight + this.viewBox.clientHeight * 2,
      };
      this.bigView.style.width = `${widgetStyle.width}px`;
      this.bigView.style.height = `${widgetStyle.height}px`;
    }
    this.oldContentRect = entries[0].contentRect;
  };

  contentResizeObserver = new ResizeObserver(this.contentResizeCallback);
  // oldScroll: { left: number; top: number };
  oldContentRect: any;
  content: HTMLElement;
  contentRef = (ref) => {
    if (ref) {
      this.content = ref;
      this.contentResizeObserver.observe(this.content);
    }
  };

  viewBox: HTMLElement;
  viewBoxRef = (ref) => {
    if (ref) {
      this.viewBox = ref;
      if (!this.props.enableMouseWheel) {
        log('addEventListener onwheel');
        this.viewBox.addEventListener(
          'wheel',
          (e) => {
            log('onwheel');
            (e.ctrlKey || e.altKey) && e.preventDefault();
          },
          {
            passive: false,
          }
        );
      }
      this.setViewBoxScroll(
        this.viewBox.clientWidth,
        this.viewBox.clientHeight
      );
    }
  };

  bigView: HTMLElement;
  bigViewRef = (ref) => {
    if (ref) {
      this.bigView = ref;
    }
  };

  setWidgetStyle = () => {
    if (this.content && this.viewBox && this.bigView) {
      this.bigView.style.width = `${
        (this.content.clientWidth + this.viewBox.clientWidth) * 2
      }px`;
      this.bigView.style.height = `${
        (this.content.clientHeight + this.viewBox.clientHeight) * 2
      }px`;
      this.content.style.left = this.viewBox.clientWidth + 'px';
      this.content.style.top = this.viewBox.clientHeight + 'px';
    }
  };

  setViewBoxScroll = (left: number, top: number) => {
    log(`setViewBoxScroll ${left} ${top}`);
    if (this.viewBox) {
      this.viewBox.scrollLeft = left;
      this.viewBox.scrollTop = top;
    }
  };

  setViewBoxScrollDelta = (deltaLeft: number, deltaTop: number) => {
    log(`setViewBoxScrollDelta ${deltaLeft} ${deltaTop}`);
    if (this.viewBox) {
      this.viewBox.scrollLeft += deltaLeft;
      this.viewBox.scrollTop += deltaTop;
    }
  };

  onMouseDown = (e) => {
    // log('Drag Scroll onMouseDown');
    // log(e.nativeEvent.target);

    // mouseKey 表示鼠标按下那个键才可以进行拖动，左键或者右键
    // needKeyPressed 为了支持是否需要按下ctrl键，才可以进行拖动
    // canDragFunc是一个函数，它是为了支持使用者以传入函数的方式，这个函数的返回值表示当前的内容是否可以被拖拽而移动
    const { mouseKey, needKeyPressed, canDragFunc } = this.props;
    if (canDragFunc && !canDragFunc()) return;
    if (
      (e.button === 0 && mouseKey === 'left') ||
      (e.button === 2 && mouseKey === 'right')
    ) {
      if (needKeyPressed) {
        if (!e.ctrlKey) return;
      }
      this._lastCoordX = this.viewBox.scrollLeft + e.nativeEvent.clientX;
      this._lastCoordY = this.viewBox.scrollTop + e.nativeEvent.clientY;

      const ele = useWindowListener ? window : this.viewBox;
      ele.addEventListener('mousemove', this.onMouseMove);
      ele.addEventListener('mouseup', this.onMouseUp);
    }
  };

  onMouseUp = (e) => {
    const ele = useWindowListener ? window : this.viewBox;
    ele.removeEventListener('mousemove', this.onMouseMove);
    ele.removeEventListener('mouseup', this.onMouseUp);
  };

  // _lastCoordX和_lastCorrdY 是为了在拖动过程中 计算 viewBox的scrollLeft和scrollTop值用到
  // _lastCoordX和_lastCorrdY 记录下拖动开始时刻viewBox的scroll值和鼠标位置值
  _lastCoordX: number;
  _lastCoordY: number;

  onMouseMove = (e: MouseEvent) => {
    this.viewBox.scrollLeft = this._lastCoordX - e.clientX;
    this.viewBox.scrollTop = this._lastCoordY - e.clientY;
    // log(`onMouseMove ${this.viewBox.scrollLeft} ${this.viewBox.scrollTop}`);
  };

  handleContextMenu = (e) => {
    e.preventDefault();
  };

  componentDidMount(): void {
    this.setWidgetStyle();
    document.addEventListener('contextmenu', this.handleContextMenu);
  }

  componentWillUnmount(): void {
    document.removeEventListener('contextmenu', this.handleContextMenu);
  }

  setZoomFactor(zoomFactor) {
    const oldTransform = this.bigView.style.transform || 'scale(1)'
    const oldZoom = parseFloat(oldTransform.replace('scale(', ''))
    this.bigView.style.transform = `scale(${zoomFactor})`;
    this.bigView.style.transformOrigin = '0 0';
    const scrollScaleFactor = zoomFactor / oldZoom;
    this.viewBox.scrollLeft *= scrollScaleFactor;
    this.viewBox.scrollTop *= scrollScaleFactor;
  }

  render() {
    return (
      <DragScrollView
        ref={this.viewBoxRef}
        onMouseDown={this.onMouseDown}
        style={{ position: 'absolute' }}
      >
        <div ref={this.bigViewRef}>
          <DragScrollContent ref={this.contentRef}>
            {this.props.children(
              this.setViewBoxScroll,
              this.setViewBoxScrollDelta
            )}
          </DragScrollContent>
        </div>
      </DragScrollView>
    );
  }
}

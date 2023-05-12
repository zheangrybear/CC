// @ts-nocheck
import { createKey, FocusMode, OpType } from '@blink-mind/core';
import * as React from 'react';
import cx from 'classnames';
import styled from 'styled-components';
import { contentRefKey, getRelativeRect, I18nKey, RefKey } from '../../utils';
import { BaseProps, BaseWidget } from '../common';
import { ChromePicker } from 'react-color';
import { debounce } from 'lodash';
import IconFont from '@/components/IconFonts';
import produce from 'immer';

const FocusHighlightContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
`;

const FocusSvg = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;
`;

const Toolbar = styled.div`
  font-weight: 500;
  border: 1.5px solid rgb(233, 235, 241);
  border-radius: 7px;
  background: white;
  padding: 2px 3px;
  color: black;
  position: absolute;
  white-space: nowrap;
  pointer-events: auto;
`;

const Button = styled.div`
  display: inline-block;
  vertical-align: middle;
  border-radius: 4px;
  cursor: pointer;
  padding: 4px 8px;
  user-select: none;
  &:hover {
    background: rgb(242, 242, 242);
  }
`;

const Icon = styled.div`
  position: absolute;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  text-align: center;
  background: rgb(8, 170, 255);
  cursor: pointer;
  padding: 0;
  font-size: 12px !important;
  line-height: 24px;
  border: 0;
  z-index: 2;
  color: white;
  pointer-events: auto;
`;

const ColorIndicator = styled.div`
  display: inline-block;
  border-radius: 50%;
  background: ${(props) => props.color};
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  vertical-align: middle;
`;

const Divider = styled.div`
  display: inline-block;
  width: 1px;
  height: 18px;
  margin-left: 4px;
  margin-right: 4px;
  background: rgb(233, 235, 241);
  vertical-align: middle;
`;

const DropDownContent = styled.div`
  display: block;
  position: absolute;
  background-color: #ffffff;
  min-width: 160px;
  border-radius: 10px;
  bottom: 35px;
  border: 1.5px solid rgb(233, 235, 241);
  z-index: 1;
  > div {
    display: block;
  }
`;

const ColorLabel = styled.div`
  width: 18px;
  height: 18px;
  position: relative;
  > div {
    display: flex;
    width: 15px;
    height: 15px;
    border-radius: 4px;
    margin-top: 2px;
    cursor: pointer;
    justify-content: center;
    &:hover {
      width: 16px;
      height: 16px;
      zoom: 1;
      transform: scale(1.2);
    }
  }
`;

const ColorsWrapper = styled.div`
  justify-content: center;
  padding: 8px;
  display: flex;
  > div {
    max-width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 12px 6px;
  }
  > span {
    display: flex;
    cursor: pointer;
    font-weight: 300;
    color: gray;
    font-size: 18px;
  }
`;

const Checked = styled.span`
  cursor: pointer;
  font-weight: 300;
  color: gray;
  font-size: 12px;
  color: white;
`;

const ColorPicker = styled.div`
  background: #f9f9f9;
  padding-bottom: 10px;
  .chrome-picker {
    width: 100% !important;
    background: #f9f9f9 !important;
    box-shadow: none !important;
  }
`;
const SaveButton = styled.div`
  display: flex;
  justify-content: center;
  background: rgb(8, 170, 255);
  color: white;
  margin-left: 10px;
  margin-right: 10px;
  height: 26px;
  border-radius: 4px;
  align-items: center;
  font-weight: 300;
  font-size: 15px;
  cursor: pointer;
`;

interface LineStyle {
  lineWidth: string;
  lineDasharray: boolean;
  lineType: string;
  lineLabel: string;
}
interface State {
  rect: any;
  color: string;
  lineStyle: LineStyle;
  colorBarBottom: number;
  displayColor: boolean;
  displayColorPicker: boolean;
  displayDropDown: boolean;
  displayLinkSetting: boolean;
  displayDeleteMenu: boolean;
  displayLineType: boolean;
  displayLabelInput: boolean;
}

const defaultColor = [
  '#7b68ee',
  '#ffa12f',
  '#ff5722',
  '#f42c2c',
  '#f8306d',
  '#ff00fc',
  '#4169e1',
  '#5f81ff',
  '#0ab4ff',
  '#08c7e0',
  '#07a092',
  '#1db954',
  '#2ea52c',
  '#757380',
  '#202020',
];

export class TopicFocusedTools extends BaseWidget<BaseProps, State> {
  state = {
    rect: null,
    colorBarBottom: 0,
    lineStyle: {
      lineWidth: '3px',
      lineDasharray: false,
      lineType: 'curve',
      lineLabel: '',
    },
    color: 'black',
    displayColor: false,
    displayColorPicker: false,
    displayDropDown: false,
    displayLinkSetting: false,
    displayDeleteMenu: false,
    displayLineType: false,
    displayLabelInput: false,
  };

  toolbarRef?: HTMLElement;

  layout() {
    const { getRef, model, zoomFactor } = this.props;
    const focusKey = model.focusKey;
    const focusMode = model.focusMode;
    if (!focusKey || focusMode === FocusMode.EDITING_CONTENT) {
      this.setState({
        rect: null,
      });
      return;
    }
    const content = getRef(contentRefKey(focusKey));
    if (!content) {
      this.setState({
        rect: null,
      });
      return;
    }
    const bigView = getRef(RefKey.DRAG_SCROLL_WIDGET_KEY).bigView;
    const svg = getRef(RefKey.SVG_HIGHLIGHT_KEY);
    const contentRect = getRelativeRect(content, bigView, zoomFactor);
    const svgRect = getRelativeRect(svg, bigView, zoomFactor);
    const padding = 3;
    const x = contentRect.left - svgRect.left - padding;
    const y = contentRect.top - svgRect.top - padding;
    const colorBarBottom =
      svgRect.bottom - contentRect.bottom + contentRect.height + 2 * padding;
    let width = contentRect.width + 2 * padding;
    const height = contentRect.height + 2 * padding;
    const topic = model.getTopic(focusKey);
    if (!topic.subKeys.isEmpty()) {
      width += 30;
    }
    this.setState({
      color: `${(topic && topic.color) || 'black'}`,
      lineStyle: (topic && topic.style?.length > 0) ? JSON.parse(topic.style) : {
        lineWidth: '3px',
        lineDasharray: false,
        lineType: 'curve',
        lineLabel: '',
      },
      colorBarBottom,
      rect: {
        x,
        y,
        width,
        height,
      },
    });

    if (!this.state.rect) {
      this.setState({
        displayColor: false,
        displayColorPicker: false,
        displayDropDown: false,
        displayLinkSetting: false,
        displayDeleteMenu: false,
        displayLineType: false,
        displayLabelInput: false,
      });
    }
  }

  changeLinkStyle = (style) => {
    const { controller, model } = this.props;
    controller.run('operation', {
      ...this.props,
      opType: OpType.SET_STYLE,
      topicKey: model.focusKey,
      style: JSON.stringify(style)
    })
  }

  changeLinkColor = (color) => {
    const { controller, model } = this.props;
    controller.run('operation', {
      ...this.props,
      opType: OpType.SET_COLOR,
      topicKey: model.focusKey,
      color: color,
    });
  };

  handlePickButtonClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  handleDropDownClick = () => {
    this.setState({ displayDropDown: !this.state.displayDropDown });
  };

  handleLineTypeClick = () => {
    this.setState({ displayLineType: !this.state.displayLineType, displayColor: false });
  }

  handleDeleteMenuClick = () => {
    this.setState({ displayDeleteMenu: !this.state.displayDeleteMenu });
  };

  handleLinkSettingClick = () => {
    this.setState({ displayLinkSetting: !this.state.displayLinkSetting })
  };

  handleLinkStyleChange = (key: string, data: string | boolean) => {
    this.setState({
      displayColor: false,
      displayLineType: false,
      lineStyle: produce(this.state.lineStyle, (draft) => {
        if (key === 'lineWidth') {
          draft.lineWidth = data ? `${parseInt(draft.lineWidth) + 1}px` : `${parseInt(draft.lineWidth) >= 2 ? parseInt(draft.lineWidth) - 1 : parseInt(draft.lineWidth)}px`
        } else {
          draft[key] = data
        }
      })
    });
    this.changeLinkStyle(produce(this.state.lineStyle, (draft) => {
      if (key === 'lineWidth') {
        draft.lineWidth = data ? `${parseInt(draft.lineWidth) + 1}px` : `${parseInt(draft.lineWidth) >= 2 ? parseInt(draft.lineWidth) - 1 : parseInt(draft.lineWidth)}px`
      } else {
        draft[key] = data
      }
    }))
  }

  handleColorClick = () => {
    this.setState({ displayColor: !this.state.displayColor, displayLineType: false });
  };

  handleColorClose = () => {
    this.setState({ displayColor: false });
    this.setState({ displayColorPicker: false });
  };

  handleSaveColor = () => {
    this.changeLinkColor(this.state.color);
    this.handleColorClose();
  };

  handleEditLabelClick = () => {
    this.setState({ displayLabelInput: !this.state.displayLabelInput, displayLineType: false });
  }

  onColorChange = (color: { hex: string }) => {
    this.setState({ color: color.hex });
    this.changeLinkColor(color.hex);
  };

  render() {
    const { saveRef, model, controller } = this.props;
    const extraMenus = controller.run('getExtraMenu', this.props) || [];
    const extraDeleteMenus = controller.run('getExtraDeleteMenu', model) || [];

    return (
      <>
        <FocusHighlightContainer
          ref={saveRef(RefKey.SVG_HIGHLIGHT_KEY)}
          onClick={(e) => e.preventDefault()} // 告知onClickOutSide不要处理
        >
          {this.state.rect && (
            <>
              <FocusSvg>
                <rect
                  {...this.state.rect}
                  fill="none"
                  rx="7"
                  ry="7"
                  stroke={model.config.theme.highlightColor}
                  strokeWidth={2}
                />
              </FocusSvg>
              {this.state.displayLinkSetting && (
                <Toolbar
                  ref={(e) => (this.toolbarRef = e)}
                  style={{
                    padding: 0,
                    zIndex: 10,
                    width: '305px',
                    left: this.state.rect.x + this.state.rect.width - 120,
                    bottom: this.state.colorBarBottom + 40,
                  }}
                >
                  <Button
                    onClick={() => this.handleLinkStyleChange('lineWidth', true)}
                  >
                    <IconFont icon='icon-column-height' />
                  </Button>
                  <Divider />
                  <Button onClick={() => this.handleLinkStyleChange('lineWidth', false)}><IconFont icon='icon-vertical-align-middle' /></Button>
                  <Divider />
                  <Button onClick={this.handleColorClick}> <ColorIndicator color={this.state.color} />
                    <svg
                      viewBox="0 0 100 100"
                      width={7}
                      height={7}
                      style={{ marginLeft: 8, display: 'inline-block' }}
                    >
                      <polygon points="0 10, 100 10, 50 70" />
                    </svg></Button>
                  <Divider />
                  <Button onClick={this.handleEditLabelClick}>
                    <IconFont icon='icon-edit' />
                  </Button>
                  <Divider />
                  <Button onClick={() => this.handleLinkStyleChange('lineDasharray', !this.state.lineStyle.lineDasharray)}>{
                    this.state.lineStyle.lineDasharray ? <IconFont icon='icon-line' /> : <IconFont icon='icon-line-dotted' />
                  }</Button>
                  <Divider />
                  <Button onClick={this.handleLineTypeClick}>
                    <IconFont icon={`icon-${this.state.lineStyle.lineType}`} style={{ fontSize: 10 }} />
                    {' '}
                    Type
                    <svg
                      viewBox="0 0 100 100"
                      width={7}
                      height={7}
                      style={{ marginLeft: 8, display: 'inline-block' }}
                    >
                      <polygon points="0 10, 100 10, 50 70" />
                    </svg>
                  </Button>
                </Toolbar>
              )}
              {this.state.displayLabelInput && (
                <Toolbar ref={(e) => (this.toolbarRef = e)}
                  style={{
                    left: this.state.rect.x + this.state.rect.width / 2 + 25,
                    bottom: this.state.colorBarBottom + 40,
                  }}
                >
                  <DropDownContent>
                    <input
                      autoFocus
                      defaultValue={this.state.lineStyle.lineLabel}
                      style={{ margin: 5 }} 
                      onKeyPress={(e) => {
                        if (e.code === 'Enter') {
                          this.setState({ displayLabelInput: false })
                        }
                      }}
                      onChange={debounce((e) => {
                        this.handleLinkStyleChange('lineLabel', e.target.value)
                      })}
                   />
                  </DropDownContent>
                </Toolbar>
              )}
              {this.state.displayLineType && (
                <Toolbar ref={(e) => (this.toolbarRef = e)}
                  style={{
                    left: this.state.rect.x + this.state.rect.width / 2 + 110,
                    bottom: this.state.colorBarBottom + 40,
                  }}
                >
                  <DropDownContent>
                    {['curve', 'round', 'line'].map((t) => (
                      <Button key={t} onClick={() => this.handleLinkStyleChange('lineType', t)}><IconFont icon={`icon-${t}`} />   {t}</Button>
                    ))}
                  </DropDownContent>
                </Toolbar>
              )}
              {this.state.displayColor && (
                <Toolbar
                  ref={(e) => (this.toolbarRef = e)}
                  style={{
                    padding: 0,
                    zIndex: 10,
                    width: '250px',
                    left: this.state.rect.x + this.state.rect.width - 120,
                    bottom: this.state.colorBarBottom + 75,
                  }}
                >
                  {this.state.displayColorPicker && (
                    <ColorPicker>
                      <ChromePicker
                        disableAlpha
                        color={this.state.color}
                        onChangeComplete={this.onColorChange}
                      />
                      <SaveButton onClick={() => this.handleSaveColor()}>
                        Save
                      </SaveButton>
                    </ColorPicker>
                  )}
                  <ColorsWrapper>
                    <div>
                      {defaultColor.map((color) => {
                        const isChecked = this.state.color === color;
                        return (
                          <ColorLabel key={color}>
                            <div
                              style={{
                                background: color,
                                width: `${isChecked ? '18px' : '15px'}`,
                                height: `${isChecked ? '18px' : '15px'}`,
                              }}
                              onClick={() => this.onColorChange({ hex: color })}
                            >
                              {isChecked && <Checked>✔</Checked>}
                            </div>
                          </ColorLabel>
                        );
                      })}
                      <ColorLabel>
                        <div
                          onClick={this.handlePickButtonClick}
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontColor: 'gray',
                          }}
                          className={cx({
                            icon: true,
                            iconfont: true,
                            ['icon-Colorpicker']: true,
                          })}
                        />
                      </ColorLabel>
                    </div>
                    <span onClick={this.handleColorClose}>✕</span>
                  </ColorsWrapper>
                </Toolbar>
              )}
              {this.state.displayDropDown && (
                <Toolbar
                  ref={(e) => (this.toolbarRef = e)}
                  style={{
                    left: this.state.rect.x + this.state.rect.width / 2 - 100,
                    bottom: this.state.colorBarBottom + 5,
                  }}
                >
                  <DropDownContent id='uploadDropdown'>
                    {extraMenus.map(([key, n, e]) => {
                      if (e !== undefined) {
                        return e
                      }
                      return (
                        <Button
                          key={key}
                          className={`mindmap-create-${key}-button`}
                          onClick={(ev) => {
                            controller.run('extraMenuClick', {
                              ...this.props,
                              ev,
                              buttonKey: key,
                            });
                          }}
                        >
                          + {n}
                        </Button>)
                    })}
                  </DropDownContent>
                </Toolbar>
              )}
              {this.state.displayDeleteMenu && (
                <Toolbar
                  ref={(e) => (this.toolbarRef = e)}
                  style={{
                    left: this.state.rect.x + this.state.rect.width / 2 + 30,
                    bottom: this.state.colorBarBottom + 5,
                  }}
                >
                  <DropDownContent>
                    {extraDeleteMenus.map(([key, n]) => (
                      <Button
                        key={key}
                        onClick={(ev) => {
                          controller.run('extraMenuClick', {
                            ...this.props,
                            ev,
                            buttonKey: key,
                          });
                        }}
                      >
                        <span className="anticon align-text-bottom">
                          <i
                            className={cx({
                              icon: true,
                              iconfont: true,
                              ['icon-delete']: true,
                            })}
                            style={{ color: 'rgb(253,113,175', fontSize: 16 }}
                          />
                          {'  ' + n}
                        </span>
                      </Button>
                    ))}
                  </DropDownContent>
                </Toolbar>
              )}
              <Toolbar
                ref={(e) => (this.toolbarRef = e)}
                id='Toolbar'
                style={{
                  left: this.state.rect.x + this.state.rect.width / 2 - 100,
                  top: this.state.rect.y - 33 - 6,
                }}
              >
                <div style={{ display: 'inline-block' }}>
                  <Button
                    className="mindmap-create-task-button"
                    onClick={(ev) => {
                      controller.run('handleCreateTaskClick', {
                        ...this.props,
                        ev,
                      });
                    }}
                  >
                    +{' '}
                    {controller.run('getI18nText', {
                      ...this.props,
                      key: I18nKey.CREATE_TASK,
                    })}
                  </Button>
                  {extraMenus.length > 0 && (
                    <Button
                      onClick={this.handleDropDownClick}
                      className="mindmap-create-extra"
                    >
                      <svg
                        viewBox="0 0 100 100"
                        width={7}
                        height={7}
                        style={{ display: 'inline-block' }}
                      >
                        <polygon points="0 10, 100 10, 50 70" />
                      </svg>
                    </Button>
                  )}
                </div>
                <Divider />
                <Button onClick={this.handleLinkSettingClick}>
                  <IconFont icon='icon-line-style-edit' />
                  <svg
                    viewBox="0 0 100 100"
                    width={7}
                    height={7}
                    style={{ marginLeft: 8, display: 'inline-block' }}
                  >
                    <polygon points="0 10, 100 10, 50 70" />
                  </svg>
                </Button>
                <Divider />
                <Button
                  onClick={() => {
                    controller.run('operation', {
                      ...this.props,
                      topicKey: model.focusKey,
                      opType: OpType.DELETE_TOPIC,
                    });
                  }}
                >
                  <div
                    style={{ color: 'rgb(253,113,175)' }}
                    className={cx({
                      icon: true,
                      iconfont: true,
                      ['icon-delete']: true,
                    })}
                  />
                </Button>
                {extraDeleteMenus.length > 0 && (
                  <Button onClick={this.handleDeleteMenuClick}>
                    <svg
                      viewBox="0 0 100 100"
                      width={7}
                      height={7}
                      style={{ display: 'inline-block' }}
                    >
                      <polygon points="0 10, 100 10, 50 70" />
                    </svg>
                  </Button>
                )}
              </Toolbar>
              <Icon
                style={{
                  left: this.state.rect.x + this.state.rect.width + 8,
                  top: this.state.rect.y + this.state.rect.height / 2 - 12,
                }}
                className={cx({
                  icon: true,
                  iconfont: true,
                  ['icon-plus']: true,
                })}
                onClick={(e) => {
                  controller.run('operation', {
                    ...this.props,
                    topicKey: model.focusKey,
                    opType: OpType.ADD_CHILD,
                    newTopicKey: createKey(),
                  });
                  e.stopPropagation();
                }}
              />
              {model.rootTopicKey !== model.focusKey && (
                <Icon
                  style={{
                    left: this.state.rect.x + this.state.rect.width / 2 - 12,
                    top: this.state.rect.y + this.state.rect.height + 8,
                  }}
                  className={cx({
                    icon: true,
                    iconfont: true,
                    ['icon-create_sibling_node']: true,
                  })}
                  onClick={(e) => {
                    controller.run('operation', {
                      ...this.props,
                      topicKey: model.focusKey,
                      opType: OpType.ADD_SIBLING,
                      newTopicKey: createKey(),
                      newPosition: 'behind'
                    });
                    e.stopPropagation();
                  }}
                />
              )}
            </>
          )}
        </FocusHighlightContainer>
      </>
    );
  }
}

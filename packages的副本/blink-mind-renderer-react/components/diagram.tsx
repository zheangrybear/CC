// @ts-nocheck
// TODO
import {
  Controller,
  IDiagram,
  IDiagramProps,
  Model,
  OnChangeFunction,
} from '@blink-mind/core';
import debug from 'debug';
import memoizeOne from 'memoize-one';
import * as React from 'react';

import { DefaultPlugin } from '../plugins';

const log = debug('node:Diagram');

interface Props {
  model: Model | null | undefined;
  onChange?: OnChangeFunction;
  controller?: Controller;
  commands?: any;
  plugins?: any;
  editors?: any;
  editable?: boolean;
}

export class Diagram extends React.Component<Props> implements IDiagram {
  controller: Controller;

  public getDiagramProps(): IDiagramProps {
    return this.controller.run('getDiagramProps');
  }

  public openNewModel(newModel: Model) {
    const props = this.getDiagramProps();
    const { controller } = props;
    controller.run('openNewModel', {
      ...props,
      newModel,
    });
  }

  private diagramProps: IDiagramProps;

  private resolveController = memoizeOne((plugins = [], TheDefaultPlugin) => {
    const defaultPlugin = TheDefaultPlugin();
    this.controller = new Controller({
      plugins: [plugins, defaultPlugin],
      onChange: this.props.onChange,
    });
  });

  render() {
    const { plugins, controller } = this.props;
    if (controller) this.controller = controller;
    else this.resolveController(plugins, DefaultPlugin);
    const { model } = this.props;
    if (!model) {
      return null;
    }
    this.diagramProps = {
      ...this.props,
      model,
      controller: this.controller,
    };
    return this.controller.run('renderDiagram', this.diagramProps);
  }
}

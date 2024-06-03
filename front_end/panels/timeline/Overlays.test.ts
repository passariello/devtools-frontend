// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as TraceEngine from '../../models/trace/trace.js';
import {describeWithEnvironment} from '../../testing/EnvironmentHelpers.js';
import {
  makeInstantEvent,
  MockFlameChartDelegate,
  setupIgnoreListManagerEnvironment,
} from '../../testing/TraceHelpers.js';
import {TraceLoader} from '../../testing/TraceLoader.js';
import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';

import * as Timeline from './timeline.js';

/**
 * The Overlays expects to be provided with both the main and network charts
 * and data providers. This function creates all of those and optionally sets
 * the trace data for the providers if it is provided.
 */
function createCharts(traceParsedData?: TraceEngine.Handlers.Types.TraceParseData): Timeline.Overlays.TimelineCharts {
  const mainProvider = new Timeline.TimelineFlameChartDataProvider.TimelineFlameChartDataProvider();
  const networkProvider = new Timeline.TimelineFlameChartNetworkDataProvider.TimelineFlameChartNetworkDataProvider();

  const delegate = new MockFlameChartDelegate();
  const mainChart = new PerfUI.FlameChart.FlameChart(mainProvider, delegate);
  const networkChart = new PerfUI.FlameChart.FlameChart(networkProvider, delegate);

  if (traceParsedData) {
    mainProvider.setModel(traceParsedData);
    networkProvider.setModel(traceParsedData);

    // Force the charts to render. Normally the TimelineFlameChartView would do
    // this, but we aren't creating one for these tests.
    mainChart.update();
    networkChart.update();
  }

  return {
    mainProvider,
    mainChart,
    networkProvider,
    networkChart,
  };
}

describeWithEnvironment('Overlays', () => {
  beforeEach(() => {
    setupIgnoreListManagerEnvironment();
  });

  it('can calculate the x position of an event based on the dimensions and its timestamp', async () => {
    const container = document.createElement('div');
    const overlays = new Timeline.Overlays.Overlays({
      container,
      charts: createCharts(),
    });

    // Set up the dimensions so it is 100px wide
    overlays.updateChartDimensions('main', {
      widthPixels: 100,
      heightPixels: 50,
      scrollOffsetPixels: 0,
    });
    overlays.updateChartDimensions('network', {
      widthPixels: 100,
      heightPixels: 50,
      scrollOffsetPixels: 0,
    });

    const windowMin = TraceEngine.Types.Timing.MicroSeconds(0);
    const windowMax = TraceEngine.Types.Timing.MicroSeconds(100);
    // Set the visible window to be 0-100 microseconds
    overlays.updateVisibleWindow(TraceEngine.Helpers.Timing.traceWindowFromMicroSeconds(windowMin, windowMax));

    // Now set an event to be at 50 microseconds.
    const event = makeInstantEvent('test-event', 50);

    const xPosition = overlays.xPixelForEventOnChart('main', event);
    assert.strictEqual(xPosition, 50);
  });

  it('can calculate the y position of a main chart event', async function() {
    const traceParsedData = await TraceLoader.traceEngine(this, 'web-dev.json.gz');
    const charts = createCharts(traceParsedData);

    const container = document.createElement('div');
    const overlays = new Timeline.Overlays.Overlays({
      container,
      charts,
    });

    overlays.updateChartDimensions('main', {
      widthPixels: 1000,
      heightPixels: 500,
      scrollOffsetPixels: 0,
    });
    overlays.updateChartDimensions('network', {
      widthPixels: 1000,
      heightPixels: 200,
      scrollOffsetPixels: 0,
    });

    // Set the visible window to be the entire trace.
    overlays.updateVisibleWindow(traceParsedData.Meta.traceBounds);

    // Find an event on the main chart that is not a frame (you cannot add overlays to frames)
    const event = charts.mainProvider.eventByIndex(50);
    assert.isOk(event);
    const yPixel = overlays.yPixelForEventOnChart('main', event);
    // The Y offset for the main chart is 233px, but we add 208px on (200px for the
    // network chart, and 8px for the re-size handle) giving us the expected
    // 441px.
    assert.strictEqual(yPixel, 441);
  });

  it('can calculate the y position of a network chart event', async function() {
    const traceParsedData = await TraceLoader.traceEngine(this, 'web-dev.json.gz');
    const charts = createCharts(traceParsedData);

    const container = document.createElement('div');
    const overlays = new Timeline.Overlays.Overlays({
      container,
      charts,
    });

    overlays.updateChartDimensions('main', {
      widthPixels: 1000,
      heightPixels: 500,
      scrollOffsetPixels: 0,
    });
    overlays.updateChartDimensions('network', {
      widthPixels: 1000,
      heightPixels: 200,
      scrollOffsetPixels: 0,
    });

    // Set the visible window to be the entire trace.
    overlays.updateVisibleWindow(traceParsedData.Meta.traceBounds);

    // Find an event on the network chart
    const event = charts.networkProvider.eventByIndex(0);
    assert.isOk(event);
    const yPixel = overlays.yPixelForEventOnChart('network', event);
    // This event is in the first level, but the first level has some offset
    // above it to allow for the header row and the row with the timestamps on
    // it, hence why this value is not 0px.
    assert.strictEqual(yPixel, 34);
  });
});
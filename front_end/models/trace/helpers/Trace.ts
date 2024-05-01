// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../core/common/common.js';
import * as Platform from '../../../core/platform/platform.js';
import type * as CPUProfile from '../../cpu_profile/cpu_profile.js';
import * as Types from '../types/types.js';

type MatchedPairType<T extends Types.TraceEvents.TraceEventPairableAsync> = Types.TraceEvents.SyntheticEventPair<T>;

export function stackTraceForEvent(event: Types.TraceEvents.TraceEventData): Types.TraceEvents.TraceEventCallFrame[]|
    null {
  if (Types.TraceEvents.isSyntheticInvalidation(event)) {
    return event.stackTrace || null;
  }
  if (event.args?.data?.stackTrace) {
    return event.args.data.stackTrace;
  }
  if (Types.TraceEvents.isTraceEventUpdateLayoutTree(event)) {
    return event.args.beginData?.stackTrace || null;
  }
  return null;
}

export function extractOriginFromTrace(firstNavigationURL: string): string|null {
  const url = Common.ParsedURL.ParsedURL.fromString(firstNavigationURL);
  if (url) {
    // We do this to save some space in the toolbar - seeing the `www` is less
    // useful than seeing `foo.com` if it's truncated at narrow widths
    if (url.host.startsWith('www.')) {
      return url.host.slice(4);
    }
    return url.host;
  }
  return null;
}

export type EventsInThread<T extends Types.TraceEvents.TraceEventData> = Map<Types.TraceEvents.ThreadID, T[]>;
// Each thread contains events. Events indicate the thread and process IDs, which are
// used to store the event in the correct process thread entry below.
export function addEventToProcessThread<T extends Types.TraceEvents.TraceEventData>(
    event: T,
    eventsInProcessThread: Map<Types.TraceEvents.ProcessID, EventsInThread<T>>,
    ): void {
  const {tid, pid} = event;
  let eventsInThread = eventsInProcessThread.get(pid);
  if (!eventsInThread) {
    eventsInThread = new Map<Types.TraceEvents.ThreadID, T[]>();
  }

  let events = eventsInThread.get(tid);
  if (!events) {
    events = [];
  }

  events.push(event);
  eventsInThread.set(event.tid, events);
  eventsInProcessThread.set(event.pid, eventsInThread);
}

type TimeSpan = {
  ts: Types.Timing.MicroSeconds,
  dur?: Types.Timing.MicroSeconds,
};
export function eventTimeComparator(a: TimeSpan, b: TimeSpan): -1|0|1 {
  const aBeginTime = a.ts;
  const bBeginTime = b.ts;
  if (aBeginTime < bBeginTime) {
    return -1;
  }
  if (aBeginTime > bBeginTime) {
    return 1;
  }
  const aDuration = a.dur ?? 0;
  const bDuration = b.dur ?? 0;
  const aEndTime = aBeginTime + aDuration;
  const bEndTime = bBeginTime + bDuration;
  if (aEndTime > bEndTime) {
    return -1;
  }
  if (aEndTime < bEndTime) {
    return 1;
  }
  return 0;
}
/**
 * Sorts all the events in place, in order, by their start time. If they have
 * the same start time, orders them by longest first.
 */
export function sortTraceEventsInPlace(events: {ts: Types.Timing.MicroSeconds, dur?: Types.Timing.MicroSeconds}[]):
    void {
  events.sort(eventTimeComparator);
}

/**
 * Returns an array of ordered events that results after merging the two
 * ordered input arrays.
 */
export function
mergeEventsInOrder<T1 extends Types.TraceEvents.TraceEventData, T2 extends Types.TraceEvents.TraceEventData>(
    eventsArray1: readonly T1[], eventsArray2: readonly T2[]): (T1|T2)[] {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < eventsArray1.length && j < eventsArray2.length) {
    const event1 = eventsArray1[i];
    const event2 = eventsArray2[j];
    const compareValue = eventTimeComparator(event1, event2);
    if (compareValue <= 0) {
      result.push(event1);
      i++;
    }
    if (compareValue === 1) {
      result.push(event2);
      j++;
    }
  }
  while (i < eventsArray1.length) {
    result.push(eventsArray1[i++]);
  }
  while (j < eventsArray2.length) {
    result.push(eventsArray2[j++]);
  }
  return result;
}

export function getNavigationForTraceEvent(
    event: Types.TraceEvents.TraceEventData,
    eventFrameId: string,
    navigationsByFrameId: Map<string, Types.TraceEvents.TraceEventNavigationStart[]>,
    ): Types.TraceEvents.TraceEventNavigationStart|null {
  const navigations = navigationsByFrameId.get(eventFrameId);
  if (!navigations || eventFrameId === '') {
    // This event's navigation has been filtered out by the meta handler as a noise event
    // or contains an empty frameId.
    return null;
  }

  const eventNavigationIndex =
      Platform.ArrayUtilities.nearestIndexFromEnd(navigations, navigation => navigation.ts <= event.ts);

  if (eventNavigationIndex === null) {
    // This event's navigation has been filtered out by the meta handler as a noise event.
    return null;
  }
  return navigations[eventNavigationIndex];
}

export function extractId(event: Types.TraceEvents.TraceEventPairableAsync|
                          MatchedPairType<Types.TraceEvents.TraceEventPairableAsync>): string|undefined {
  return event.id ?? event.id2?.global ?? event.id2?.local;
}

export function activeURLForFrameAtTime(
    frameId: string, time: Types.Timing.MicroSeconds,
    rendererProcessesByFrame:
        Map<string,
            Map<Types.TraceEvents.ProcessID,
                {frame: Types.TraceEvents.TraceFrame, window: Types.Timing.TraceWindowMicroSeconds}[]>>): string|null {
  const processData = rendererProcessesByFrame.get(frameId);
  if (!processData) {
    return null;
  }
  for (const processes of processData.values()) {
    for (const processInfo of processes) {
      if (processInfo.window.min > time || processInfo.window.max < time) {
        continue;
      }
      return processInfo.frame.url;
    }
  }
  return null;
}

export function makeProfileCall(
    node: CPUProfile.ProfileTreeModel.ProfileNode, ts: Types.Timing.MicroSeconds, pid: Types.TraceEvents.ProcessID,
    tid: Types.TraceEvents.ThreadID): Types.TraceEvents.SyntheticProfileCall {
  return {
    cat: '',
    name: 'ProfileCall',
    nodeId: node.id,
    args: {},
    ph: Types.TraceEvents.Phase.COMPLETE,
    pid,
    tid,
    ts,
    dur: Types.Timing.MicroSeconds(0),
    selfTime: Types.Timing.MicroSeconds(0),
    callFrame: node.callFrame,
  };
}

export function makeSyntheticTraceEntry(
    name: string, ts: Types.Timing.MicroSeconds, pid: Types.TraceEvents.ProcessID,
    tid: Types.TraceEvents.ThreadID): Types.TraceEvents.SyntheticTraceEntry {
  return {
    cat: '',
    name,
    args: {},
    ph: Types.TraceEvents.Phase.COMPLETE,
    pid,
    tid,
    ts,
    dur: Types.Timing.MicroSeconds(0),
    selfTime: Types.Timing.MicroSeconds(0),
  };
}

export function matchBeginningAndEndEvents(unpairedEvents: Types.TraceEvents.TraceEventPairableAsync[]): Map<string, {
  begin: Types.TraceEvents.TraceEventPairableAsyncBegin | null,
  end: Types.TraceEvents.TraceEventPairableAsyncEnd | null,
}> {
  // map to store begin and end of the event
  const matchedPairs: Map<string, {
    begin: Types.TraceEvents.TraceEventPairableAsyncBegin | null,
    end: Types.TraceEvents.TraceEventPairableAsyncEnd | null,
  }> = new Map();

  // looking for start and end
  for (const event of unpairedEvents) {
    const syntheticId = getSyntheticId(event);
    if (syntheticId === undefined) {
      continue;
    }
    // Create a synthetic id to prevent collisions across categories.
    // Console timings can be dispatched with the same id, so use the
    // event name as well to generate unique ids.
    const otherEventsWithID = Platform.MapUtilities.getWithDefault(matchedPairs, syntheticId, () => {
      return {begin: null, end: null};
    });

    const isStartEvent = event.ph === Types.TraceEvents.Phase.ASYNC_NESTABLE_START;
    const isEndEvent = event.ph === Types.TraceEvents.Phase.ASYNC_NESTABLE_END;

    if (isStartEvent) {
      otherEventsWithID.begin = event as Types.TraceEvents.TraceEventPairableAsyncBegin;
    } else if (isEndEvent) {
      otherEventsWithID.end = event as Types.TraceEvents.TraceEventPairableAsyncEnd;
    }
  }

  return matchedPairs;
}

function getSyntheticId(event: Types.TraceEvents.TraceEventPairableAsync): string|undefined {
  const id = extractId(event);
  return id && `${event.cat}:${id}:${event.name}`;
}

export function createSortedSyntheticEvents<T extends Types.TraceEvents.TraceEventPairableAsync>(
    matchedPairs: Map<string, {
      begin: Types.TraceEvents.TraceEventPairableAsyncBegin | null,
      end: Types.TraceEvents.TraceEventPairableAsyncEnd | null,
    }>,
    syntheticEventCallback?: (syntheticEvent: MatchedPairType<T>) => void,
    ): MatchedPairType<T>[] {
  const syntheticEvents: MatchedPairType<T>[] = [];
  for (const [id, eventsPair] of matchedPairs.entries()) {
    const beginEvent = eventsPair.begin;
    const endEvent = eventsPair.end;
    if (!beginEvent || !endEvent) {
      // This should never happen, the backend only creates the events once it
      // has them both, so we should never get into this state.
      // If we do, something is very wrong, so let's just drop that problematic event.
      continue;
    }
    const pair = {beginEvent, endEvent};
    function eventsArePairable(data: {
      beginEvent: Types.TraceEvents.TraceEventPairableAsyncBegin,
      endEvent: Types.TraceEvents.TraceEventPairableAsyncEnd,
    }): data is MatchedPairType<T>['args']['data'] {
      return Boolean(getSyntheticId(data.beginEvent)) &&
          getSyntheticId(data.beginEvent) === getSyntheticId(data.endEvent);
    }
    if (!eventsArePairable(pair)) {
      continue;
    }
    const event: MatchedPairType<T> = {
      cat: endEvent.cat,
      ph: endEvent.ph,
      pid: endEvent.pid,
      tid: endEvent.tid,
      id,
      // Both events have the same name, so it doesn't matter which we pick to
      // use as the description
      name: beginEvent.name,
      dur: Types.Timing.MicroSeconds(endEvent.ts - beginEvent.ts),
      ts: beginEvent.ts,
      args: {
        data: pair,
      },
    };

    if (event.dur < 0) {
      // We have seen in the backend that sometimes animation events get
      // generated with multiple begin entries, or multiple end entries, and this
      // can cause invalid data on the performance panel, so we drop them.
      // crbug.com/1472375
      continue;
    }
    syntheticEventCallback?.(event);
    syntheticEvents.push(event);
  }
  return syntheticEvents.sort((a, b) => a.ts - b.ts);
}

export function createMatchedSortedSyntheticEvents<T extends Types.TraceEvents.TraceEventPairableAsync>(
    unpairedAsyncEvents: T[],
    syntheticEventCallback?: (syntheticEvent: MatchedPairType<T>) => void): MatchedPairType<T>[] {
  const matchedPairs = matchBeginningAndEndEvents(unpairedAsyncEvents);
  const syntheticEvents = createSortedSyntheticEvents<T>(matchedPairs, syntheticEventCallback);
  return syntheticEvents;
}

/**
 * Different trace events return line/column numbers that are 1 or 0 indexed.
 * This function knows which events return 1 indexed numbers and normalizes
 * them. The UI expects 0 indexed line numbers, so that is what we return.
 */
export function getZeroIndexedLineAndColumnNumbersForEvent(event: Types.TraceEvents.TraceEventData): {
  lineNumber?: number,
  columnNumber?: number,
} {
  // Some events emit line numbers that are 1 indexed, but the UI layer expects
  // numbers to be 0 indexed. So here, if the event matches a known 1-indexed
  // number event, we subtract one from the line and column numbers.
  // Otherwise, if the event has args.data.lineNumber/colNumber, we return it
  // as is.
  const numbers = getRawLineAndColumnNumbersForEvent(event);
  const {lineNumber, columnNumber} = numbers;

  switch (event.name) {
    // All these events have line/column numbers which are 1 indexed; so we
    // subtract to make them 0 indexed.
    case Types.TraceEvents.KnownEventName.FunctionCall:
    case Types.TraceEvents.KnownEventName.EvaluateScript:
    case Types.TraceEvents.KnownEventName.Compile:
    case Types.TraceEvents.KnownEventName.CacheScript: {
      return {
        lineNumber: typeof lineNumber === 'number' ? lineNumber - 1 : undefined,
        columnNumber: typeof columnNumber === 'number' ? columnNumber - 1 : undefined,
      };
    }
    default: {
      return numbers;
    }
  }
}

/**
 * NOTE: you probably do not want this function! (Which is why it is not exported).
 *
 * Some trace events have 0 indexed line/column numbers, and others have 1
 * indexed. This function does NOT normalize them, but
 * `getZeroIndexedLineAndColumnNumbersForEvent` does. It is best to use that!
 *
 * @see {@link getZeroIndexedLineAndColumnNumbersForEvent}
 **/
function getRawLineAndColumnNumbersForEvent(event: Types.TraceEvents.TraceEventData): {
  lineNumber?: number,
  columnNumber?: number,
} {
  if (!event.args?.data) {
    return {
      lineNumber: undefined,
      columnNumber: undefined,
    };
  }
  let lineNumber: number|undefined = undefined;
  let columnNumber: number|undefined = undefined;
  if ('lineNumber' in event.args.data && typeof event.args.data.lineNumber === 'number') {
    lineNumber = event.args.data.lineNumber;
  }
  if ('columnNumber' in event.args.data && typeof event.args.data.columnNumber === 'number') {
    columnNumber = event.args.data.columnNumber;
  }

  return {lineNumber, columnNumber};
}

export function frameIDForEvent(event: Types.TraceEvents.TraceEventData): string|null {
  // There are a few events (for example UpdateLayoutTree, ParseHTML) that have
  // the frame stored in args.beginData
  // Rather than list them all we just check for the presence of the field, so
  // we are robust against future trace events also doing this.
  // This check seems very robust, but it also helps satisfy TypeScript and
  // prevents us against unexpected data.
  if (event.args && 'beginData' in event.args && typeof event.args.beginData === 'object' &&
      event.args.beginData !== null && 'frame' in event.args.beginData &&
      typeof event.args.beginData.frame === 'string') {
    return event.args.beginData.frame;
  }
  // Otherwise, we expect frame to be in args.data
  if (event.args?.data?.frame) {
    return event.args.data.frame;
  }

  // No known frame for this event.
  return null;
}

const DevToolsTimelineEventCategory = 'disabled-by-default-devtools.timeline';
function isTopLevelEvent(event: Types.TraceEvents.TraceEventData): boolean {
  return event.cat.includes(DevToolsTimelineEventCategory) && event.name === Types.TraceEvents.KnownEventName.RunTask;
}

function topLevelEventIndexEndingAfter(
    events: Types.TraceEvents.TraceEventData[], time: Types.Timing.MicroSeconds): number {
  let index = Platform.ArrayUtilities.upperBound(events, time, (time, event) => time - event.ts) - 1;
  while (index > 0 && !isTopLevelEvent(events[index])) {
    index--;
  }
  return Math.max(index, 0);
}
export function findUpdateLayoutTreeEvents(
    events: Types.TraceEvents.TraceEventData[], startTime: Types.Timing.MicroSeconds,
    endTime?: Types.Timing.MicroSeconds): Types.TraceEvents.TraceEventUpdateLayoutTree[] {
  const foundEvents: Types.TraceEvents.TraceEventUpdateLayoutTree[] = [];
  const startEventIndex = topLevelEventIndexEndingAfter(events, startTime);
  for (let i = startEventIndex; i < events.length; i++) {
    const event = events[i];
    if (!Types.TraceEvents.isTraceEventUpdateLayoutTree(event)) {
      continue;
    }
    if (event.ts >= (endTime || Infinity)) {
      continue;
    }
    foundEvents.push(event);
  }
  return foundEvents;
}

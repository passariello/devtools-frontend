// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as i18n from '../../../core/i18n/i18n.js';

// This file is auto-generated by scripts/generate_metric_compare_strings.js.
//
// If you need to update one or more of these strings, it is preferable to modify the script
// and write stdout to this file (Minor formatting differences may apply).

const UIStrings = {
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  goodBetterCompare: 'Your local {PH1} {PH2} is good, and is significantly better than your users’ experience.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  goodWorseCompare: 'Your local {PH1} {PH2} is good, and is significantly worse than your users’ experience.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  goodSimilarCompare: 'Your local {PH1} {PH2} is good, and is similar to your users’ experience.',
  /**
   * @description Text block that summarize a local metric value.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  goodSummarized: 'Your local {PH1} {PH2} is good.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  needsImprovementBetterCompare:
      'Your local {PH1} {PH2} needs improvement, and is significantly better than your users’ experience.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  needsImprovementWorseCompare:
      'Your local {PH1} {PH2} needs improvement, and is significantly worse than your users’ experience.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  needsImprovementSimilarCompare: 'Your local {PH1} {PH2} needs improvement, and is similar to your users’ experience.',
  /**
   * @description Text block that summarize a local metric value.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  needsImprovementSummarized: 'Your local {PH1} {PH2} needs improvement.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  poorBetterCompare: 'Your local {PH1} {PH2} is poor, and is significantly better than your users’ experience.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  poorWorseCompare: 'Your local {PH1} {PH2} is poor, and is significantly worse than your users’ experience.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  poorSimilarCompare: 'Your local {PH1} {PH2} is poor, and is similar to your users’ experience.',
  /**
   * @description Text block that summarize a local metric value.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   */
  poorSummarized: 'Your local {PH1} {PH2} is poor.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  goodGoodDetailedCompare:
      'Your local {PH1} {PH2} is good and is rated the same as {PH4} of real-user {PH1} experiences. Additionally, the field data 75th percentile {PH1} {PH3} is good.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  goodNeedsImprovementDetailedCompare:
      'Your local {PH1} {PH2} is good and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} {PH3} needs improvement.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  goodPoorDetailedCompare:
      'Your local {PH1} {PH2} is good and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} {PH3} is poor.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  needsImprovementGoodDetailedCompare:
      'Your local {PH1} {PH2} needs improvement and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} {PH3} is good.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  needsImprovementNeedsImprovementDetailedCompare:
      'Your local {PH1} {PH2} needs improvement and is rated the same as {PH4} of real-user {PH1} experiences. Additionally, the field data 75th percentile {PH1} {PH3} needs improvement.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  needsImprovementPoorDetailedCompare:
      'Your local {PH1} {PH2} needs improvement and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} {PH3} is poor.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  poorGoodDetailedCompare:
      'Your local {PH1} {PH2} is poor and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} {PH3} is good.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  poorNeedsImprovementDetailedCompare:
      'Your local {PH1} {PH2} is poor and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} {PH3} needs improvement.',
  /**
   * @description Text block that compares a local metric value to real user experiences.
   * @example {LCP} PH1
   * @example {500 ms} PH2
   * @example {400 ms} PH3
   * @example {40%} PH4
   */
  poorPoorDetailedCompare:
      'Your local {PH1} {PH2} is poor and is rated the same as {PH4} of real-user {PH1} experiences. Additionally, the field data 75th percentile {PH1} {PH3} is poor.',
};

const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/MetricCompareStrings.ts', UIStrings);

export function renderCompareText(
    rating: 'good'|'needs-improvement'|'poor', compare?: 'better'|'worse'|'similar',
    values?: Record<string, Object>): Element {
  if (!values) {
    values = {};
  }

  if (rating === 'good' && compare === 'better') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.goodBetterCompare, values);
  }
  if (rating === 'good' && compare === 'worse') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.goodWorseCompare, values);
  }
  if (rating === 'good' && compare === 'similar') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.goodSimilarCompare, values);
  }
  if (rating === 'good' && !compare) {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.goodSummarized, values);
  }
  if (rating === 'needs-improvement' && compare === 'better') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.needsImprovementBetterCompare, values);
  }
  if (rating === 'needs-improvement' && compare === 'worse') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.needsImprovementWorseCompare, values);
  }
  if (rating === 'needs-improvement' && compare === 'similar') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.needsImprovementSimilarCompare, values);
  }
  if (rating === 'needs-improvement' && !compare) {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.needsImprovementSummarized, values);
  }
  if (rating === 'poor' && compare === 'better') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.poorBetterCompare, values);
  }
  if (rating === 'poor' && compare === 'worse') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.poorWorseCompare, values);
  }
  if (rating === 'poor' && compare === 'similar') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.poorSimilarCompare, values);
  }
  if (rating === 'poor' && !compare) {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.poorSummarized, values);
  }

  throw new Error('Compare string not found');
}

export function renderDetailedCompareText(
    localRating: 'good'|'needs-improvement'|'poor', fieldRating?: 'good'|'needs-improvement'|'poor',
    values?: Record<string, Object>): Element {
  if (!values) {
    values = {};
  }

  if (localRating === 'good' && fieldRating === 'good') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.goodGoodDetailedCompare, values);
  }
  if (localRating === 'good' && fieldRating === 'needs-improvement') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.goodNeedsImprovementDetailedCompare, values);
  }
  if (localRating === 'good' && fieldRating === 'poor') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.goodPoorDetailedCompare, values);
  }
  if (localRating === 'good' && !fieldRating) {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.goodSummarized, values);
  }
  if (localRating === 'needs-improvement' && fieldRating === 'good') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.needsImprovementGoodDetailedCompare, values);
  }
  if (localRating === 'needs-improvement' && fieldRating === 'needs-improvement') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.needsImprovementNeedsImprovementDetailedCompare, values);
  }
  if (localRating === 'needs-improvement' && fieldRating === 'poor') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.needsImprovementPoorDetailedCompare, values);
  }
  if (localRating === 'needs-improvement' && !fieldRating) {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.needsImprovementSummarized, values);
  }
  if (localRating === 'poor' && fieldRating === 'good') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.poorGoodDetailedCompare, values);
  }
  if (localRating === 'poor' && fieldRating === 'needs-improvement') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.poorNeedsImprovementDetailedCompare, values);
  }
  if (localRating === 'poor' && fieldRating === 'poor') {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.poorPoorDetailedCompare, values);
  }
  if (localRating === 'poor' && !fieldRating) {
    return i18n.i18n.getFormatLocalizedString(str_, UIStrings.poorSummarized, values);
  }

  throw new Error('Detailed compare string not found');
}

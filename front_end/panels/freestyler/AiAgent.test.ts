// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as Host from '../../core/host/host.js';
import {
  describeWithEnvironment,
} from '../../testing/EnvironmentHelpers.js';

import * as Freestyler from './freestyler.js';

const {AiAgent, ResponseType} = Freestyler;

class AiAgentMock extends AiAgent<unknown> {
  override preamble = 'preamble';

  // eslint-disable-next-line require-yield
  override async * handleContextDetails(): AsyncGenerator<Freestyler.ContextResponse, void, void> {
    return;
  }

  clientFeature: Host.AidaClient.ClientFeature = 0;
  userTier: undefined;

  options: Freestyler.AidaRequestOptions = {
    temperature: 1,
    model_id: 'test model',
  };
}

describeWithEnvironment('AiAgent', () => {
  describe('buildRequest', () => {
    beforeEach(() => {
      sinon.stub(crypto, 'randomUUID').returns('sessionId' as `${string}-${string}-${string}-${string}-${string}`);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('builds a request with a temperature', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
      });
      assert.strictEqual(
          agent.buildRequest({input: 'test input'}).options?.temperature,
          1,
      );
    });

    it('builds a request with a temperature -1', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
      });
      agent.options.temperature = -1;
      assert.strictEqual(
          agent.buildRequest({input: 'test input'}).options?.temperature,
          undefined,
      );
    });

    it('builds a request with a model id', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
      });
      assert.strictEqual(
          agent.buildRequest({input: 'test input'}).options?.model_id,
          'test model',
      );
    });

    it('builds a request with logging', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
        serverSideLoggingEnabled: true,
      });
      assert.strictEqual(
          agent.buildRequest({input: 'test input'}).metadata?.disable_user_content_logging,
          false,
      );
    });

    it('builds a request without logging', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
        serverSideLoggingEnabled: false,
      });
      assert.strictEqual(
          agent
              .buildRequest({
                input: 'test input',
              })
              .metadata?.disable_user_content_logging,
          true,
      );
    });

    it('builds a request with input', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
        serverSideLoggingEnabled: false,
      });
      const request = agent.buildRequest({input: 'test input'});
      assert.strictEqual(request.input, 'test input');
      assert.strictEqual(request.chat_history, undefined);
    });

    it('builds a request with a sessionId', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
      });
      const request = agent.buildRequest({input: 'test input'});
      assert.strictEqual(request.metadata?.string_session_id, 'session_id');
    });

    it('builds a request with preamble', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
      });
      const request = agent.buildRequest({input: 'test input'});
      assert.strictEqual(request.input, 'test input');
      assert.strictEqual(request.preamble, 'preamble');
      assert.strictEqual(request.chat_history, undefined);
    });

    it('builds a request with chat history', async () => {
      const agent = new AiAgentMock({
        aidaClient: {} as Host.AidaClient.AidaClient,
      });
      agent.chatNewHistoryForTesting = new Map([
        [
          0,
          [
            {
              type: ResponseType.QUERYING,
              query: 'test',
            },
          ],
        ],
      ]);

      const request = agent.buildRequest({
        input: 'test input',
      });

      assert.strictEqual(request.input, 'test input');
      assert.deepStrictEqual(request.chat_history, [
        {
          text: 'test',
          entity: 1,
        },
      ]);
    });
  });
});

/**
 * Slack channel adapter (v2) — uses Chat SDK bridge.
 * Self-registers on import.
 */
import { createSlackAdapter } from '@chat-adapter/slack';

import { readEnvFile } from '../env.js';
import { createChatSdkBridge } from './chat-sdk-bridge.js';
import { registerChannelAdapter } from './channel-registry.js';

registerChannelAdapter('slack', {
  factory: () => {
    const env = readEnvFile(['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET']);
    if (!env.SLACK_BOT_TOKEN) return null;
    const slackAdapter = createSlackAdapter({
      botToken: env.SLACK_BOT_TOKEN,
      signingSecret: env.SLACK_SIGNING_SECRET,
    });

    // Reply at top level in channels instead of in-thread. The default adapter
    // posts every reply with the inbound message's thread_ts, which collapses
    // each conversation under a thread the user has to expand. Channel
    // platform IDs start with C (public) or G (private); DMs start with D and
    // are left as-is so any sub-threads the user opens inside a DM behave
    // normally.
    //
    // Skip the assistant.threads.setStatus "typing" indicator on the same
    // surfaces. Slack auto-clears that status only when a message is posted
    // to the same thread; since our reply lands at top level, the in-thread
    // status would otherwise stick.
    const isChannelLike = (channel: string | undefined): boolean =>
      !!channel && !channel.startsWith('D');

    const origPostMessage = slackAdapter.postMessage.bind(slackAdapter);
    slackAdapter.postMessage = async (threadId, message) => {
      const { channel, threadTs } = slackAdapter.decodeThreadId(threadId);
      if (isChannelLike(channel) && threadTs) {
        const flat = slackAdapter.encodeThreadId({ channel, threadTs: '' });
        return origPostMessage(flat, message);
      }
      return origPostMessage(threadId, message);
    };

    const origStartTyping = slackAdapter.startTyping.bind(slackAdapter);
    slackAdapter.startTyping = async (threadId, status) => {
      const { channel } = slackAdapter.decodeThreadId(threadId);
      if (isChannelLike(channel)) return;
      return origStartTyping(threadId, status);
    };

    return createChatSdkBridge({ adapter: slackAdapter, concurrency: 'concurrent', supportsThreads: true });
  },
});

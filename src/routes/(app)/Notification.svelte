<script lang="ts">
    import { _ } from 'svelte-i18n';
    import {agent, realtime} from '$lib/stores';
    import { type AppBskyNotificationListNotifications } from '@atproto/api';
    import InfiniteLoading from 'svelte-infinite-loading';
    import {createEventDispatcher} from "svelte";
    import TimelineItem from "./TimelineItem.svelte";
    const dispatch = createEventDispatcher();
    import {getNotifications, mergeNotifications} from "$lib/components/notification/notificationUtil";
    import NotificationFollowItem from "$lib/components/notification/NotificationFollowItem.svelte";
    import {AtSign, Heart, Repeat2, UserPlus2, Filter, Reply, Quote} from 'lucide-svelte';
    import NotificationReactionItem from "$lib/components/notification/NotificationReactionItem.svelte";
    import {playSound} from "$lib/sounds";

    export let _agent = $agent;
    export let isPage = false;

    export let notifications: AppBskyNotificationListNotifications.Notification[] = [];
    export let cursor = '';

    type Filter = 'reply' | 'mention' | 'quote' | 'like' | 'repost' | 'follow';
    export let filter: Filter[] = ['like', 'repost', 'reply', 'mention', 'quote', 'follow'];
    let filters: Filter[] = ['like', 'repost', 'reply', 'mention', 'quote', 'follow'];
    let filterIcons = {
        like: Heart,
        repost: Repeat2,
        reply: Reply,
        mention: AtSign,
        quote: Quote,
        follow: UserPlus2,
    };

    export let feedPool = [];
    export let notificationGroup = [];
    export let isOnlyShowUnread = false;
    export let sound = null;
    export let lastRefresh = undefined;
    export let id = null;
    let unique = Symbol();

    async function getNotificationsFilter(setFilter: Filter[]) {
        filter = setFilter;
        notifications = [];
        notificationGroup = [];
        feedPool = [];
        cursor = '';
    }

    $: realtimeNotificationCount($realtime.data)

    async function realtimeNotificationCount(data) {
        if (!data) {
            return false;
        }

        const record = data.record;

        if (!record) {
            return false;
        }

        if (record.$type === 'app.bsky.feed.like' || record.$type === 'app.bsky.feed.repost') {
            const subjectUri = record.subject.uri;
            const subjectRepo = subjectUri.split('/')[2];

            if (subjectRepo === _agent.did()) {
                await observeRealtimeNotification();
            }
        }

        if (record.$type === 'app.bsky.graph.follow') {
            const subject = record.subject;

            if (subject === _agent.did()) {
                await observeRealtimeNotification();
            }
        }

        if (record.$type === 'app.bsky.feed.post' && typeof record.text === 'string') {
            const subjectUri = record.reply?.parent.uri ?? undefined;
            if (!subjectUri) {
                return false;
            }
            const subjectRepo = subjectUri.split('/')[2];

            if (subjectRepo === _agent.did()) {
                await observeRealtimeNotification();
            }
        }
    }

    async function observeRealtimeNotification() {
        const res = await _agent.agent.api.app.bsky.notification.getUnreadCount();
        dispatch('update', {
            count: res.data.count,
        });
        await putNotifications(res.data.count);
    }

    async function putNotifications(count) {
        if (!$realtime.isConnected) {
            return false;
        }

        if (!isPage) {
            // return false;
        }

        const res = await _agent.agent.api.app.bsky.notification.listNotifications({
            limit: 10,
            cursor: '',
        });
        const resNotifications = isOnlyShowUnread
            ? res.data.notifications.filter(notification => !notification.isRead)
            : res.data.notifications;

        const _notifications = mergeNotifications([...resNotifications, ...notifications]);
        const { notifications: newNotificationGroup, feedPool: newFeedPool } = await getNotifications(_notifications, true, _agent, feedPool || []);

        notifications = _notifications;
        notificationGroup = newNotificationGroup;
        feedPool = newFeedPool;

        if (sound) {
            playSound(notifications[0]?.indexedAt, lastRefresh, sound)
        }

        lastRefresh = new Date().toISOString();
    }

    const handleLoadMore = async ({ detail: { loaded, complete } }) => {
        const res = await _agent.agent.api.app.bsky.notification.listNotifications({
            limit: 25,
            cursor: cursor,
        });
        cursor = res.data.cursor;
        const resNotifications = isOnlyShowUnread
            ? res.data.notifications.filter(notification => !notification.isRead)
            : res.data.notifications;

        const { notifications: newNotificationGroup, feedPool: newFeedPool } = await getNotifications(resNotifications, true, _agent, feedPool);
        notifications = [...notifications, ...resNotifications];
        notificationGroup = [...notificationGroup, ...newNotificationGroup];
        feedPool = newFeedPool;

        if (cursor && resNotifications.length) {
            loaded();
        } else {
            complete();
        }
    }

    function changeFilter(filter: Filter[]) {
        getNotificationsFilter(filter);
        unique = Symbol();
        dispatch('change', {
            filter: filter,
        });
    }
</script>

<div class="notifications-wrap">
    {#if (isPage)}
        <div class="notifications-menu">
            <ul class="notifications-filter-list">
                <li class="notifications-filter-list__item">
                    <button class="notifications-filter-button"
                            on:click={() => {changeFilter(['like', 'repost', 'reply', 'mention', 'quote', 'follow'])}}
                            class:notifications-filter-button--active={JSON.stringify(filter) === JSON.stringify(['like', 'repost', 'reply', 'mention', 'quote', 'follow'])}>{$_('all')}</button>
                </li>

                <li class="notifications-filter-list__item">
                    <button class="notifications-filter-button"
                            on:click={() => {changeFilter(['reply', 'mention', 'quote'])}}
                            class:notifications-filter-button--active={JSON.stringify(filter) === JSON.stringify(['reply', 'mention', 'quote'])}
                            aria-label="Reply, Mention, and Quotes">
                        <AtSign size="18" color="var(--text-color-1)"></AtSign>
                    </button>
                </li>

                <li class="notifications-filter-list__item">
                    <button class="notifications-filter-button" on:click={() => {changeFilter(['like'])}}
                            class:notifications-filter-button--active={JSON.stringify(filter) === JSON.stringify(['like'])}
                            aria-label="Like">
                        <Heart size="18" color="var(--text-color-1)"></Heart>
                    </button>
                </li>

                <li class="notifications-filter-list__item">
                    <button class="notifications-filter-button" on:click={() => {changeFilter(['repost'])}}
                            class:notifications-filter-button--active={JSON.stringify(filter) === JSON.stringify(['repost'])}
                            aria-label="Repost">
                        <Repeat2 size="18" color="var(--text-color-1)"></Repeat2>
                    </button>
                </li>

                <li class="notifications-filter-list__item">
                    <button class="notifications-filter-button" on:click={() => {changeFilter(['follow'])}}
                            class:notifications-filter-button--active={JSON.stringify(filter) === JSON.stringify(['follow'])}
                            aria-label="Follow">
                        <UserPlus2 size="20" color="var(--text-color-1)"></UserPlus2>
                    </button>
                </li>
            </ul>
        </div>
    {:else}
        <div class="notifications-filter-display">
            <ul class="notifications-filter">
                {#each filters as item, index (item)}
                    <li class="notifications-filter__item" aria-label={$_(item)}>
                        <input class="notifications-filter__input" type="checkbox" id={id + '_' + item} bind:group={filter} value={item} on:change={() => {changeFilter(filter)}}>
                        <label class="notifications-filter__label" for={id + '_' + item}>
                            <svelte:component this={filterIcons[item]} size="20"></svelte:component>
                        </label>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}

    {#key unique}
        <div class="notifications-list">
          {#each notificationGroup as item, index (item)}
              <div class="notifications-list__item">
                  {#if item?.notifications[0]?.isRead === false}
                      <span class="notifications-list__new"></span>
                  {/if}

                  {#if (filter.includes(item.reason))}
                      {#if (item.reason === 'quote' || item.reason === 'reply' || item.reason === 'mention')}
                          <TimelineItem {_agent} data={{post: item.feed || item.notifications[0]}}></TimelineItem>
                      {:else if (item.reason === 'follow')}
                          <NotificationFollowItem {_agent} item={item.notifications[0]} {filter}></NotificationFollowItem>
                      {:else}
                          <NotificationReactionItem {_agent} {item}></NotificationReactionItem>
                      {/if}
                  {/if}
              </div>
          {/each}
        </div>

        <InfiniteLoading on:infinite={handleLoadMore}>
            <p slot="noMore" class="infinite-nomore">
                {$_('no_more')}
                {#if isOnlyShowUnread}
                    <br>({$_('only_show_unread')})
                {/if}
            </p>
            <p slot="noResults" class="infinite-nomore">
                {$_('no_results')}
                {#if isOnlyShowUnread}
                    <br>({$_('only_show_unread')})
                {/if}
            </p>
        </InfiniteLoading>
    {/key}
</div>

<style lang="postcss">
  .notifications-menu {
      margin: 0 -16px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-color-1);

      @container timeline-item (max-width: 310px) {
          padding: 0 8px;
      }
  }

  .notifications-wrap {
      height: 100%;
      display: flex;
      flex-direction: column;
  }

  .notifications-list {
      flex: 1;

      &__item {
          position: relative;
      }

      &__new {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--primary-color);
          right: -12px;
          top: 4px;
      }
  }

  .notifications-filter-list {
      list-style: none;
      display: flex;
      overflow: auto;
      white-space: nowrap;
      align-items: center;
      gap: 5px 10px;

      @container timeline-item (max-width: 320px) {
        gap: 5px;
        justify-content: space-between;
      }

      &__item {
          font-size: 14px;

          &--push {
              margin-left: auto;

              @media (max-width: 767px) {

              }
          }
      }
  }

  .notifications-filter-button {
      min-width: 40px;
      height: 30px;
      padding: 0 8px 12px;
      display: grid;
      place-content: center;
      color: var(--text-color-1);
      position: relative;

      @container timeline-item (max-width: 320px) {

      }

      &::before {
          content: '';
          display: block;
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          width: 20px;
          height: 4px;
          border-radius: 2px;
          background-color: var(--primary-color);
          margin: auto;
          transform: scaleX(0);
          transition: transform .25s cubic-bezier(0, 0, 0.18, 1);
      }

      &--active {
          &::before {
              transform: scaleX(1);
          }
      }
  }

  .notifications-filter {
      list-style: none;
      display: flex;
      justify-content: space-around;
      gap: 8px;

      &__input {
          &:checked {
              & + label {
                  color: var(--primary-color);
              }
          }
      }

      &__label {
          cursor: pointer;
          color: var(--border-color-2);
      }
  }

  .notifications-filter-display {
      border-bottom: 1px solid var(--border-color-2);
      margin: 0 -16px;
      padding: 0 16px 12px;
  }
</style>
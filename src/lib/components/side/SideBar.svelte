<script lang="ts">
    import {
        agents,
        columns,
        currentTimeline,
        settings,
        isColumnModalOpen,
        sideState,
        intersectingIndex
    } from "$lib/stores";
    import ColumnIcon from "$lib/components/column/ColumnIcon.svelte";
    import {page} from '$app/stores';
    import {Settings} from "lucide-svelte";
    import {iconMap} from "$lib/columnIcons";
    import {_} from "svelte-i18n";
    import SideNav from "$lib/components/side/SideNav.svelte";
    import SideWorkspaceModal from "$lib/components/side/SideWorkspaceModal.svelte";

    let isMobileBarOpen = false;
    let isWorkspaceModalOpen = false;

    if (!$columns[$currentTimeline]) {
        currentTimeline.set(0);
    }

    function handleColumnClick(column, index) {
        if ($settings.design.layout === 'decks') {
            if (column.scrollElement) {
                column.scrollElement.scrollIntoView({inline: 'end', behavior: 'instant'});
            }
        } else {
            if ($currentTimeline === index) {
                return false;
            }

            currentTimeline.set(index);
        }
    }

    function handleMobileBarToggle() {
        isMobileBarOpen = !isMobileBarOpen;
    }

    function handleKeydown(event) {
        if ($page.url.pathname !== '/') {
            return false;
        }

        const activeElement = document.activeElement?.tagName;
        const isInactive = (activeElement === 'BODY' || activeElement === 'BUTTON');

        if (event.key === String('d') && isInactive) {
            if ($settings.design.layout === 'decks') {
                $settings.design.layout = 'default';
            } else {
                $settings.design.layout = 'decks';
            }
        }

        if (event.key === String('h') && isInactive) {
            if ($settings.design.publishPosition === 'left') {
                $settings.design.publishPosition = 'bottom';
            } else {
                $settings.design.publishPosition = 'left';
            }
        }

        $columns.forEach((column, index) => {
            const i = index + 1;

            if (event.key === String(i) && isInactive) {
                handleColumnClick(column, index)
            }
        })
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="side-bar side-bar--{$settings.design?.publishPosition}" class:side-bar--sp-open={isMobileBarOpen} on:click={() => {isMobileBarOpen = false}}>
  <div class="side-bar__list side-bar__top">
    {#if (!$settings.general?.hideWorkspaceButton)}
        <div class="side-workspace">
            <button class="side-workspace-button"
                    class:side-workspace-button--active={isWorkspaceModalOpen}
                    on:click={() => {isWorkspaceModalOpen = !isWorkspaceModalOpen}}
                    aria-label="ワークスペース一覧を開く"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
            </button>
        </div>
    {/if}

    {#if $page.url.pathname === '/'}
      {#if $agents.size > 0}
        <button
            class="side-bar-button"
            on:click={() => {$isColumnModalOpen = true}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bar-primary-icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-square"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
        </button>
      {/if}

      {#each $columns as column, index (column.id)}
        <button
            class="side-bar-button"
            class:side-bar-button--current={$settings.design.layout !== 'decks' && column.id === $columns[$currentTimeline].id}
            class:side-bar-button--intersecting={$intersectingIndex === index && $settings.design.layout === 'decks'}
            on:click={() => {handleColumnClick(column, index)}}
            aria-label={column.algorithm?.name}
            title={column.algorithm?.name}
        >
          {#if column.settings?.icon}
            <svelte:component this={iconMap.get(column.settings.icon)} color="var(--bar-secondary-icon-color)"></svelte:component>
          {:else}
            <ColumnIcon type={column.algorithm.type} color="var(--bar-secondary-icon-color)"></ColumnIcon>
          {/if}

          {#if (column.unreadCount)}
            <span class="side-bar-button__count">{column.unreadCount}</span>
          {/if}
        </button>
      {/each}
    {:else}
      <a
          class="side-bar-button"
          href="/"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bar-bottom-icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </a>
    {/if}
  </div>

  <div class="side-bar__list side-bar__bottom">
    {#if ($settings.design?.publishPosition !== 'left')}
      <div class="side-bar__nav">
        <SideNav></SideNav>
      </div>
    {/if}

    <a class="side-bar-button only-pc" href="/settings/general">
      <Settings color="var(--bar-bottom-icon-color)"></Settings>
    </a>

    <a class="side-bar-button only-mobile" href="/settings">
      <Settings color="var(--bar-bottom-icon-color)"></Settings>
    </a>

    {#if ($settings.design?.layout === 'decks')}
      <button class="side-bar-button" title="{$_('change_single_column_mode')}" on:click={() => {$settings.design.layout = 'default'}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bar-bottom-icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rectangle-vertical"><rect width="12" height="20" x="6" y="2" rx="2"/></svg>
      </button>
    {:else}
      <button class="side-bar-button" title="{$_('change_multi_column_mode')}" on:click={() => {$settings.design.layout = 'decks'}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bar-bottom-icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-columns"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="3" y2="21"/></svg>
      </button>
    {/if}

    {#if ($settings.design?.publishPosition !== 'left')}
      <button class="side-bar-button" title="{$_('change_default_mode')}" on:click={() => {$settings.design.publishPosition = 'left'}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bar-bottom-icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/></svg>
      </button>
    {:else}
      <button class="side-bar-button" title="{$_('change_compact_mode')}" on:click={() => {$settings.design.publishPosition = 'bottom'}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bar-bottom-icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-bottom"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="15" y2="15"/></svg>
      </button>
    {/if}
  </div>
</div>

{#if (isWorkspaceModalOpen)}
    <SideWorkspaceModal on:close={() => {isWorkspaceModalOpen = false}}></SideWorkspaceModal>
{/if}

<style lang="postcss">
  .side-bar {
      padding-top: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-bottom: 8px;
      overflow-y: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar{
          display:none;
      }

      @media (max-width: 767px) {
          display: flex;
          flex-direction: row;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 999;
          background: var(--bar-bg-color);
          backdrop-filter: blur(8px);
          height: min-content;
          padding: 0 8px;
          width: 100vw;
          overflow-x: auto;
          overflow-y: initial;
          transition: all .2s ease-in-out;
      }

      &__list {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          @media (max-width: 767px) {
              flex-direction: row;
              gap: 0;
          }
      }

      &--bottom {
          position: sticky;
          top: 0;
          height: 100vh;
          padding-top: 10px;

          @media (max-width: 767px) {
              position: fixed;
              height: min-content;
              padding: 0 8px;
          }
      }

      &--sp-open {
          @media (max-width: 767px) {
              display: none;
          }
      }
  }

  .side-bar-button {
      width: 48px;
      height: 48px;
      border-radius: 5px;
      background-color: transparent;
      display: grid;
      place-content: center;
      position: relative;

      &::before {
          content: '';
          display: block;
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--bar-current-bar-width);
          height: var(--bar-current-bar-height);
          border-radius: var(--bar-current-bar-border-radius);
          background-color: var(--bar-current-bar-color);
          margin: auto;
          transform: scaleY(0);
          transition: transform .25s cubic-bezier(0, 0, 0.18, 1);

          @media (max-width: 767px) {
              width: 20px;
              height: 4px;
              bottom: auto;
              right: 0;
          }
      }

      &--current {
          svg {
              stroke: var(--text-color-1);
          }

          &::before {
              transform: scaleY(1);
          }
      }

      &--intersecting {
          @media (max-width: 767px) {
              &::before {
                  transform: scaleY(1);
              }
          }
      }

      &__count {
          position: absolute;
          width: 16px;
          height: 16px;
          font-size: 11px;
          font-weight: bold;
          border-radius: 50%;
          background-color: var(--danger-color);
          color: var(--bg-color-1);
          display: grid;
          place-content: center;
          right: -2px;
          top: -2px;

          @media (max-width: 767px) {
              top: 4px;
              right: 2px;
              width: 14px;
              height: 14px;
              font-size: 10px;
          }
      }
  }

  .side-workspace {
      position: relative;
  }

  .side-workspace-button {
      width: 40px;
      height: 40px;
      display: grid;
      place-content: center;
      border-radius: var(--border-radius-3);
      border: 1px solid var(--primary-color);
      box-shadow: rgba(0, 0, 0, 0.1) 0 4px 6px -1px, rgba(0, 0, 0, 0.06) 0 2px 4px -1px;
      background-color: var(--nav-content-bg-color);
      margin-bottom: 4px;
      transition: transform .1s ease-in-out;

      @media (max-width: 767px) {
          margin-bottom: 0;
          width: 36px;
          height: 36px;
          margin-right: 6px;
      }

      &:hover,
      &--active {
          transform: translateY(2px);
      }
  }
</style>
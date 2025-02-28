<script lang="ts">
    import { scale } from 'svelte/transition';
    import TimelineItem from "./TimelineItem.svelte";
    import { Splide, SplideSlide } from '@splidejs/svelte-splide';
    import '@splidejs/svelte-splide/css';
    import {createEventDispatcher, onMount} from 'svelte';
    import { beforeNavigate } from "$app/navigation";
    import {agent} from "$lib/stores";
    const dispatch = createEventDispatcher();
    import { afterNavigate } from "$app/navigation";

    export let _agent = $agent;
    export let data;
    let el;

    function modalClose() {
        history.back();
        dispatch('close');
    }

    function handlePopstate(e) {
        document.body.classList.remove('scroll-lock');
        el.close();
        dispatch('close');
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            modalClose();
        }
    }

    beforeNavigate(async () => {
        document.body.classList.remove('scroll-lock');
    });

    onMount(() => {
        el.showModal();
    })

    afterNavigate((_navigation) => {
        if (_navigation.to?.url.hash !== '#open') {
            dispatch('close');
        }
    })
</script>

<svelte:window on:popstate={handlePopstate} on:keydown={handleKeydown}></svelte:window>

<dialog class="media-content-wrap" bind:this={el}>
  <button on:click={modalClose} class="media-content-close" aria-label="Close">
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  </button>

  <button on:click={modalClose} class="media-content-close-bg"></button>

  <div class="media-content" transition:scale="{{duration: 350, opacity: 0.5, start: 0.8}}">
    <div class="media-content__image">

      {#if (data.post.embed.images.length > 1)}

        <Splide options={ {
              gap   : '20px',
          } }>
          {#each data.post.embed.images as image}
            <SplideSlide>
              <img src="{image.fullsize}" alt="" width={image?.aspectRatio?.width} height={image?.aspectRatio?.height}>
            </SplideSlide>
          {/each}
        </Splide>
      {:else}
        {#each data.post.embed.images as image}
          <img src="{image.fullsize}" alt="" width={image?.aspectRatio?.width} height={image?.aspectRatio?.height}>
        {/each}
      {/if}
    </div>

    <div class="media-content__content">
      <TimelineItem data={data} isMedia={true} {_agent}></TimelineItem>
    </div>
  </div>
</dialog>

<style lang="postcss">
    .media-content-wrap {
        border: none;
        background-color: transparent;
        margin: auto;
        padding: 0 40px;

        &::backdrop {
            background-color: rgba(0, 0, 0, .8);
        }

        @media (max-width: 767px) {
            padding: 40px 10px 10px;
        }
    }

    .media-content-close {
        position: fixed;
        right: 20px;
        top: 15px;
        z-index: 50;
        width: 40px;
        height: 40px;
    }

    .media-content-close-bg {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    .media-content {
        display: grid;
        grid-template-columns: auto 320px;
        background-color: var(--bg-color-1);
        padding: 40px;
        gap: 40px;
        border-radius: 10px;
        overflow: auto;
        overscroll-behavior: contain;
        position: relative;
        z-index: 2;
        color: var(--text-color-1);

        @media (max-width: 959px) {
            display: block;
            padding: 10px;
            border-radius: 4px;
        }

        &__image {
            height: 100%;

            @media (max-width: 959px) {
                height: auto;
            }
        }

        &__content {

        }

        img {
            width: 100%;
            height: 100%;
            max-height: 80vh;
            object-fit: contain;

            @media (max-width: 959px) {
                height: auto;
            }
        }
    }
</style>
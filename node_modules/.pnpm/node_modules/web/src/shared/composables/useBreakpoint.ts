import { onBeforeUnmount, onMounted, ref } from 'vue';

const MOBILE_QUERY = '(max-width: 900px)';

export function useBreakpoint() {
  const isMobile = ref(false);
  let mql: MediaQueryList | undefined;

  const update = () => {
    isMobile.value = mql!.matches;
  };

  onMounted(() => {
    mql = window.matchMedia(MOBILE_QUERY);
    update();
    mql.addEventListener('change', update);
  });

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', update);
  });

  return { isMobile };
}

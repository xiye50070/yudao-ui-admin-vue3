<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DocAlert',
  inheritAttrs: false,
  props: {
    title: String,
    url: String
  },
  setup: () => () => null
})
</script>

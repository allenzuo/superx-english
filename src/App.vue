<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("App Launch");
  uni.setNavigationBarTitle({
    title: '中考英语·真题吃透'
  });
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style>
page {
  background-color: #f5f5f5;
  font-size: 14px;
  line-height: 1.6;
}

view, text, button, input {
  box-sizing: border-box;
}
</style>

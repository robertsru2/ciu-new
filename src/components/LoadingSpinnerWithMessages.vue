<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner-container">
      <img src="@/assets/loading-spinner.gif" alt="Loading..." class="spinner-img" />
      <div class="loading-message">{{ currentMessage }}</div>
      <div class="loading-timer">{{ secondsElapsed }} second<span v-if="secondsElapsed !== 1">s</span></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isLoading: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      messages: [
        "Loading...",
        "Still Loading...",
        "I'm embarased that it's taking so long...",
        "Still working, please don't deactive me!"
      ],
      currentMessageIndex: 0,
      secondsElapsed: 0,
      intervalId: null,
      messageIntervalId: null
    };
  },
  computed: {
    currentMessage() {
      return this.messages[this.currentMessageIndex];
    }
  },
  watch: {
    isLoading(newVal) {
      if (newVal) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    }
  },
  mounted() {
    if (this.isLoading) {
      this.startTimer();
    }
  },
  beforeUnmount() {
    this.stopTimer();
  },
  methods: {
    startTimer() {
      this.secondsElapsed = 0;
      this.currentMessageIndex = 0;
      if (this.intervalId) clearInterval(this.intervalId);
      if (this.messageIntervalId) clearInterval(this.messageIntervalId);

      this.intervalId = setInterval(() => {
        this.secondsElapsed++;
      }, 1000);

      this.messageIntervalId = setInterval(() => {
        if (this.currentMessageIndex < this.messages.length - 1) {
          this.currentMessageIndex++;
        }
      }, 25000);
    },
    stopTimer() {
      clearInterval(this.intervalId);
      clearInterval(this.messageIntervalId);
      this.intervalId = null;
      this.messageIntervalId = null;
    }
  }
};
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255,255,255,0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.spinner-img {
  width: 120px;
  height: 120px;
}
.loading-message {
  margin-top: 24px;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
}
.loading-timer {
  margin-top: 32px;
  font-size: 1.2rem;
  text-align: center;
}
</style>
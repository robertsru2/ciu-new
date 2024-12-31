<template>
  <div class="container">
    <div class="header">
      <div class="logo-header">
        <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png">
        <h2 class="page-heading">{{ pageHeading }}</h2>
      </div>
      <div class="maintenance">
        <div>
          <router-link :to="{ name: 'ProviderPageNew' }">Provider Settings</router-link>
        </div>
      </div>
    </div>
  </div> 
</template>

<script>
export default {
  data() {
    return {
      pageHeading: 'DOM CIU Maintenance',
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.logo-header {
  display: flex;
  align-items: center;
}
.logo {
  width: 100px;
  height: auto;
}
.page-heading {
  margin-left: 10px;
}
.maintenance {
  margin-top: 20px;
}
</style>
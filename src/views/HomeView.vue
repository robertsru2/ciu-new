<template>
  <div class="home">
    <img alt="National Jewish Health" src="../assets/NJ_Logo.png">
    <HelloWorld msg="Welcome to the Department of Medicine Dashboard Applicaiton"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'HomeView',
  components: {
    HelloWorld
  }
}
</script>

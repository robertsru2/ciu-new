<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/dom-dashboard">DOM KPI Dashboards</router-link>
      <router-link to="/ciu-reports">CIU Reports</router-link>
      <router-link to="/ciu-maintenance">CIU Maintenance</router-link>
      <router-link to="/login">Login</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #333;
  padding: 20px;
}

nav {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

nav a {
  font-weight: 500;
  color: #333;
  text-decoration: none;
  padding: 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s, color 0.3s;
}

nav a:hover {
  background-color: #f0f0f0;
}

nav a.router-link-exact-active {
  background-color: #42b983;
  color: white;
}
</style>
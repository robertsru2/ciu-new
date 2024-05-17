<template>
  <div class="container">
    <div class="header">
      <div class="logo-header">
        <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png">
        <h2 class="page-heading">{{ pageHeading }}</h2>
      </div>
      <div class="dashboard">
        <div> <router-link :to="{ name: 'CIUDashboard' }">CIU Dashboard</router-link></div>
        <div> <router-link :to="{ name: 'FillRateDashboard' }">Fill Rate Dashboard</router-link> </div>
        <div> <router-link :to="{ name: 'ProviderTimeReport' }">Provider Time Report</router-link> </div> 
        <div> <router-link :to="{ name: 'ClinicFillDashboard' }">2-Week Clinic Fill Report</router-link> </div>         
      </div>
    </div>
  </div> 
</template>

<script>

export default {
  data() {
      return {
        pageHeading: 'Fill Rate Dashboard',
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
  flex-direction: row;
  align-items: center;
  padding-right: 60px; /* Adjust this value as needed */
}

.page-heading {
  margin-left: 10px;
  padding-left: 60px;
}

.dashboard {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: 20px; /* Adjust this value as needed */
}
</style>
<template>
  <div>
    <img alt="National Jewish Health" src="../assets/NJ_Logo.png">
    <h1> Department of Medicine KPI Dashboards</h1>
    <p>This is the DOM KPI Dashboard Page.</p>
    <div class="dashboard">
      <div> <router-link :to="{ name: 'CIUDashboard' }">CIU Dashboard</router-link></div>
      <div> <router-link :to="{ name: 'FillRateDashboard' }">Fill Rate Dashboard</router-link> </div>
      <div> <router-link :to="{ name: 'ProviderTimeReport' }">Provider Time Report</router-link> </div> 
    </div>
  </div>
</template>
  
  <!-- ... -->
  
  <style scoped>
  .container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .multiselect-container {
    max-height: 50vh;
    max-width: 50vw;
    overflow: auto;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    padding: 0.5rem;
    margin-bottom: 1rem;
    background-color: #fff;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    transition: box-shadow 0.3s ease-in-out;
  }
  
  .b-button {
    align-self: center;
    background-color: #007bff;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    transition: background-color 0.3s ease-in-out;
  }
  
  .form-check-label {
    transition: background-color 0.3s ease-in-out;
  }
  
  .form-check-label:hover {
    background-color: #f8f9fa;
  }
  </style>
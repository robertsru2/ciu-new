<template>
    <div class="container">
      <div class="multiselect-container">
        <div class="form-check" v-for="file in files" :key="file.value">
          <input class="form-check-input" type="checkbox" :value="file.value" v-model="selectedFiles">
          <label class="form-check-label">{{ file.text }}</label>
        </div>
      </div>
      <b-button @click="printReports" variant="primary">Print Reports</b-button>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    data() {
      return {
        files: [],
        selectedFiles: []
      }
    },
    async created() {
      try {
        const response = await axios.get('http://localhost:8000/cius')
        console.log('Response:', response.data) // Log the response data
        this.files = response.data.map(file => ({ text: file, value: file }))
        this.selectedFiles = this.files.map(file => file.value)
      } catch (error) {
        console.error(error)
      }
    },
    methods: {
      printReports() {
        // Use this.selectedFiles to print the selected reports
      }
    }
  }
  </script>
  
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
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.3s ease-in-out;
}
</style>
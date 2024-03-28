<template>
    <div>
        <h1>CIU Reports</h1>
        <p>
            This is the CIU Reports page.
        </p>
    </div>
    <div class="container">
      <div class="report-creation">
      <input type="date" v-model="startDate" min="2023-07-01" class="date-input">
      <input type="date" v-model="endDate" min="2023-07-01" class="date-input">
      <b-button @click="createReports" variant="primary">Create Reports</b-button>
      </div>        
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
  import config from '../../config'; // adjust the path according to your file structure
  console.log(config.start_date)
  
  export default {
    data() {
      return {
        files: [],
        selectedFiles: [],
        startDate: config.start_date
      }
    },
    async created() {
      try {
        console.log('Before axios.get')
        const response = await axios.get('http://localhost:8000/load_files')
        console.log('After axios.get')
        console.log('Response:', response.data)
        this.files = response.data.map(file => ({ text: file, value: file }))
        this.selectedFiles = this.files.map(file => file.value)
      } catch (error) {
        console.error(error)
      }
    },
    methods: {
        async printReports() {
        try {
            const response = await axios.post('http://localhost:8000/print_cius', {
            selectedFiles: this.selectedFiles
            })
            console.log('Response:', response.data)
            // Handle the response
        } catch (error) {
            console.error('Error:', error)
            // Handle the error
        }
        },
        async createReports() {
            // Use this.startDate and this.endDate to create reports
            try {
            const response = await axios.post('http://localhost:8000/create_cius', {
            startDate: this.startDate,
            endDate: this.endDate
            })
            console.log('Response:', response.data)
            // Handle the response
        } catch (error) {
            console.error('Error:', error)
            // Handle the error
        }
             
        },

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
.form-check-label {
  transition: background-color 0.3s ease-in-out;
}

.form-check-label:hover {
  background-color: #f8f9fa; /* Change this color to your preference */
}
.b-button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.3s ease-in-out;
}

.report-creation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #ced4da;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.date-input {
  margin-right: 1rem;
}
</style>
<template>
  <div class="container">
    <div class="header">
      <div class="logo-header">
        <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png">
      </div>
      <div class="multiselect-container">
        <h2 class="page-heading">{{ pageHeading }}</h2>
        <div class="date-inputs">
          <label>Start Date: 
            <input 
              type="date" 
              v-model="startDate" 
              class="date-input"
            >
          </label>
          <label>End Date: 
            <input 
              type="date" 
              v-model="endDate" 
              class="date-input"
            >
          </label>
        </div>
        <div class="button-progress-container">
          <div class="button-container">
            <button class="b-button" @click="submitReport" :disabled="isLoading">
              {{ isLoading ? 'Loading...' : 'Submit' }}
            </button>
          </div>
          <div class="progress-bar-container">
            <p :class="{ 'red-text': progress.step === 'API Server Down' || progress.step.startsWith('Failed') }">
              {{ progress.step }}
            </p> 
          </div>
        </div> 
      </div> 
    </div> 

    <div class="content-area">
      <div v-if="reportData.length > 0" class="table-container">
        <h3>Lag Time Report Results</h3>
        <div class="table-info">
          <p><strong>Status:</strong> {{ reportStatus }}</p>
          <p><strong>Message:</strong> {{ reportMessage }}</p>
          <p><strong>Rows Processed:</strong> {{ dataInfo.rows_processed }}</p>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="column in dataInfo.columns" :key="column">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in reportData" :key="index">
              <td>{{ formatDateTime(row.RunDate) }}</td>
              <td>{{ row.Department }}</td>
              <td>{{ row.VisitType }}</td>
              <td>{{ formatDateTime(row['1st Date Available']) }}</td>
              <td>{{ row['1st Provider'] }}</td>
              <td>{{ row['1st Block Type'] }}</td>
              <td>{{ formatDateTime(row['2nd Date Available']) }}</td>
              <td>{{ row['2nd Provider'] }}</td>
              <td>{{ row['2nd Block Type'] }}</td>
              <td>{{ formatDateTime(row['3rd Date Available']) }}</td>
              <td>{{ row['3rd Provider'] }}</td>
              <td>{{ row['3rd Block Type'] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div> 
  </div> 
</template>

<script>
import axios from 'axios';

export default {
  data() {
    // Calculate default dates
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 180);

    return {
      pageHeading: 'Lag Time Report',
      startDate: this.formatDateOnly(startDate),
      endDate: this.formatDateOnly(endDate),
      progress: { step: 'Ready to generate report' },
      isLoading: false,
      reportData: [],
      reportStatus: '',
      reportMessage: '',
      dataInfo: {
        rows_processed: 0,
        columns: []
      }
    };
  },
  methods: {
    formatDateOnly(date) {
      // Format date for date input (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '';
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    },

    async submitReport() {
      try {
        this.isLoading = true;
        this.progress.step = 'Generating lag time report...';
        this.reportData = []; // Clear previous data

        const reportRequest = {
          startDate: this.startDate,
          endDate: this.endDate
        };

        console.log('Lag Time Report Request:', reportRequest);

        const response = await axios.post('http://localhost:8000/lagtime', reportRequest);
        
        console.log('Lag Time Report Response:', response.data);

        if (response.data && response.data.status === 'success') {
          this.reportStatus = response.data.status;
          this.reportMessage = response.data.message;
          this.dataInfo = response.data.data_info;
          this.reportData = response.data.data || [];
          this.progress.step = `Report generated successfully - ${this.dataInfo.rows_processed} rows processed`;
        } else {
          throw new Error('Invalid response format from server');
        }

      } catch (error) {
        console.error('Failed to generate lag time report:', error);
        this.progress.step = `Failed to generate report: ${error.message}`;
        this.reportData = [];
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.logo {
  width: 150px;
  height: auto;
  margin-right: 1rem;
  margin-bottom: 1.5rem;
}

.logo-header {
  display: flex;
  align-items: center;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.multiselect-container {
  max-height: 70vh;
  max-width: 70vw;
  overflow: auto;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  padding: 0.5rem;
  margin-bottom: 1rem;
  background-color: #fff;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s ease-in-out;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.date-inputs {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.date-input {
  margin-left: 0.5rem;
  padding: 0.25rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.button-progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.button-container {
  display: flex;
  justify-content: center;
}

.progress-bar-container {
  text-align: center;
  padding: 0 1rem;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.page-heading {
  text-align: center;
  margin-bottom: 1rem;
}

.content-area {
  width: 100%;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.table-container {
  width: 95%;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.table-info {
  background-color: #f8f9fa;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
  border: 1px solid #dee2e6;
}

.table-info p {
  margin: 0.25rem 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.data-table th,
.data-table td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
  vertical-align: top;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.data-table tr:hover {
  background-color: #e9ecef;
}

.b-button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.3s ease-in-out;
  cursor: pointer;
}

.b-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.b-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.red-text {
  color: red;
}

/* Responsive design */
@media (max-width: 768px) {
  .multiselect-container {
    max-width: 95vw;
  }
  
  .date-inputs {
    flex-direction: column;
    align-items: center;
  }
  
  .table-container {
    width: 100%;
  }
  
  .data-table {
    font-size: 0.875rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 6px;
  }
}
</style>
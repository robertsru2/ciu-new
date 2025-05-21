<template>
  <div class="container">
    <!-- Header section remains unchanged -->
    <div class="header">
      <div class="logo-header">
        <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png" ref="logoImage">
      </div>
      <div class="multiselect-container">
         <h2 class="page-heading">{{ pageHeading }}</h2>
        <div class="date-inputs">
          <label>Start Date: <input type="date" v-model="startDate" min="2023-07-01" class="date-input"></label>
          <label>End Date: <input type="date" v-model="endDate" min="2023-07-01" class="date-input"></label>
          <input type="checkbox" id="includePriorYears" v-model="includePriorYears">
          <label for="includePriorYears">Include Prior Years</label>
        </div>
        <label>Department:
          <select v-model="selectedDepartment" @change="clearOtherSelections('department')">
            <option disabled value="">Select Department</option>
            <option v-for="department in filteredDivisions" :key="department.DepartmentLevel" :value="department.DepartmentLevel">{{ department.DepartmentLevel }}</option>
          </select>
        </label>
        <label>Division:
          <select v-model="selectedDivision" @change="clearOtherSelections('division')">
            <option disabled value="">Select Division</option>
            <option v-for="division in divisions" :key="division.DivisionNM" :value="division.DivisionNM">{{ division.DivisionNM }}</option>
          </select>
        </label>
        <label>Provider Type:
          <select v-model="selectedProviderType" @change="clearOtherSelections('providerType')">
            <option disabled value="">Select Provider Type</option>
            <option v-for="(doctorDegrees, category) in uniqueCategories" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>
        <div class="button-progress-container">
          <div class="button-container">
            <button class="b-button" @click="createReport">Submit</button>
          </div>
          <div class="progress-bar-container">
            <p :class="{ 'red-text': progress.step === 'API Server Down' || progress.step.startsWith('Failed') }">{{ progress.step }}</p> 
          </div> 
          <div v-if="isLoading" class="loading-spinner">
            <img src="../assets/loading-spinner.gif" alt="Loading..." class="scaled">
          </div>
          <div class="download-button">
            <button class="b-button" @click.stop="downloadData">Download Data</button>
          </div>
          <div class="print-button">
            <button class="b-button" @click="printToPDF">Print to PDF</button> 
          </div>
        </div> 
      </div> 
    </div> 

    <!-- Updated content area with paired image-table data -->
    <div class="content-area">
      <!-- Show each image-table pair in sequence -->
      <div v-for="(pair, index) in displayPairs" :key="index" class="image-table-pair">
        <!-- Image section -->
        <div v-if="pair.imageUrl" class="image-container">
          <img :src="pair.imageUrl" :key="'display-' + pair.imageUrl" :alt="`Report Image ${index + 1}`" class="outlined-image">
          <img :src="pair.imageUrl" :key="pair.imageUrl" :ref="`reportImage${index}`" alt="Report Image for PDF" style="display: none;">
        </div>

        <!-- Table section for this image -->
        <div v-if="pair.tableData" class="table-container">
          <h3>Clinic Quadrants Data - Section {{index + 1}}</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="(column, colIndex) in getTableColumns(pair.tableData)" 
                    :key="`header-${index}-${colIndex}`" 
                    class="column-header">
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in pair.tableData" 
                  :key="`row-${index}-${rowIndex}`">
                <td v-for="(value, key, cellIndex) in row" 
                    :key="`cell-${index}-${rowIndex}-${cellIndex}`"
                    :class="getCellClass(value, key)">
                  {{ formatCellValue(value, key) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div> 
  </div> 
</template>

<script>
import axios from 'axios';
//import { jsPDF } from "jspdf";
//import autoTable from 'jspdf-autotable';

export default {
  data() {
    return {
      pageHeading: 'Clinic/Provider Quadrants Dashboard',
      departments: [],
      divisions: [],
      providertypes: [],
      selectedDepartment: '',
      selectedDivision: '',
      selectedProviderType: 'ALL',
      displayPairs: [], // New array to hold image-table pairs
      startDate: '2023-07-01',
      endDate: new Date().toISOString().substr(0, 10),
      filterIDValue: 'DOM',
      filterLevel: 'DepartmentLevel',
      progress: { current: 0, total: 0, step: 'API Server is Up' },
      includePriorYears: true,
      isLoading: false,
    };
  },
  computed: {
    filteredDivisions() {
      return this.departments.filter(department => department.DepartmentLevel === 'DOM');
    },
    uniqueCategories() {
      const categories = {};
      this.providertypes.forEach(pt => {
        if (!categories[pt.ProviderCategory]) {
          categories[pt.ProviderCategory] = [];
        }
        categories[pt.ProviderCategory].push(pt.DoctorDegreeNM);
      });
      return categories;
    }
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:8000/dashboard-ciu'); // Get the departments, divisions, providers, and provider types
      this.departments = response.data.departments;
      this.divisions = response.data.divisions;
      this.providertypes = response.data.providertypes;
      console.log('Server is up');
    } catch (error) {
      console.log('Server is down');
      this.progress.step = 'API Server Down';
    }
  },
  methods: {
    clearOtherSelections(selected) {
      if (selected === 'department') {
        this.selectedDivision = '';
        this.filterIDValue = this.selectedDepartment + (this.selectedProviderType !== 'ALL' ? '|' + this.selectedProviderType : '');
        this.filterLevel = 'DepartmentLevel' + (this.selectedProviderType !== 'ALL' ? '|' + 'ProviderCategory' : '');
      } else if (selected === 'division') {
        this.selectedDepartment = '';
        this.filterIDValue = this.selectedDivision + (this.selectedProviderType !== 'ALL' ? '|' + this.selectedProviderType : '');
        this.filterLevel = 'DivisionNM' + (this.selectedProviderType !== 'ALL' ? '|' + 'ProviderCategory' : '');
      } else if (selected === 'providerType') {
        if (this.selectedDepartment !== '') {
          this.filterIDValue = this.selectedDepartment + '|' + this.selectedProviderType;
          this.filterLevel = 'DepartmentLevel' + '|' + 'ProviderCategory';
        } else if (this.selectedDivision !== '') {
          this.filterIDValue = this.selectedDivision + '|' + this.selectedProviderType;
          this.filterLevel = 'DivisionNM' + '|' + 'ProviderCategory';
        } else {
          this.filterIDValue = 'ALL' + '|' + this.selectedProviderType;
          this.filterLevel = 'DepartmentLevel' + '|' + 'ProviderCategory';
        }
      } else {
        console.error('Invalid selection:', selected);
      }
    },
    async createReport() {
      try {
        this.isLoading = true;
        this.displayPairs = []; // Clear previous data
        
        const reportRequest = {
          startDate: this.startDate,
          endDate: this.endDate,
          filter_id_value: this.filterIDValue,
          filter_level: this.filterLevel,
          include_prior_years: this.includePriorYears
        };
        console.log('FilterID Value', this.filterIDValue);
        console.log('Filter Level', this.filterLevel);

        // Fetch data from the API
        const response = await axios.post('http://localhost:8000/clinic-quadrants', reportRequest);
        console.log('Report Response:', response.data);
        
        // Check if we have the expected data structure
        if (!response.data.img_names || !response.data.table) {
          console.error('Unexpected response format from server');
          this.progress.step = 'Failed to process server response';
          return;
        }
        
        const timestamp = new Date().getTime();
        const imgNames = response.data.img_names;
        const rawTableData = response.data.table;
        
        // Check that we have image names to process
        if (imgNames && imgNames.length > 0) {
          try {
            // Fetch image URLs
            const imgResponse = await fetch(`http://localhost:8000/dashboard-get-images/?${imgNames.map(img_name => `img_names=${encodeURIComponent(img_name)}`).join('&')}`);
            if (!imgResponse.ok) {
              throw new Error('Network response for images was not ok');
            }
            
            const imgUrls = await imgResponse.json();
            console.log('Raw Image URLs from server:', imgUrls);
            
            // Process image URLs
            const processedUrls = imgUrls.map(imgUrl => {
              return !imgUrl.startsWith('http') ? 
                `http://localhost:8000${imgUrl}?t=${timestamp}` : 
                `${imgUrl}?t=${timestamp}`;
            });
            
            // Create paired data structure
            // Assuming each image corresponds to an entry in the table data
            const pairs = [];
            for (let i = 0; i < processedUrls.length; i++) {
              const pair = {
                imageUrl: processedUrls[i],
                tableData: Array.isArray(rawTableData) && i < rawTableData.length ? 
                  rawTableData[i].table_data : null
              };
              pairs.push(pair);
            }
            
            // Update the display pairs
            this.displayPairs = pairs;
            console.log('Display pairs created:', this.displayPairs);
            
          } catch (error) {
            console.error('Error processing image data:', error);
            this.progress.step = `Failed to process images: ${error.message}`;
          }
        } else {
          console.warn('No image names returned from the server.');
        }
        
      } catch (error) {
        console.error('Failed to create report:', error);
        this.progress.step = `Failed to Create Report: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    
    // Helper methods for displaying table data
    getTableColumns(tableData) {
      if (!tableData || tableData.length === 0) return [];
      return Object.keys(tableData[0]);
    },
    
    getCellClass(value, key) {
      // Add specific classes based on column
      if (key === 'Fiscal_Year') {
        return 'year-cell';
      }
      if (key === 'Fill_Rate') {
        return 'percentage-cell';
      }
      if (key === 'Available_Time' || key === 'Filled_Time') {
        return 'numeric-cell';
      }
      if (key === 'DepartmentNM' || key === 'ProviderNM') {
        return 'text-cell';
      }
      
      // Default classification based on value type
      return {
        'numeric-cell': typeof value === 'number',
        'percentage-cell': typeof value === 'string' && value.includes('%'),
        'text-cell': typeof value === 'string' && !value.includes('%')  // Fixed this line by adding closing parenthesis
      };
    },
    
    formatCellValue(value, key) {
      if (value === null || value === undefined) return '';
      
      // Handle numbers with appropriate formatting
      if (typeof value === 'number') {
        // Format Fiscal Year as integer (no decimal places and no thousands separator)
        if (key === 'Fiscal_Year') {
          // Use Math.round to ensure it's an integer, then convert to string (not using toLocaleString)
          return Math.round(value).toString();
        }
        
        // Format percentages like Fill_Rate
        if (key === 'Fill_Rate') {
          return value.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          });
        }
        
        // Format other numbers with 2 decimal places
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
      
      return value;
    },
    
    async downloadData() {
      try {
        console.log('ClinicQuadrants downloadData method called')
        const reportRequest = {
          startDate: this.startDate,
          endDate: this.endDate,
          action: 'ClinicQuadrantsDownload',
          filter_id_value: this.filterIDValue,
          filter_level: this.filterLevel
        };
        console.log(reportRequest);
        const response = await axios.post('http://localhost:8000/dashboard-get-file/', reportRequest, {
          responseType: 'blob', // Important for creating a downloadable file
        });
        // Create a blob URL representing the data
        const url = window.URL.createObjectURL(new Blob([response.data]));

        // Create a link element and programmatically click it to start the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Clinic_Quadrants_data.csv'); // Choose a suitable filename and extension
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Failed to download data:', error);
      }
    },
    printToPDF() {
      alert('Print to PDF');
    }
  }
}
</script>

<style scoped>
.logo {
  width: 150px;
  height: auto;
  margin-right: 1rem;
}

.logo-header {
  display: flex;
  align-items: center;
}

.header {
  display: flex;
  align-items: center;
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
  margin-right: 200px;
}

.date-inputs {
  margin-bottom: 1rem;
}

.date-input {
  margin-right: 1rem;
}

.button-progress-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
}

.button-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-left: 3rem;
  margin-right: 5rem;
}

.progress-bar-container {
  flex-grow: 1;
  text-align: center;
  padding: 0 1rem;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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

.image-container {
  width: 90%;
  margin-bottom: 1.5rem;
}

.outlined-image {
  border: 2px solid #000;
  margin-bottom: 1rem;
  width: 90%;
  height: auto;
  padding: 1rem;
  box-sizing: border-box;
  border-radius: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s ease-in-out;
}

.table-container {
  width: 100%;
  margin: 1rem 0;
  overflow-x: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  border: 1px solid #dee2e6;
  padding: 10px;
  text-align: left;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.data-table .numeric-cell {
  text-align: right;
  font-family: 'Courier New', monospace;
}

.data-table .percentage-cell {
  text-align: right;
  font-weight: bold;
}

.data-table .text-cell {
  text-align: left;
}

.data-table .year-cell {
  text-align: center;
  font-family: inherit;
  font-weight: normal;
}

/* Add new styles for image-table pairs */
.image-table-pair {
  width: 90%;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed #ccc;
}

.image-table-pair:last-child {
  border-bottom: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .image-table-pair {
    width: 100%;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .data-table {
    min-width: 600px;
  }
}
</style>
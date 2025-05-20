<template>
  <div class="container">
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

    <div class="content-area">
      <div v-if="imageUrls.length > 0" class="image-container">
        <img :src="imageUrls[0]" :key="'display-' + imageUrls[0]" alt="Report Image 1" class="outlined-image">
        <img :src="imageUrls[0]" :key="imageUrls[0]" :ref="'reportImage0'" alt="Report Image for PDF" style="display: none;">
      </div>

      <div v-if="tableData" class="table-container">
        <h3>Clinic Quadrants Data</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th></th> 
              <th v-for="(col, index) in tableData.columns" :key="`header-${index}`">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rowLabel, rowIndex) in tableData.rows" :key="`row-${rowIndex}`">
              <th>{{ rowLabel }}</th> 
              <td v-for="(cell, colIndex) in tableData.cell_data[rowIndex]"
                  :key="`cell-${rowIndex}-${colIndex}`"
                  :style="{ color: tableData.cell_colors[rowIndex][colIndex] }">
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="imageUrls.length > 1" class="image-container">
        <template v-for="(imgUrl, index) in imageUrls.slice(1)" :key="imgUrl">
           <img :src="imgUrl" :alt="`Report Image ${index + 2}`" class="outlined-image">
           <img :src="imgUrl" :ref="'reportImage' + (index + 1)" alt="Report Image for PDF" style="display: none;">
        </template>
      </div>
    </div> 
  </div> 
</template>

<script>
import axios from 'axios';
//import { jsPDF } from "jspdf";
//import autoTable from 'jspdf-autotable'; // Import the plugin

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
      tableData: null,
      startDate: '2023-07-01',
      endDate: new Date().toISOString().substr(0, 10),
      filterIDValue: 'DOM',
      filterLevel: 'DepartmentLevel',
      progress: { current: 0, total: 0, step: 'API Server is Up' },
      imageUrls: [],
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
        this.imageUrls = []; // Clear previous images
        this.tableData = null; // Clear previous table data
        const reportRequest = {
          startDate: this.startDate,
          endDate: this.endDate,
          filter_id_value: this.filterIDValue,
          filter_level: this.filterLevel,
          include_prior_years: this.includePriorYears
        };
        console.log('FilterID Value', this.filterIDValue);
        console.log('Filter Level', this.filterLevel);

        const response = await axios.post('http://localhost:8000/clinic-quadrants', reportRequest);
        const timestamp = new Date().getTime();
        console.log('Report Response:', response.data);
        
        // --- Handle Images ---
        const imgNames = response.data.img_names;
        console.log('Image Names:', imgNames);
        if (imgNames && imgNames.length > 0) {
            try {
                // Modify URL construction to handle the path correctly
                const imgResponse = await fetch(`http://localhost:8000/dashboard-get-images/?${imgNames.map(img_name => `img_names=${encodeURIComponent(img_name)}`).join('&')}`);
                if (!imgResponse.ok) {
                    throw new Error('Network response for images was not ok');
                }
                const imgUrls = await imgResponse.json();
                
                // Fix the image URLs by ensuring they use the correct format
                console.group('Image URL Processing');
                console.log('Raw Image URLs from server:', imgUrls);
                const processedUrls = imgUrls.map(imgUrl => {
                    const finalUrl = !imgUrl.startsWith('http') ? 
                        `http://localhost:8000${imgUrl}?t=${timestamp}` : 
                        `${imgUrl}?t=${timestamp}`;
                    console.log(`Original URL: ${imgUrl}`);
                    console.log(`Processed URL: ${finalUrl}`);
                    return finalUrl;
                });
                console.groupEnd();
                this.imageUrls = processedUrls;
                console.log('Processed Image URLs:', this.imageUrls);
            } catch (error) {
                console.error('Error fetching images:', error);
                this.progress.step = `Failed to load images: ${error.message}`;
            }
        } else {
            console.warn('No image names returned from the server.');
        }

        // --- Handle Table Data ---
        if (response.data.table) {
            this.tableData = response.data.table;
            console.log('Table Data Received:', this.tableData);
            // Basic validation (optional)
            if (!this.tableData.columns || !this.tableData.rows || !this.tableData.cell_data || !this.tableData.cell_colors) {
                console.error('Received table data is incomplete.');
                this.tableData = null; // Invalidate if incomplete
            }
        } else {
            console.warn('No table data returned from the server.');
        }
      } catch (error) {
        console.error('Failed to create report:', error);
        this.progress.step = `Failed to Create Report: ${error.message}`;
        this.tableData = null; // Ensure table is cleared on error
        this.imageUrls = []; // Ensure images are cleared on error
      } finally { // Use finally to ensure isLoading is always set to false
        this.isLoading = false;
      }
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
  width: 90%;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.data-table th,
.data-table td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: right;
}

.data-table th:first-child {
  text-align: left;
}

.data-table thead th {
  background-color: #f8f9fa;
}

.checkbox-container {
  display: flex;
  align-items: center;
}

.red-text {
  color: red;
}

.loading-spinner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

.scaled {
  transform: scale(0.5);
  transform-origin: center;
}

.print-button {
  margin-left: 1rem;
}
</style>
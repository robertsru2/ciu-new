<template>
  <div class="container">
    <div class="header">
      <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png">
      <div class="multiselect-container">
        <h2 class="page-heading">{{ pageHeading }}</h2>
        <div class="date-inputs">
          <label>Start Date: <input type="date" v-model="startDate" min="2023-05-01" class="date-input"></label>
          <label>End Date: <input type="date" v-model="endDate" min="2023-05-01" class="date-input"></label>
            <input type="checkbox" id="includePriorYears" v-model="includePriorYears">
            <label for="includePriorYears">Include Prior Years</label>
        </div>
        <label>Department: 
          <select v-model="selectedDepartment" @change="clearOtherSelections('department')">
            <option disabled value="">Select Department</option>
            <option v-for="department in departments" :key="department.DepartmentLevel" :value="department.DepartmentLevel">{{ department.DepartmentLevel }}</option>
          </select>
        </label>

        <label>Division: 
          <select v-model="selectedDivision" @change="clearOtherSelections('division')">
            <option disabled value="">Select Division</option>
            <option v-for="division in divisions" :key="division.DivisionNM" :value="division.DivisionNM">{{ division.DivisionNM }}</option>
          </select>
        </label>

        <label>Provider: 
          <select v-model="selectedProvider" @change="clearOtherSelections('provider')">
            <option disabled value="">Select Provider</option>
            <option v-for="provider in providers" :key="provider.ProviderID" :value="provider.ProviderID">{{ provider.ProviderNM }} - {{ provider.ProviderID }}</option>
          </select>
        </label>
        <label>ProviderType: 
          <select v-model="selectedProviderType" @change="clearOtherSelections('providerType')">
            <option disabled value="">Select Provider Type</option>
            <!--<option v-for="providerType in providertypes" :key="providerType.DoctorDegreeNM" :value="providerType.DoctorDegreeNM">{{ providerType.DoctorDegreeNM }}</option> -->
            <option v-for="(doctorDegrees, category) in uniqueCategories" :key="category" :value="category">{{ category }}</option>
          </select>  
        </label>      
        <div class="button-progress-container">
          <div class="button-container">
            <button class="b-button" @click="createReport">Submit</button>
          </div>
          <div class="progress-bar-container">
            <p :class="{ 'red-text': progress.step === 'API Server Down' }">{{ progress.step }}</p>
            <progress :value="progress.current" :max="progress.total"></progress>
            <p>{{ progress.current }} / {{ progress.total }}</p>
          </div>
          <div class = "download-button">
            <!-- Add a button that triggers the download when clicked -->
            <button class="b-button" @click="downloadData">Download Data</button>      
          </div>
        </div>
      </div>
    </div>
    <div class="selection-string">
      <p>Filter ID Value: {{ filterIDValue }}</p>
      <p>Filter Level: {{ filterLevel }}</p>
    </div>
    <div>
      <label>Results 
      <!-- Other template content -->
      <div ref="htmlContainer" v-html="htmlResponse"></div> <!-- Render the HTML content -->
      </label> 
  </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      htmlResponse: '', // Add a data property to store the HTML content
      pageHeading: 'Provider Block Time Report',
      departments: [],
      divisions: [],
      providers: [],
      providertypes: [],
      selectedDepartment: 'DOM',
      selectedDivision: '',
      selectedProvider: '',
      selectedProviderType: 'ALL',    // ALL is the defaul value
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().substr(0, 10),
      endDate: (() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 6);
        return date.toISOString().substr(0, 10);
      })(),
      filterIDValue: 'DOM',
      filterLevel: 'DepartmentLevel',       // DepartmentLevel, DivisionNM, ProviderID
      progress: { current: 0, total: 0, step: 'Report Creation Progress Bar' },
      imageName: '',
      includePriorYears: true,
    }
  },
   computed: {
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
      const response = await axios.get('http://localhost:8000/dashboard-ciu'); // replace with your server's URL
        this.departments = response.data.departments;
        this.divisions = response.data.divisions;
        this.providers = response.data.providers;
        this.providertypes = response.data.providertypes;
        console.log('Server is up');
      } catch (error) {
        console.log('Server is down');
        this.progress.step = 'API Server Down';
      }
    },
    methods: {
      loadExternalScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },
      clearOtherSelections(selected) {
        if (selected === 'department') {
          this.selectedDivision = '';
          this.selectedProvider = '';
          this.filterIDValue = this.selectedDepartment + (this.selectedProviderType !== 'ALL' ? '|' + this.selectedProviderType : '');
          this.filterLevel = 'DepartmentLevel' + (this.selectedProviderType !== 'ALL' ? '|' + 'ProviderCategory' : '');          
        } else if (selected === 'division') {
          this.selectedDepartment = '';
          this.selectedProvider = '';
          this.filterIDValue = this.selectedDivision  + (this.selectedProviderType !== 'ALL' ? '|' + this.selectedProviderType : '')
          this.filterLevel = 'DivisionNM' + (this.selectedProviderType !== 'ALL' ? '|' + 'ProviderCategory' : '')
        } else if (selected === 'provider') {
          this.selectedProviderType = '';
          this.selectedDepartment = ''; 
          this.selectedDivision = '';
          this.selectedProviderType = '';
          this.filterIDValue = this.selectedProvider;
          this.filterLevel = 'BillingProviderID'; 
        } else if (selected === 'providerType') {
            this.selectedProvider = '';
            if (this.selectedDepartment !== '') {
              this.filterIDValue =  this.selectedDepartment + '|' + this.selectedProviderType ;
              this.filterLevel = 'DepartmentLevel' + '|' + 'ProviderCategory'; 
            }
            else if (this.selectedDivision !== '') {
              this.filterIDValue =  this.selectedDivision + '|' + this.selectedProviderType ;
              this.filterLevel = 'DivisionNM' + '|' + 'ProviderCategory'; 
            }
            else {
              this.filterIDValue =  'ALL' + '|' + this.selectedProviderType ;
              this.filterLevel = 'DepartmentLevel' + '|' + 'ProviderCategory'; 
            }
        }
      },
      validateDates() {
        if (this.startDate && this.endDate && this.startDate > this.endDate) {
          this.errorMessage = 'End date must be later than start date.';
        } else {
          this.errorMessage = '';
          this.createReport();
        }
      },
      async createReport() {
        try {
          const reportRequest = {
            startDate: this.startDate,
            endDate: this.endDate,
            filter_id_value: this.filterIDValue,
            filter_level: this.filterLevel,
            include_prior_years: this.includePriorYears
          };
          const response = await axios.post('http://localhost:8000/get-block-data/', reportRequest);
          console.log('Block Response Data:', response.data);

          if (!response.data) {
            throw new Error('Invalid response structure returned from the server');
          }

          this.htmlResponse = response.data;
          console.log('HTML Response:', this.htmlResponse);

          this.$nextTick(() => {
            // Clean up any existing DataTable resources
            this.cleanupDataTable();
            
            // Load standard DataTables
            this.loadStandardDataTables();
          });
          
          this.progress.step = 'Report Created Successfully';
        } catch (error) {
          console.error('Failed to create report:', error);
          this.progress.step = 'Failed to Create Report';
        }
      },
      cleanupDataTable() {
        // Remove existing DataTable CSS
        const existingCSS = document.querySelectorAll('link[href*="datatables"], link[href*="dt_bundle"]');
        existingCSS.forEach(link => link.remove());
        
        // Remove existing DataTable scripts
        const existingScripts = document.querySelectorAll('script[src*="datatables"], script[src*="dt_bundle"], script[src*="jquery"]');
        existingScripts.forEach(script => script.remove());
        
        // Destroy existing DataTable instances
        if (window.$ && window.$.fn.DataTable) {
          window.$('table.dataTable').DataTable().destroy();
        }
      },
      loadStandardDataTables() {
        // Load CSS first
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css';
        document.head.appendChild(cssLink);

        // Load jQuery if not already loaded
        if (!window.jQuery) {
          const jqueryScript = document.createElement('script');
          jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
          jqueryScript.onload = () => {
            this.loadDataTablesScript();
          };
          document.head.appendChild(jqueryScript);
        } else {
          this.loadDataTablesScript();
        }
      },
      loadDataTablesScript() {
        const dtScript = document.createElement('script');
        dtScript.src = 'https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js';
        dtScript.onload = () => {
          // Wait a bit for the DOM to be ready
          setTimeout(() => {
            this.initializeStandardDataTable();
          }, 100);
        };
        document.head.appendChild(dtScript);
      },
      initializeStandardDataTable() {
        // Extract the dynamic ID from the HTML response
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.htmlResponse, 'text/html');
        const tableElement = doc.querySelector('table');
        const dynamicId = tableElement ? tableElement.id : null;

        if (!dynamicId) {
          console.log('Failed to extract dynamic ID from the HTML response');
          throw new Error('Failed to extract dynamic ID from the HTML response');
        }

        // Extract the data from the response
        const tableData = JSON.parse(tableElement.getAttribute('data-table-data'));

        // Convert the data to a format that can be used in the script
        const data = tableData.map((item, index) => [
          index,
          item.ProviderID,
          item.ProviderName,
          item.UnavailableReasonDescription,
          item.BlockDate,
          item.BlockedHours,
          item.PayrollBlockedHours
        ]);

        // Initialize DataTable with jQuery
        const initScript = document.createElement('script');
        initScript.textContent = `
          $(document).ready(function() {
            // Destroy any existing DataTable on this element
            if ($.fn.DataTable.isDataTable('#${dynamicId}')) {
              $('#${dynamicId}').DataTable().destroy();
            }
            
            // Initialize new DataTable
            $('#${dynamicId}').DataTable({
              "data": ${JSON.stringify(data)},
              "pageLength": 10,
              "lengthMenu": [10, 25, 50, 100],
              "pagingType": "full_numbers",
              "order": [],
              "language": {
                "paginate": {
                  "first": "First",
                  "last": "Last",
                  "next": "Next",
                  "previous": "Previous"
                }
              },
              "dom": '<"top"lf>rt<"bottom"ip><"clear">',
              "columnDefs": [
                { "orderable": true, "targets": "_all" }
              ],
              "responsive": true
            });
          });
        `;
        document.body.appendChild(initScript);
      },
      async downloadData() {
        try {
          console.log('downloadData method called')
          const reportRequest = {
            startDate: this.startDate,
            endDate: this.endDate,
            action: 'BlockReportDownloadData',
            filter_id_value: this.filterIDValue,
            filter_level: this.filterLevel
          };
          console.log(reportRequest)
          const response = await axios.post('http://localhost:8000/dashboard-get-file/', reportRequest, {
            responseType: 'blob', // Important for creating a downloadable file
          });
          // Create a blob URL representing the data
          const url = window.URL.createObjectURL(new Blob([response.data]));

          // Create a link element and programmatically click it to start the download
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'data.csv'); // Choose a suitable filename and extension
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Failed to download data:', error);
        }
      },
    },
  }
</script>

<style scoped>
.logo {
  width: 150px;
  height: auto;
  margin-right: 1rem;
}

.header {
  display: flex;
  align-items: center;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center-start;
}

.multiselect-container, .progress-container2 {
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

.form-check-label {
  transition: background-color 0.3s ease-in-out;
}

.form-check-label:hover {
  background-color: #f8f9fa;
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

.report-container {
  display: flex;
  align-items: center;
}

.progress-container {
  margin-left: 200px;
}

.button-container {
  display: flex;
  justify-content: space-between;
}

.image-container {
  width: 100%;
  overflow: auto;
}

.button-progress-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.button-container {
  margin-bottom: 1rem;
  padding-left: 3rem;
  margin-right: 5rem;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.header {
  display: flex;
  align-items: center;
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

.page-heading {
  text-align: center;
  margin-bottom: 1rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
}

.red-text {
  color: red;
}

/* Minimal DataTable container styling - let DataTables handle the rest */
:deep(.dataTables_wrapper) {
  margin-top: 1rem;
}

/* Ensure proper spacing for DataTable elements */
:deep(.dataTables_length) {
  float: left;
}

:deep(.dataTables_filter) {
  float: right;
}

:deep(.dataTables_info) {
  float: left;
  padding-top: 8px;
}

:deep(.dataTables_paginate) {
  float: right;
  padding-top: 8px;
}
</style>

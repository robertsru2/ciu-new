<template>
  <div class="container">
    <div class="header">
      <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png">
      <div class="multiselect-container">
        <h2 class="page-heading">{{ pageHeading }}</h2>
        <div class="date-inputs">
          <label>Start Date: <input type="date" v-model="startDate" min="2023-07-01" class="date-input"></label>
          <label>End Date: <input type="date" v-model="endDate" min="2023-07-01" class="date-input"></label>
          <input type="checkbox" id="includePriorYears" v-model="includePriorYears">
          <label for="includePriorYears">Include Prior Years</label>
        </div>
        <label>Division: 
          <select v-model="selectedDivision" @change="clearOtherSelections('division')">
            <option disabled value="">Select Division</option>
            <option v-for="division in filteredDivisions" :key="division.DivisionNM" :value="division.DivisionNM">{{ division.DivisionNM }}</option>
          </select>
        </label>
        <label>Provider: 
          <select v-model="selectedProvider" @change="clearOtherSelections('provider')">
            <option disabled value="">Select Provider</option>
            <option v-for="provider in filteredProviders" :key="provider.ProviderID" :value="provider.ProviderID">{{ provider.ProviderNM }} - {{ provider.ProviderID }}</option>
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
      pageHeading: 'Neuro Psychology Dashboard',
      providers: [],
      config: null,    // Stores the config.json data
      divisions: [],
      selectedDivision: 'Neurology',
      selectedProvider: '',
      startDate: '2023-07-01',
      endDate: new Date().toISOString().substr(0, 10),
      filterIDValue: 'Neurology', 
      filterLevel: 'DivisionNM',  
      progress: { current: 0, total: 0, step: 'Report Creation Progress Bar' },
      imageName: '',
      includePriorYears: true,
    }
  },
    computed: {
    filteredDivisions() {
      return this.divisions.filter(division => division.DivisionNM === 'Neurology');
    },
 
  },
  async mounted() {
    await this.fetchConfig();
    // Assuming you have a method to fetch providers
    // await this.fetchProviders();
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:8000/dashboard-ciu'); // replace with your server's URL
        this.divisions = response.data.divisions;
        this.providers = response.data.providers;
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
        if (selected === 'division') {
          this.selectedDepartment = '';
          this.selectedProvider = '';
          this.selectedProviderType = '';
          this.filterIDValue = this.selectedDivision    // + '|' + this.selectedProviderType;
          this.filterLevel = 'DivisionNM'       // |ProviderType';
        } else if (selected === 'provider') {
          this.selectedProviderType = '';
          this.selectedDepartment = ''; 
          this.selectedDivision = '';
          this.selectedProviderType = '';
          this.filterIDValue = this.selectedProvider;
          this.filterLevel = 'BillingProviderID'; 
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
          const response = await axios.post('http://localhost:8000/neuro-psych-dashboard/', reportRequest);
          console.log('Response Data:', response.data);

        // Check if response.data is null or does not contain the html property
        if (!response.data) {
          throw new Error('Invalid response structure');
        }

        // Insert the HTML content into the DOM
        this.htmlResponse = response.data; // response.data contains the HTML content
        console.log('HTML Response:', this.htmlResponse);

        this.$nextTick(() => {
          // Inject the CSS
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://www.unpkg.com/dt_for_itables@2.0.11/dt_bundle.css';
          document.head.appendChild(cssLink);

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
            item.ProviderNM,
            item.DepartmentNM,
            item.Year,
            item.Quarter,
            item.Month,
            item.GrossBillings,
            item.HistoricRVUs,
            item.Patients_Seen,
            item.Follow_Ups,
            item.News,
            item.News_Hours,
            item.Followup_Hours,
            item.Extended_Patient_Visits
          ]);
          console.log(data);
          // Inject the JavaScript module
          const script = document.createElement('script');
          script.type = 'module';
          script.textContent = `
            import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.11/dt_bundle.js';
            document.querySelectorAll("#${dynamicId}:not(.dataTable)").forEach(table => {
              const data = ${JSON.stringify(data)};
              let dt_args = {"layout": {"topStart": "pageLength", "topEnd": "search", "bottomStart": "info", "bottomEnd": "paging"}, "order": []};
              dt_args["data"] = data;
              new DataTable(table, dt_args);
            });
          `;
          document.body.appendChild(script);
        });
        this.progress.step = 'Report Created Successfully';
        } catch (error) {
            console.error('Failed to create report:', error);
            this.progress.step = 'Failed to Create Report';
        }
        },
      async downloadData() {
        try {
          console.log('downloadData method called')
          const reportRequest = {
            startDate: this.startDate,
            endDate: this.endDate,
            action: 'NeuroPsychReportDownloadData',
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
          link.setAttribute('download', 'neuro_psych_data.xlsx'); // Choose a suitable filename and extension
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Failed to download data:', error);
        }
      },
      async fetchConfig() {
        try {
            const response = await axios.get('/path/to/config.json');
            this.config = response.data;
        } catch (error) {
            console.error('Failed to load config:', error);
        }
      },
      filteredProviders() {
      if (!this.config) {
        return [];
      }
      const allowedProviderIDs = this.config.neuro_psych_providr_ids;
      return this.providers.filter(provider => allowedProviderIDs.includes(provider.ProviderID));
    }      
    },
  }
</script>

  <!-- ... -->
<style scoped>
.logo {
  width: 150px; /* Adjust as needed */
  height: auto; /* This will maintain the aspect ratio */
  margin-right: 1rem; /* Add some space between the logo and the multiselect-container */
}

.header {
  display: flex;
  align-items: center; /* This will vertically align the image and the heading */
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
.report-container {
  display: flex;
  align-items: center;
}

.progress-container {
  margin-left: 200px; /* Adjust this value as needed */
}

.button-container {
  display: flex;
  justify-content: space-between; /* Or use 'space-around' */
}

.image-container {
  width: 100%;
  overflow: auto;
}
.button-progress-container {
  display: flex;
  flex-direction: row;
  align-items: center; /* This will left-align the children */
}

.button-container {
  margin-bottom: 1rem; /* Add some space between the button and the progress bar */
  padding-left: 3rem; /* Add padding to the left side of the button */
  margin-right: 5rem; /* Add some space between the button and the progress bar */  
}
.container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.header {
  display: flex;
  align-items: center; /* This will vertically align the image and the multiselect-container */
}
.outlined-image {
  border: 2px solid #000; /* Change the color and width as needed */
  margin-bottom: 1rem; /* Add some space below the heading */
  width: 90%; /* Set the width of the image to 100% */
  height: auto; /* This will maintain the aspect ratio of the image */
  padding: 1rem; /* Add padding around the image */
  box-sizing: border-box; /* Include the border in the total width and height of the image */
  border-radius: 0.25rem; /* Add rounded corners to the image */
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); /* Add a box shadow to the image */
  transition: box-shadow 0.3s ease-in-out; /* Add a smooth transition effect to the box shadow */
}
.page-heading {
  text-align: center;
  margin-bottom: 1rem; /* Add some space below the heading */
}
.checkbox-container {
  display: flex;
  align-items: center;
}
.red-text {
  color: red;
}
</style>

<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Other head elements -->
  <link href="https://www.unpkg.com/dt_for_itables@2.0.11/dt_bundle.css" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <!-- Other scripts -->
  <script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.11/dt_bundle.js';
    window.DataTable = DataTable;
    window.$ = $;
  </script>
</body>
</html>

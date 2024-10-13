<template>
  <div class="container">
    <div class="header">
      <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png">
      <div class="multiselect-container">
        <h2 class="page-heading">{{ pageHeading }}</h2>
        <div class="date-inputs">
          <label>Start Date: <input type="date" v-model="startDate" min="2023-05-01" class="date-input"></label>
          <label>End Date: <input type="date" v-model="endDate" min="2023-07-01" class="date-input"></label>
          <input type="checkbox" id="includePriorYears" v-model="includePriorYears">
          <label for="includePriorYears">Include Prior Years</label>
        </div>
        <label>Division: 
          <select v-model="selectedDivision" @change="clearOtherSelections('division')">
            <option disabled value="">Select Division</option>
            <option v-for="division in divisions" :key="division.DivisionNM" :value="division.DivisionNM">{{ division.DivisionNM }}</option>
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
    <div class="container">
        <!-- Other template content -->
        <div class="image-container">
          <img v-for="imageName in imageNames" :src="imageName" :key="imageName" alt="Summary Report Image" class="outlined-image">
        </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      pageHeading: 'Summary Production Dashboard',
      divisions: [],
      providertypes: [],
      selectedDivision: 'AllergyImmunology',
      selectedProviderType: 'ALL',    // ALL is the defaul value
      startDate: '2023-07-01',
      endDate: new Date().toISOString().substr(0, 10),
      filterIDValue: 'AllergyImmunology',
      filterLevel: 'DivisionNM',       // DepartmentLevel, DivisionNM, BillingProviderID
      progress: { current: 0, total: 0, step: 'Report Creation Progress Bar' },
      imageNames: [], // Change to an array to store multiple image URLs
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
         if (selected === 'division') {
          this.filterIDValue = this.selectedDivision  + (this.selectedProviderType !== 'ALL' ? '|' + this.selectedProviderType : '')
          this.filterLevel = 'DivisionNM' + (this.selectedProviderType !== 'ALL' ? '|' + 'ProviderCategory' : '')
        } else if (selected === 'providerType') {
            this.selectedProvider = '';
           if (this.selectedDivision !== '') {
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
    setupSocket() {
      if (!this.socket) {
        console.error('WebSocket is not initialized');
        return;
      }
      this.socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.group("ReceivedData");
        console.log(data);
        console.groupEnd

        // Check if the received data contains an 'img_names' property
        if (data.img_names && Array.isArray(data.img_names)) {
          try {
            console.group("GetImages");
            console.log('Calling http://localhost:8000/dashboard-get-images/');
            const response = await fetch(`http://localhost:8000/dashboard-get-images/?${data.img_names.map(img_name => `img_names=${encodeURIComponent(img_name)}`).join('&')}`);
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            console.groupEnd();
            const imageUrls = await response.json();
            console.group("ReceivedImages");
            console.log('Fetched image URLs:', imageUrls); // Log the fetched image URLs
            this.imageNames = imageUrls.map(url => {
            const fullUrl = `http://localhost:8000${url}?t=${new Date().getTime()}`;
            console.log(fullUrl); // Log the URL to verify
            console.groupEnd();
            return fullUrl;
            });
          } catch (error) {
            console.error('Error fetching images:', error);
          }
        } else {
          this.progress = data;
        }
      };
        this.socket.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

        this.socket.onclose = () => {
        console.log('WebSocket connection closed');
      };
    },
    createReport() {
        if (this.socket) {
          this.socket.close();
        }

        this.socket = new WebSocket('ws://localhost:8000/summary-run-report');

        this.socket.onopen = () => {
          const reportRequest = {
            startDate: this.startDate,
            endDate: this.endDate,
            action: 'createSummaryReport',
            filter_id_value: this.filterIDValue,
            filter_level: this.filterLevel,
            include_prior_years: this.includePriorYears
          };
          this.socket.send(JSON.stringify(reportRequest));
        };
        this.setupSocket();

        // this.socket.onmessage = (event) => {
        //   const data = JSON.parse(event.data);
        //   console.log(data)
        //   // Check if the received data contains an 'img_name' property
        //   if (data.img_name) {
        //     const timestamp = new Date().getTime(); // Get the current timestamp
        //     this.imageName = `http://localhost:8000/dashboard-get-image/${data.img_name}?t=${timestamp}`;
        //   } else {
        //     this.progress = data;
        //   }
        // };

        this.socket.onerror = (event) => {
          console.error('WebSocket error:', event);
        };

        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
        };
      },
      async downloadData() {
        try {
          console.log('downloadData method called')
          const reportRequest = {
            startDate: this.startDate,
            endDate: this.endDate,
            action: 'SummaryDashboardDownloadData',
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
    mounted() {
      this.setupSocket();
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
  display: flex;
  flex-direction: column;
  align-items: center;
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
.red-text {
  color: red;
}
</style>
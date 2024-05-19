<template>
  <div class="container">
    <div class="header">
      <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png">
      <div class="multiselect-container">
        <h2 class="page-heading">{{ pageHeading }}</h2>
        <div class="date-inputs">
          <label>Start Date: <input type="date" v-model="startDate" min="2023-07-01" class="date-input"></label>
          <label>End Date: <input type="date" v-model="endDate" min="2023-07-01" class="date-input"></label>
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

        <label>Clinic: 
          <select v-model="selectedClinic" @change="clearOtherSelections('clinic')">
            <option disabled value="">Select Clinic</option>
            <option v-for="clinic in clinics" :key="clinic.DepartmentNM" :value="clinic.DepartmentNM">{{ clinic.DepartmentNM }}</option>
          </select>
        </label>
        <label>ProviderType: 
          <select v-model="selectedProviderType" @change="clearOtherSelections('providerType')">
            <option disabled value="">Select Provider Type</option>
            <option v-for="providerType in providertypes" :key="providerType.DoctorDegreeNM" :value="providerType.DoctorDegreeNM">{{ providerType.DoctorDegreeNM }}</option>
          </select>
        </label>        
        <div class="button-progress-container">
      <div class="button-container">
        <button class="b-button" @click="createReport">Submit</button>
      </div>
      <div class="progress-bar-container">
        <p>{{ progress.step }}</p>
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

</div>
<div class="image-container" style="overflow:auto">
    <img :src="imageName" alt="Report Image" class="outlined-image">
</div>
</template>
<script>
import axios from 'axios';

export default {
  data() {
    let now = new Date();
    let endDate = new Date();    
    endDate.setDate(now.getDate() + 14);
    return {
      pageHeading: '2 Week Look Ahead Clinic Fill Rate Dashboard',
      departments: [],
      divisions: [],
      providertypes: [],
      clinics: [],      
      selectedDepartment: 'DOM',
      selectedDivision: '',
      selectedClinic: '',
      selectedProviderType: 'ALL',
      startDate: now.toISOString().substr(0, 10),
      endDate: endDate.toISOString().substr(0, 10), // Use the calculated endDate here
      filterIDValue: 'DOM',
      filterLevel: 'DepartmentLevel',       // DepartmentLevel, DivisionNM, BillingProviderID
      progress: { current: 0, total: 0, step: 'Report Creation Progress Bar' },
      imageName: '',
    }
  },
  async created() {
    const response = await axios.get('http://localhost:8000/dashboard-ciu');
    this.departments = response.data.departments;
    this.divisions = response.data.divisions;
    this.providertypes = response.data.providertypes;
    this.clinics = response.data.clinics;
    },
    methods: {
      clearOtherSelections(selected) {
            if (selected === 'department') {
              this.selectedDivision = '';
              this.selectedClinic = '';
              this.filterIDValue = this.selectedDepartment + '|' + this.selectedProviderType;
              this.filterLevel = 'DepartmentLevel|DoctorDegreeNM';
            } else if (selected === 'division') { 
              this.selectedDepartment = '';
              this.selectedClinic = '';
              this.filterIDValue = this.selectedDivision + '|' + this.selectedProviderType;
              this.filterLevel = 'DivisionNM|DoctorDegreeNM';
            } else if (selected === 'clinic') {
              this.selectedDepartment = ''; 
              this.selectedDivision = '';
              this.filterIDValue = this.selectedClinic + '|' + this.selectedProviderType;
              this.filterLevel = 'DepartmentNM|DoctorDegreeNM'; 
            } else if (selected === 'providerType') {
              if (this.selectedDivision) {
                this.selectedDepartment = '';
                this.filterIDValue = this.selectedProviderType + '|' + this.selectedDivision;
                this.filterLevel = 'DoctorDegreeNM|DivisionNM'; 
              } else if (this.selectedDepartment) {
                this.selectedDivision = '';
                this.filterIDValue = this.selectedProviderType + '|' + this.selectedDepartment;
                this.filterLevel = 'DoctorDegreeNM|DepartmentLevel'; 
              } else if (this.selectedClinic) {
                this.selectedDepartment = '';
                this.selectedDivision = '';
                this.filterIDValue = this.selectedProviderType + '|' + this.selectedClinic;
                this.filterLevel = 'DoctorDegreeNM|DepartmentNM'; 
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
          createReport() {
          if (this.socket) {
              this.socket.close();
          }

          this.socket = new WebSocket('ws://localhost:8000/clinic-fill-rate-dashboard');

          this.socket.onopen = () => {
          const reportRequest = {
              startDate: this.startDate,
              endDate: this.endDate,
              action: 'createReportFillRate',
              filter_id_value: this.filterIDValue,
              filter_level: this.filterLevel
          };
          this.socket.send(JSON.stringify(reportRequest));
          };

          this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data)
            // Check if the received data contains an 'img_name' property
            if (data.img_name) {
              const timestamp = new Date().getTime(); // Get the current timestamp
              this.imageName = `http://localhost:8000/dashboard-get-image/${data.img_name}?t=${timestamp}`;
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

        async downloadData() {
 
        try {
          const reportRequest = {
              startDate: this.startDate,
              endDate: this.endDate,
              action: 'downloadFile',
              filter_id_value: this.filterIDValue,
              filter_level: this.filterLevel
          };
 
          const response = await axios.post('localhost:8000/dashboard-get-file/', reportRequest, {
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
      }
    }

</script>

  <!-- ... -->
  <style scoped>
.logo {
  width: 200px; /* Adjust as needed */
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
.download-button {
  margin-left: 200px; /* Adjust this value as needed */
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
  width: 80%; /* Set the width of the image to 100% */
  height: auto; /* This will maintain the aspect ratio of the image */
  padding: 2rem; /* Add padding around the image */
  box-sizing: border-box; /* Include the border in the total width and height of the image */
  border-radius: 0.25rem; /* Add rounded corners to the image */
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); /* Add a box shadow to the image */
  transition: box-shadow 0.3s ease-in-out; /* Add a smooth transition effect to the box shadow */
}
.page-heading {
  text-align: center;
  margin-bottom: 1rem; /* Add some space below the heading */
}
</style>
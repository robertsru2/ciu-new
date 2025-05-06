<template>
  <div class="container">
    <div class="header">
      <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png" ref="logoImage" style="display: none;">
      <div class="multiselect-container">
        <h2 class="page-heading">{{ pageHeading }}</h2>
        <div class="date-inputs">
          <label>Start Date: <input type="date" v-model="startDate" min="2023-05-01" class="date-input"></label>
          <label>End Date: <input type="date" v-model="endDate" min="2023-07-01" class="date-input"></label>
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
      <div class="button-group">
        <!-- Add a button that triggers the download when clicked -->
        <button class="b-button" @click="downloadData">Download Data</button>
        <button class="b-button" @click="printToPDF">Print to PDF</button>
      </div>

    </div>
  </div>

  </div>
  </div>
  <div class="selection-string">
      <p>Filter ID Value: {{ filterIDValue }}</p>
      <p>Filter Level: {{ filterLevel }}</p>
</div>
  <div class="image-container">
    <img :src="imageName" alt="Report Image" class="outlined-image">
  </div>
</template>
<script>
import axios from 'axios';
import { jsPDF } from "jspdf";

export default {
  data() {
    let now = new Date();
    let endDate = new Date(now.getFullYear(), now.getMonth(), 0);    
    return {
      pageHeading: 'Day of Week Visits Dashboard',
      departments: [],
      divisions: [],
      providers: [],
      providertypes: [],
      selectedDepartment: 'DOM',
      selectedDivision: '',
      selectedProvider: '',
      selectedProviderType: 'ALL',
      startDate: '2023-07-01',
      endDate: endDate.toISOString().substr(0, 10), // Use the calculated endDate here
      filterIDValue: 'DOM',
      filterLevel: 'DepartmentLevel',       // DepartmentLevel, DivisionNM, BillingProviderID
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
        this.departments = response.data.departments.filter(department => department.DepartmentLevel !== "ALL");
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
      clearOtherSelections(selected) {
        if (selected === 'department') {
          this.selectedDivision = '';
          this.selectedProvider = '';
          //this.selectedProviderType = '';
          this.filterIDValue = this.selectedDepartment + (this.selectedProviderType !== 'ALL' ? '|' + this.selectedProviderType : '');
          this.filterLevel = 'DepartmentLevel' + (this.selectedProviderType !== 'ALL' ? '|' + 'ProviderCategory' : '');          
        } else if (selected === 'division') {
          this.selectedDepartment = '';
          this.selectedProvider = '';
          this.selectedProviderType = 'ALL';
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
          createReport() {
          if (this.socket) {
              this.socket.close();
          }

          this.socket = new WebSocket('ws://localhost:8000/dow-visits-dashboard');
          this.current= 0
          this.total= 0
          this.step = 'Report Creation Progress Bar'
          
          this.socket.onopen = () => {
          const reportRequest = {
              startDate: this.startDate,
              endDate: this.endDate,
              action: 'createReportFillRate',
              filter_id_value: this.filterIDValue,
              filter_level: this.filterLevel,
              include_prior_years: this.includePriorYears
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
              action: 'fillDashboardDownload',
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
        async printToPDF() {
          console.log('printToPDF method called');
          if (!this.imageName) {
            console.log('No image to print. Creating report...');
            await this.createReport();
            if (!this.imageName) {
              console.error("Still no image to print after report creation.");
              return;
            }
          }
    
          try {
            const doc = new jsPDF('p', 'pt', 'letter');
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 40;
            const footerHeight = 40;
    
            // Load logo
            const logoImg = this.$refs.logoImage;
            let logoDataUrl = '';
            if (logoImg && logoImg.src) {
              try {
                const response = await fetch(logoImg.src);
                const blob = await response.blob();
                logoDataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
              } catch (e) { 
                console.error("Error loading logo image:", e); 
              }
            }
    
            // Add header with logo and title
            let currentY = margin;
            const logoWidth = 80;
            const logoHeight = logoImg ? (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth : 40;
            
            // Add logo on the left
            if (logoDataUrl) {
              doc.addImage(logoDataUrl, 'PNG', margin, currentY, logoWidth, logoHeight);
            }
            
            // Add title centered on the same line
            const title = "Day of Week Dashboard";
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            const titleWidth = doc.getTextWidth(title);
            doc.text(title, (pageWidth - titleWidth) / 2, currentY + logoHeight / 2 + 10);
            
            currentY += logoHeight + 20;
            
            // Add subheading
            doc.setFontSize(16);
            const subheading = `${this.filterLevel} = ${this.filterIDValue} | Date Range: ${this.startDate} To ${this.endDate}`;
            const subheadingWidth = doc.getTextWidth(subheading);
            doc.text(subheading, (pageWidth - subheadingWidth) / 2, currentY);
            
            currentY += 40; // Skip two lines
            
            // Add image
            const imageData = await this.getImageDataUrl(this.imageName);
            if (imageData) {
              const imgProps = doc.getImageProperties(imageData);
              const ratio = imgProps.width / imgProps.height;
              
              // Calculate image dimensions to fit the page
              const maxWidth = pageWidth - 2 * margin;
              const maxHeight = pageHeight - currentY - footerHeight - margin;
              
              let imgWidth = imgProps.width;
              let imgHeight = imgProps.height;
              
              // Scale to fit width
              if (imgWidth > maxWidth) {
                imgWidth = maxWidth;
                imgHeight = imgWidth / ratio;
              }
              
              // Scale to fit height if needed
              if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = imgHeight * ratio;
              }
              
              // Center the image horizontally
              const imgX = (pageWidth - imgWidth) / 2;
              doc.addImage(imageData, 'JPEG', imgX, currentY, imgWidth, imgHeight, undefined, 'FAST');
            }
            
            // Add footer
            const footerY = pageHeight - margin / 2;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            // Left-aligned date/time
            const dateTime = new Date().toLocaleString();
            doc.text(dateTime, margin, footerY);
            
            // Right-aligned page number
            const pageText = `Page 1 of 1`;
            doc.text(pageText, pageWidth - margin, footerY, { align: 'right' });
            
            // Save the PDF
            doc.save('DOW_Visits_Dashboard.pdf');
            
          } catch (error) {
            console.error('Failed to generate PDF:', error);
          }
        },
        
        // Helper function to fetch image and convert to Data URL
        async getImageDataUrl(url) {
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error(`Error loading image ${url}:`, error);
            return null;
          }
        }
      }
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
.red-text {
  color: red;
}
.button-group {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-left: 200px;
  margin-bottom: 1rem;
  padding-left: 3rem;
  margin-right: 5rem;
}

/* Hide the duplicate logo used for PDF generation */
img[style*="display: none"] {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
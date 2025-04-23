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
        <div class="button-progress-container">
          <div class="button-container">
            <button class="b-button" @click="createReport">Submit</button>
          </div>
          <div class="progress-bar-container">
            <p :class="{ 'red-text': progress.step === 'API Server Down' }">{{ progress.step }}</p>
            </div>
          <div v-if="isLoading" class="loading-spinner">
            <img src="../assets/loading-spinner.gif" alt="Loading..." class="scaled">
          </div>
          <div class = "download-button">
            <!-- Add a button that triggers the download when clicked -->
            <button class="b-button" @click.stop="downloadData">Download Data</button>      
          </div>
          <div class="print-button">
            <button class="b-button" @click="printToPDF" :disabled="imageUrls.length === 0">Print to PDF</button>
          </div>
        </div>
      </div>
    </div>
    <div class="image-container">
      <img v-for="(imgUrl, index) in imageUrls" :src="imgUrl" :key="imgUrl" :ref="'reportImage' + index" alt="Report Image" class="outlined-image" style="display: none;">
      <img v-for="imgUrl in imageUrls" :src="imgUrl" :key="'display-' + imgUrl" alt="Report Image" class="outlined-image">
    </div>
  </div> 
</template>

<script>
import axios from 'axios';
import { jsPDF } from "jspdf"; // Import jsPDF

export default {
  data() {
    return {
      pageHeading: 'Actual to Budget Dashboard',
      departments: [],
      divisions: [],
      selectedDepartment: '',
      selectedDivision: '',
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
 
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:8000/dashboard-ciu'); // Get the departments, divisions, providers, and provider types
      this.departments = response.data.departments;
      this.divisions = response.data.divisions;
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
        this.filterIDValue = this.selectedDepartment;
        this.filterLevel = 'DepartmentLevel';          
      } else if (selected === 'division') {
        this.selectedDepartment = '';
        this.filterIDValue = this.selectedDivision;
        this.filterLevel = 'DivisionNM';
      } else {
        console.error('Invalid selection:', selected);
      }
    },
    async createReport() {
      try {
        this.isLoading = true;
        const reportRequest = {
          startDate: this.startDate,
          endDate: this.endDate,
          filter_id_value: this.filterIDValue,
          filter_level: this.filterLevel,
          include_prior_years: this.includePriorYears
        };
        console.log('FilterID Value', this.filterIDValue)
        console.log('Filter Level', this.filterLevel)

        const response = await axios.post('http://localhost:8000/actual-to-budget', reportRequest);
        const timestamp = new Date().getTime(); // Get the current timestamp
        const imgNames = response.data.img_names;
        console.dir('Image Names:', imgNames); // Debugging line
        if (!imgNames || imgNames.length === 0) {
          throw new Error('No image names returned from the server');
        }        
        const imgResponse = await fetch(`http://localhost:8000/dashboard-get-images/?${imgNames.map(img_name => `img_names=${encodeURIComponent(img_name)}`).join('&')}`);
        if (!imgResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const imgUrls = await imgResponse.json();
        this.imageUrls = imgUrls.map(imgUrl => `${imgUrl}?t=${timestamp}`);      
      } catch (error) {
        console.error('Failed to create report:', error);
        this.progress.step = 'Failed to Create Report';
      }
      this.isLoading = false;
    },
    async downloadData() {
    try {
      console.log('ActualToBudget downloadData method called')
      const reportRequest = {
        startDate: this.startDate,
        endDate: this.endDate,
        action: 'ActualToBudgetDownload',
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
      link.setAttribute('download', 'Actual_Budget_data.csv'); // Choose a suitable filename and extension
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download data:', error);
    }
  },
    // --- Helper function to add Header, Sub-Heading, and Footer ---
    addHeaderFooter(doc, pageNumber, totalPages, logoDataUrl, logoImg, filterLevel, filterIDValue, startDate, endDate) {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        let currentHeaderY = margin; // Start Y position for header content

        // --- Combined Page Heading (Logo + Title) ---
        const logoWidth = 50;
        const logoHeight = logoImg ? (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth : 25;
        const titleText = "Actual to Budget Dashboard";
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        const titleWidth = doc.getTextWidth(titleText);
        const totalHeaderWidth = logoWidth + 10 + titleWidth;
        const headerStartX = (pageWidth - totalHeaderWidth) / 2;

        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'PNG', headerStartX, currentHeaderY, logoWidth, logoHeight);
        }
        doc.text(titleText, headerStartX + logoWidth + 10, currentHeaderY + logoHeight / 2 + 5);
        currentHeaderY += Math.max(logoHeight, 20) + 15;

        // --- Combined Sub-Heading (Heading1 + Heading2) ---
        doc.setFontSize(11); // Smaller than header title, but bold
        doc.setFont(undefined, 'bold');
        const heading1 = `${filterLevel || 'N/A'} = ${filterIDValue || 'N/A'}`;
        const heading2 = `Date Range: From ${startDate} To ${endDate}`;
        const subHeadingText = `${heading1} | ${heading2}`; // Combine with a separator
        const subHeadingWidth = doc.getTextWidth(subHeadingText);
        doc.text(subHeadingText, (pageWidth - subHeadingWidth) / 2, currentHeaderY); // Center horizontally
        currentHeaderY += 25; // Space after sub-heading

        // --- Footer ---
        const printDateTime = new Date().toLocaleString();
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const footerY = pageHeight - margin / 2;
        doc.text(printDateTime, margin, footerY, { align: 'left' });
        const pageNumText = `Page ${pageNumber} of ${totalPages}`;
        doc.text(pageNumText, pageWidth - margin, footerY, { align: 'right' });

        return currentHeaderY; // Return the Y position after the header AND sub-heading content
    },
    // --- End Helper ---


    async printToPDF() {
      // ... (existing initial checks and isLoading setup) ...
      if (this.imageUrls.length === 0) {
        this.isLoading = true;
        console.log('No images to print. Creating report...');
        await this.createReport(); // Wait for report creation if no images
        if (this.imageUrls.length === 0) { // Check again after creation attempt
            console.error("Still no images to print after report creation.");
            this.isLoading = false;
            return; // Exit if still no images
        }
      }
      this.isLoading = true;


      try {
        const doc = new jsPDF('p', 'pt', 'letter');
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        const footerSpace = 40; // Reserve space for footer

        // --- Load Logo (once) ---
        // ... (existing logo loading code) ...
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


        // --- Page 1 Setup ---
        // Pass filter/date info to the helper
        let currentY = this.addHeaderFooter(doc, 1, 1, logoDataUrl, logoImg, this.filterLevel, this.filterIDValue, this.startDate, this.endDate);
        // currentY now represents the position AFTER the sub-heading

        // --- Page 1 Body (First Image) ---
        const firstImageRef = this.$refs['reportImage0'] && this.$refs['reportImage0'][0];
        if (firstImageRef) {
            const imgData = await this.getImageDataUrl(firstImageRef.src);
            if (imgData) {
                const imgProps = doc.getImageProperties(imgData);
                // Available height considers header, sub-heading, and footer space
                const availableHeight = pageHeight - currentY - margin - footerSpace;
                const availableWidth = pageWidth - 2 * margin;

                let imgHeight = imgProps.height;
                let imgWidth = imgProps.width;
                const ratio = imgWidth / imgHeight;

                // Scale image
                if (imgWidth > availableWidth) {
                    imgWidth = availableWidth;
                    imgHeight = imgWidth / ratio;
                }
                if (imgHeight > availableHeight) {
                    imgHeight = availableHeight;
                    imgWidth = imgHeight * ratio;
                }

                const imgX = (pageWidth - imgWidth) / 2; // Center the image
                doc.addImage(imgData, 'PNG', imgX, currentY, imgWidth, imgHeight);
            }
        } else {
             doc.setFont(undefined, 'normal');
             doc.text("First image not found.", margin, currentY);
        }


        // --- Subsequent Pages (Remaining Images - 1 column, 2 images per page) ---
        const imagesPerPage = 2; // Changed
        // const imagesPerRow = 1; // No longer needed for calculation

        // Estimate header height (header + sub-heading + spacing)
        const headerAndSubHeadingHeightEstimate = 110; // Adjust this based on actual height

        // Calculate available content height per page (page height - header/sub-heading - footer)
        const contentHeightPerPage = pageHeight - headerAndSubHeadingHeightEstimate - footerSpace - margin;
        const rowHeight = contentHeightPerPage / imagesPerPage; // Height per image slot

        let pageCounter = 1; // Keep track of the current page number

        for (let i = 1; i < this.imageUrls.length; i++) {
          const indexOnPage = (i - 1) % imagesPerPage;

          // Add new page and header/footer if needed
          if (indexOnPage === 0) {
            doc.addPage();
            pageCounter++;
            // Add header/sub-heading/footer to the new page
            this.addHeaderFooter(doc, pageCounter, pageCounter, logoDataUrl, logoImg, this.filterLevel, this.filterIDValue, this.startDate, this.endDate);
          }

          const rowIndex = indexOnPage; // Simpler: 0 for top image, 1 for bottom image

          const imgRef = this.$refs[`reportImage${i}`] && this.$refs[`reportImage${i}`][0];
          if (imgRef) {
            const imgData = await this.getImageDataUrl(imgRef.src);
            if (imgData) {
                const imgProps = doc.getImageProperties(imgData);
                let imgRenderHeight = imgProps.height;
                let imgRenderWidth = imgProps.width;
                const ratio = imgRenderWidth / imgRenderHeight;

                // Scale image to fit cell (full width, half height)
                const cellPadding = 15; // Padding around image
                const maxCellWidth = pageWidth - 2 * margin - 2 * cellPadding;
                const maxCellHeight = rowHeight - 2 * cellPadding;

                if (imgRenderWidth > maxCellWidth) {
                    imgRenderWidth = maxCellWidth;
                    imgRenderHeight = imgRenderWidth / ratio;
                }
                 if (imgRenderHeight > maxCellHeight) {
                    imgRenderHeight = maxCellHeight;
                    imgRenderWidth = imgRenderHeight * ratio;
                }

                // Calculate position (Y position needs to account for header/sub-heading)
                // Start Y position for images is after the header/sub-heading
                const imageStartY = headerAndSubHeadingHeightEstimate + margin;
                const cellY = imageStartY + rowIndex * rowHeight;
                const imgX = (pageWidth - imgRenderWidth) / 2; // Center horizontally
                const imgY = cellY + (rowHeight - imgRenderHeight) / 2; // Center vertically within the row

                doc.addImage(imgData, 'PNG', imgX, imgY, imgRenderWidth, imgRenderHeight);
            }
          }
        }

        // --- Update Footer with Correct Total Pages ---
        // ... (existing footer update loop - no changes needed here) ...
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          const footerY = pageHeight - margin / 2;
          const pageNumText = `Page ${i} of ${totalPages}`;
          const printDateTime = new Date().toLocaleString();
          doc.text(printDateTime, margin, footerY, { align: 'left' });
          doc.text(pageNumText, pageWidth - margin, footerY, { align: 'right' });
        }


        // --- Save PDF ---
        doc.save('ActualToBudget_Report.pdf');

      } catch (error) {
        console.error('Failed to generate PDF:', error);
        this.progress.step = 'Failed to Generate PDF';
      } finally {
        this.isLoading = false;
      }
    },

    // Helper function to fetch image and convert to Data URL
    async getImageDataUrl(url) {
        try {
            // Append timestamp to bypass cache if necessary (already done in createReport)
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
            return null; // Return null if image loading fails
        }
    }
  }
}
</script>

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
  margin-right: 200px; /* Adjust this value as needed */
}

.image-container {
  width: 100%;
  overflow: auto;
}
.button-progress-container {
  display: flex;
  flex-direction: row;
  align-items: center; /* This will left-align the children */
  justify-content: space-between; /* Ensure even spacing between children */
  padding: 0 1rem; /* Add padding to the left and right */
}

.button-container {
  display: flex;
  justify-content: space-between; /* Or use 'space-around' */
  margin-bottom: 1rem; /* Add some space between the button and the progress bar */
  padding-left: 3rem; /* Add padding to the left side of the button */
  margin-right: 5rem; /* Add some space between the button and the progress bar */  
}

.progress-bar-container {
  flex-grow: 1; /* Allow the progress bar container to grow and take available space */
  text-align: center; /* Center the text within the container */
  padding: 0 1rem; /* Add padding to the left and right */
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
.loading-spinner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}
.scaled {
  transform: scale(0.5); /* Scale down to 80% of the original size */
  transform-origin: left; /* Ensure scaling is centered */
}
.print-button {
  margin-left: 1rem; /* Add some space next to the download button */
}

/* Add styles for the hidden images if needed, though display:none should suffice */
.image-container img[style*="display: none"] {
  /* Optional: further ensure they don't affect layout */
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
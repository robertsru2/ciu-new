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
            <p :class="{ 'red-text': progress.step === 'API Server Down' || progress.step.startsWith('Failed') }">{{ progress.step }}</p> 
          </div> 
          <div v-if="isLoading" class="loading-spinner">
            <img src="../assets/loading-spinner.gif" alt="Loading..." class="scaled">
          </div>
          <div class = "download-button">
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
        <h3>Actual to Budget Data by Month</h3>
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
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable'; // Import the plugin

export default {
  data() {
    return {
      pageHeading: 'Actual to Budget Dashboard',
      departments: [],
      divisions: [],
      selectedDepartment: '',
      selectedDivision: '',
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
        this.imageUrls = []; // Clear previous images
        this.tableData = null; // Clear previous table data
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
        const timestamp = new Date().getTime();
        console.log('Report Response:', response.data);
        // --- Handle Images ---
        const imgNames = response.data.img_names;
        console.dir('Image Names:', imgNames);
        if (imgNames && imgNames.length > 0) {
            const imgResponse = await fetch(`http://localhost:8000/dashboard-get-images/?${imgNames.map(img_name => `img_names=${encodeURIComponent(img_name)}`).join('&')}`);
            if (!imgResponse.ok) {
              throw new Error('Network response for images was not ok');
            }
            const imgUrls = await imgResponse.json();
            this.imageUrls = imgUrls.map(imgUrl => `${imgUrl}?t=${timestamp}`);
        } else {
            console.warn('No image names returned from the server.');
            // Optionally set a message if no images are expected/found
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
        // Removed unused variable 'pageHeight'
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

        return currentHeaderY; // Return the Y position after the header AND sub-heading content
    },

    async printToPDF() {
      // --- Initial Checks & Loading ---
      console.log('printToPDF method called');
      if (this.imageUrls.length === 0 && !this.tableData) {
        this.isLoading = true;
        console.log('No content to print. Creating report...');
        await this.createReport();
        if (this.imageUrls.length === 0 && !this.tableData) {
          console.error("Still no content to print after report creation.");
          this.isLoading = false;
          return;
        }
      }
      this.isLoading = true;

      try {
        // Create PDF document
        const doc = new jsPDF('p', 'pt', 'letter');
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        const footerHeight = 40;
        const contentWidth = pageWidth - 2 * margin;
        //const contentHeight = pageHeight - 2 * margin - footerHeight;

        // --- Load Logo ---
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
          } catch (e) { console.error("Error loading logo image:", e); }
        }

        // --- Preprocess all images ---
        const processedImages = [];
        for (let i = 0; i < this.imageUrls.length; i++) {
          try {
            // Get image data
            const imgData = await this.getImageDataUrl(this.imageUrls[i]);
            if (!imgData) {
              console.error(`Failed to load image ${i}`);
              continue;
            }

            // Get image properties
            const imgProps = doc.getImageProperties(imgData);
            const ratio = imgProps.width / imgProps.height;

            processedImages.push({
              index: i,
              data: imgData,
              width: imgProps.width,
              height: imgProps.height,
              ratio: ratio
            });
          } catch (error) {
            console.error(`Error processing image ${i}:`, error);
          }
        }

        // --- Calculate total pages needed ---
        // First page: 1 image + table
        // Subsequent pages: 2 images per page
        const imagesAfterFirstPage = processedImages.length - 1;
        const totalPages = 1 + Math.ceil(Math.max(0, imagesAfterFirstPage) / 2);
        let currentPage = 1;

        // --- FIRST PAGE: Header + First Image + Table ---
        let currentY = this.addHeaderFooter(doc, currentPage, totalPages, logoDataUrl, logoImg, 
          this.filterLevel, this.filterIDValue, this.startDate, this.endDate);
        const headerHeight = currentY - margin;
        
        // Calculate available body height on first page
        const availableBodyHeight = pageHeight - headerHeight - margin - footerHeight;
        
        // REQUIREMENT 2.a: First image takes up half of the vertical body space
        if (processedImages.length > 0) {
          const firstImage = processedImages[0];
          // Calculate max dimensions (half of available body height)
          const maxImageHeight = availableBodyHeight / 2;
          
          // Calculate dimensions to fit within allocated space
          let imgWidth = firstImage.width;
          let imgHeight = firstImage.height;
          
          // Scale based on width first
          if (imgWidth > contentWidth) {
            imgWidth = contentWidth;
            imgHeight = imgWidth / firstImage.ratio;
          }
          
          // Then ensure it doesn't exceed max height
          if (imgHeight > maxImageHeight) {
            imgHeight = maxImageHeight;
            imgWidth = imgHeight * firstImage.ratio;
          }
          
          // Center image horizontally
          const imgX = margin + (contentWidth - imgWidth) / 2;
          
          // Add image to PDF
          doc.addImage(firstImage.data, 'PNG', imgX, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 20; // Add space after image
        }
        
        // REQUIREMENT 2.b: Table takes up the second half of the vertical body space
        if (this.tableData) {
          const head = [['', ...this.tableData.columns]];
          const body = this.tableData.rows.map((rowLabel, rowIndex) => {
            return [rowLabel, ...this.tableData.cell_data[rowIndex]];
          });

          // Add table after first image
          autoTable(doc, {
            head: head,
            body: body,
            startY: currentY,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
            headStyles: { fillColor: [233, 236, 239], textColor: [33, 37, 41], fontStyle: 'bold', halign: 'center', lineWidth: 0.5, lineColor: [222, 226, 230] },
            bodyStyles: { lineWidth: 0.5, lineColor: [222, 226, 230] },
            columnStyles: {
              0: { fontStyle: 'bold', halign: 'left', fillColor: [248, 249, 250] },
              // Right-align all data columns
              ...Array.from({ length: this.tableData.columns.length }, (_, i) => i + 1).reduce((acc, col) => {
                acc[col] = { halign: 'right' };
                return acc;
              }, {})
            },
            didParseCell: (data) => {
              // Apply font color
              if (data.section === 'body' && data.column.index > 0) {
                const rowIndex = data.row.index;
                const colIndex = data.column.index - 1;
                if (this.tableData.cell_colors?.[rowIndex]?.[colIndex]) {
                  const color = this.tableData.cell_colors[rowIndex][colIndex];
                  data.cell.styles.textColor = (color === 'red') ? [220, 53, 69] : [33, 37, 41];
                }
              }
            },
            margin: {
              left: margin,
              right: margin,
              top: margin,
              bottom: margin + footerHeight
            }
          });
        }

        // --- SUBSEQUENT PAGES: Two images per page ---
        // REQUIREMENT 3: For each successive page, include 2 images
        for (let i = 1; i < processedImages.length; i += 2) {
          // Add a new page for each pair of images
          doc.addPage();
          currentPage++;
          
          // Add header
          let pageY = this.addHeaderFooter(doc, currentPage, totalPages, logoDataUrl, logoImg, 
            this.filterLevel, this.filterIDValue, this.startDate, this.endDate);
          
          // Calculate available body height
          const availableBodyHeight = pageHeight - (pageY - margin) - margin - footerHeight;
          const imageAreaHeight = availableBodyHeight / 2; // Each image gets half the available space
          
          // Process first image on this page
          const img1 = processedImages[i];
          if (img1) {
            // Calculate max dimensions
            const maxImgHeight = imageAreaHeight - 20; // Subtract some padding
            
            // Calculate dimensions to fit within allocated space
            let imgWidth = img1.width;
            let imgHeight = img1.height;
            
            // Scale based on width first
            if (imgWidth > contentWidth) {
              imgWidth = contentWidth;
              imgHeight = imgWidth / img1.ratio;
            }
            
            // Then ensure it doesn't exceed max height
            if (imgHeight > maxImgHeight) {
              imgHeight = maxImgHeight;
              imgWidth = imgHeight * img1.ratio;
            }
            
            // Center image horizontally
            const imgX = margin + (contentWidth - imgWidth) / 2;
            
            // Add image to PDF
            doc.addImage(img1.data, 'PNG', imgX, pageY, imgWidth, imgHeight);
            pageY += imgHeight + 20; // Add space after image
          }
          
          // Process second image on this page (if it exists)
          if (i + 1 < processedImages.length) {
            const img2 = processedImages[i + 1];
            
            // Calculate max dimensions
            const maxImgHeight = imageAreaHeight - 20; // Subtract some padding
            
            // Calculate dimensions to fit within allocated space
            let imgWidth = img2.width;
            let imgHeight = img2.height;
            
            // Scale based on width first
            if (imgWidth > contentWidth) {
              imgWidth = contentWidth;
              imgHeight = imgWidth / img2.ratio;
            }
            
            // Then ensure it doesn't exceed max height
            if (imgHeight > maxImgHeight) {
              imgHeight = maxImgHeight;
              imgWidth = imgHeight * img2.ratio;
            }
            
            // Center image horizontally
            const imgX = margin + (contentWidth - imgWidth) / 2;
            
            // Add image to PDF
            doc.addImage(img2.data, 'PNG', imgX, pageY, imgWidth, imgHeight);
          }
        }

        // --- Add footers to all pages ---
        const finalPrintDateTime = new Date().toLocaleString();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          const footerY = pageHeight - margin / 2;
          const pageNumText = `Page ${i} of ${totalPages}`;
          doc.text(finalPrintDateTime, margin, footerY, { align: 'left' });
          doc.text(pageNumText, pageWidth - margin, footerY, { align: 'right' });
        }

        // --- Save PDF ---
        doc.save('ActualToBudgetDashboard_Report.pdf');
        console.log(`PDF generated with ${totalPages} pages`);
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        this.progress.step = 'Failed to Generate PDF';
      } finally {
        this.isLoading = false;
      }
    },

    // Improved helper function to handle both SVG and PNG images
    async getImageDataUrl(url) {
      try {
        console.log(`Loading image: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        // Check if image is SVG
        const isSVG = url.toLowerCase().includes('.svg');
        
        if (isSVG) {
          // REQUIREMENT 1: Convert SVG to PNG for PDF
          console.log(`Converting SVG to PNG: ${url}`);
          const svgText = await response.text();
          
          // Create a blob with the SVG content
          const svgBlob = new Blob([svgText], {type: 'image/svg+xml'});
          const svgUrl = URL.createObjectURL(svgBlob);
          
          // Return a promise that resolves when the image is loaded and converted
          return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
              // Create a canvas to render the SVG
              const canvas = document.createElement('canvas');
              // Set canvas dimensions to the image size or default if not available
              canvas.width = img.naturalWidth || 800;
              canvas.height = img.naturalHeight || 600;
              
              // Draw the SVG onto the canvas
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              
              // Convert canvas to PNG data URL
              const pngDataUrl = canvas.toDataURL('image/png');
              
              // Clean up
              URL.revokeObjectURL(svgUrl);
              
              resolve(pngDataUrl);
            };
            
            img.onerror = (error) => {
              URL.revokeObjectURL(svgUrl);
              reject(new Error(`Failed to load SVG: ${error}`));
            };
            
            // Set the source to the SVG Blob URL
            img.src = svgUrl;
          });
        } else {
          // For PNG or other formats, use the existing approach
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.error(`Error processing image ${url}:`, error);
        return null;
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

.content-area {
  width: 100%;
  margin-top: 1rem;
  display: flex; /* Use flexbox for easier alignment */
  flex-direction: column; /* Stack children vertically */
  align-items: center; /* Center children horizontally */
}

.image-container {
  width: 90%; /* Match image width */
  margin-bottom: 1.5rem; /* Consistent vertical spacing */
  /* Styles for outlined-image are applied to the img tag directly */
}

.outlined-image {
  display: block; /* Ensure image behaves like a block element */
  border: 1px solid #dee2e6; /* Lighter border */
  width: 100%; /* Image takes full width of its container */
  height: auto;
  padding: 0.5rem; /* Reduced padding */
  box-sizing: border-box;
  border-radius: 0.3rem; /* Slightly softer corners */
  box-shadow: 0 0.2rem 0.5rem rgba(0, 0, 0, 0.1); /* Softer shadow */
  transition: box-shadow 0.3s ease-in-out;
}

.table-container {
  width: 90%; /* Match image width */
  margin-top: 1.5rem; /* Equal spacing above */
  margin-bottom: 1.5rem; /* Equal spacing below */
  overflow-x: auto; /* Keep horizontal scrolling */
  border: 1px solid #dee2e6; /* Match image border */
  border-radius: 0.3rem; /* Match image border-radius */
  box-shadow: 0 0.2rem 0.5rem rgba(0, 0, 0, 0.1); /* Match image shadow */
  background-color: #fff; /* Ensure background for contrast */
}

.table-container h3 {
  text-align: center;
  padding: 0.75rem 1rem;
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  background-color: #f8f9fa; /* Light background for heading */
  border-bottom: 1px solid #dee2e6; /* Separator line */
  border-top-left-radius: 0.3rem; /* Match container radius */
  border-top-right-radius: 0.3rem; /* Match container radius */
}

.data-table {
  width: 100%;
  border-collapse: collapse; /* Remove space between borders */
  font-size: 0.85em; /* Slightly smaller font */
  color: #212529; /* Default text color */
}

/* Remove individual cell borders, use row borders */
.data-table th,
.data-table td {
  border: none; /* Remove cell borders */
  padding: 0.75rem; /* Increase padding for better spacing */
  text-align: right;
  white-space: nowrap;
  vertical-align: middle; /* Align text vertically */
}

.data-table thead th {
  background-color: #e9ecef; /* Slightly darker header */
  font-weight: 600; /* Bold header text */
  text-align: center;
  border-bottom: 2px solid #dee2e6; /* Thicker border below header */
}

/* Style for the first column header (empty or row labels) */
.data-table thead th:first-child,
.data-table tbody th {
  background-color: #f8f9fa; /* Light background for row labels */
  text-align: left;
  font-weight: 600;
  position: sticky; /* Make row headers sticky if table scrolls horizontally */
  left: 0;
  z-index: 1; /* Ensure it stays above scrolling content */
}

/* Add borders between rows */
.data-table tbody tr {
  border-bottom: 1px solid #dee2e6; /* Light border between rows */
}

/* Remove border from the last row */
.data-table tbody tr:last-child {
  border-bottom: none;
}

/* Subtle hover effect for rows */
.data-table tbody tr:hover {
  background-color: #f1f3f5;
}

/* Ensure hidden images for PDF don't interfere */
.image-container img[style*="display: none"] {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.red-text {
  color: #dc3545; /* Standard Bootstrap danger color */
}
</style>
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
        const doc = new jsPDF('p', 'pt', 'letter');
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        const footerHeight = 40; // Space reserved for footer
        const contentWidth = pageWidth - 2 * margin;

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

        // --- Page 1 Setup ---
        let currentPage = 1;
        let totalPages = 1; // Placeholder, updated at the end
        let currentY = this.addHeaderFooter(doc, currentPage, totalPages, logoDataUrl, logoImg, this.filterLevel, this.filterIDValue, this.startDate, this.endDate);

        const availablePageHeight = pageHeight - currentY - margin - footerHeight; // Usable height below header

        // --- Page 1 Body (First Image) ---
        if (this.imageUrls.length > 0) {
            const imgData = await this.getImageDataUrl(this.imageUrls[0]);
            if (imgData) {
                const imgProps = doc.getImageProperties(imgData);
                const ratio = imgProps.width / imgProps.height;

                // Calculate max height for the first image (e.g., 70% of available space)
                const maxImageHeight = availablePageHeight * 0.70; // Adjusted percentage

                let imgWidth = imgProps.width;
                let imgHeight = imgProps.height;

                // Scale image to fit width first
                if (imgWidth > contentWidth) {
                    imgWidth = contentWidth;
                    imgHeight = imgWidth / ratio;
                }
                // Then scale down further if it exceeds max height
                if (imgHeight > maxImageHeight) {
                    imgHeight = maxImageHeight;
                    imgWidth = imgHeight * ratio;
                }

                const imgX = (pageWidth - imgWidth) / 2; // Center horizontally
                doc.addImage(imgData, 'JPEG', imgX, currentY, imgWidth, imgHeight, undefined, 'FAST'); // 'FAST' typically gives best compression
                currentY += imgHeight + 15; // Update Y position, add smaller spacing before table
            } else {
                 console.log("First image data could not be loaded.");
                 // currentY += 20; // Add space even if no image
            }
        } else {
             console.log("First image not found or imageUrls is empty.");
             // currentY += 20; // Add space even if no image
        }

        // --- Add Table using autoTable (Starts on Page 1, below image) ---
        if (this.tableData) {
            const head = [['', ...this.tableData.columns]];
            const body = this.tableData.rows.map((rowLabel, rowIndex) => {
                return [rowLabel, ...this.tableData.cell_data[rowIndex]];
            });

            // No pre-emptive page break here. Let autoTable handle breaks if needed.
            const tableStartY = currentY;

            autoTable(doc, {
                head: head,
                body: body,
                startY: tableStartY, // Start table right after the image
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
                headStyles: { fillColor: [233, 236, 239], textColor: [33, 37, 41], fontStyle: 'bold', halign: 'center', lineWidth: 0.5, lineColor: [222, 226, 230] },
                bodyStyles: { lineWidth: 0.5, lineColor: [222, 226, 230] },
                columnStyles: {
                    0: { fontStyle: 'bold', halign: 'left', fillColor: [248, 249, 250] },
                    1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
                    5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' },
                    9: { halign: 'right' }, 10: { halign: 'right' } // Adjust if more/fewer columns
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
                    // Style row headers
                    if (data.section === 'body' && data.column.index === 0) {
                         data.cell.styles.fontStyle = 'bold';
                         data.cell.styles.halign = 'left';
                         data.cell.styles.fillColor = [248, 249, 250];
                    }
                },
                margin: {
                    left: margin,
                    right: margin,
                    top: margin, // Keep top margin if needed for safety
                    bottom: margin + footerHeight // Ensure table stops above footer area
                 },
                // Remove or comment out the didDrawPage that adds header/footer
                // didDrawPage: (data) => {
                //     // We will draw footers only once at the end
                //     // if (data.pageNumber > 1) {
                //     //      this.addHeaderFooter(doc, data.pageNumber, totalPages, logoDataUrl, logoImg, this.filterLevel, this.filterIDValue, this.startDate, this.endDate);
                //     // }
                // }
            });

            currentY = doc.lastAutoTable.finalY + 20; // Update Y position after table
            currentPage = doc.internal.pages.length; // Update current page count
        } else {
            console.log("No table data to add to PDF.");
        }

        // --- Subsequent Pages (Remaining Images - 2 per page) ---
        const imagesPerPage = 2;
        const headerAndSubHeadingHeightEstimate = 110; // Keep estimate for subsequent pages

        // Determine starting page and Y for subsequent images
        let imageLoopStartY = headerAndSubHeadingHeightEstimate + margin; // Default start Y on a new page
        let startNewPageForImages = true; // Assume we need a new page unless table finished exactly at bottom

        // Check if there's significant space left on the page where the table finished
        if (currentY < pageHeight - margin - footerHeight - 100) { // If > 100pts space left
            startNewPageForImages = false; // Continue on the current page
            imageLoopStartY = currentY; // Start images after the table on the same page
        }


        for (let i = 1; i < this.imageUrls.length; i++) {
            const indexWithinPair = (i - 1) % imagesPerPage;

            // Add new page and header only for the first image of a pair, or if starting fresh
            if (indexWithinPair === 0) {
                if (i > 1 || startNewPageForImages) {
                    doc.addPage();
                    currentPage++;
                    // 1. Add header/sub-header, get Y position *below* them
                    currentY = this.addHeaderFooter(doc, currentPage, totalPages, logoDataUrl, logoImg, this.filterLevel, this.filterIDValue, this.startDate, this.endDate);
                } else {
                    // Continue on the page where the table finished, Y position is already set
                    currentY = imageLoopStartY;
                }
            }

            const imgData = await this.getImageDataUrl(this.imageUrls[i]);
            if (imgData) {
                const imgProps = doc.getImageProperties(imgData);
                const ratio = imgProps.width / imgProps.height;

                // Calculate max height for the first image (e.g., 70% of available space)
                const maxImageHeight = availablePageHeight * 0.70; // Adjusted percentage

                let imgRenderWidth = imgProps.width;
                let imgRenderHeight = imgProps.height;

                // Scale image to fit width first
                if (imgRenderWidth > contentWidth) {
                    imgRenderWidth = contentWidth;
                    imgRenderHeight = imgRenderWidth / ratio;
                }
                // Then scale down further if it exceeds max height
                if (imgRenderHeight > maxImageHeight) {
                    imgRenderHeight = maxImageHeight;
                    imgRenderWidth = imgRenderHeight * ratio;
                }

                // 2. Calculate Y position for the image content area *below* the header
                const pageImageContentStartY = headerAndSubHeadingHeightEstimate + margin; // Y where content starts below header
                const pageImageContentHeight = pageHeight - pageImageContentStartY - margin - footerHeight;
                const rowHeight = pageImageContentHeight / imagesPerPage;

                // 3. Calculate the specific Y position for this image within its row, below the header
                const cellY = pageImageContentStartY + indexWithinPair * rowHeight;
                const imgX = (pageWidth - imgRenderWidth) / 2;
                const imgY = cellY + (rowHeight - imgRenderHeight) / 2; // Positioned relative to pageImageContentStartY

                // 4. Add the image at the calculated X, Y (which is in the body)
                doc.addImage(imgData, 'JPEG', imgX, imgY, imgRenderWidth, imgRenderHeight, undefined, 'FAST'); // 'FAST' typically gives best compression

                // ... (update currentY logic) ...
            }
        }

        // --- Final Footer Update ---
        totalPages = doc.internal.getNumberOfPages(); // Get the final page count
        const finalPrintDateTime = new Date().toLocaleString(); // Get consistent time for all footers
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          // Draw the footer cleanly
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          const footerY = pageHeight - margin / 2;
          const pageNumText = `Page ${i} of ${totalPages}`;
          // Draw text - this should not overlap now
          doc.text(finalPrintDateTime, margin, footerY, { align: 'left' });
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

/* ... other existing styles ... */
.red-text {
  color: #dc3545; /* Standard Bootstrap danger color */
}

.loading-spinner {
  /* ... existing styles ... */
}
.scaled {
 /* ... existing styles ... */
}
.print-button {
 /* ... existing styles ... */
}

</style>
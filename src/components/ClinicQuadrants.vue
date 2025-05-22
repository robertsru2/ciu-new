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
import quadrantsImageFile from '../assets/quadrants.png';

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
    async printToPDF() {
      console.log('printToPDF method called');
      if (this.displayPairs.length === 0) {
        console.log('No content to print. Creating report...');
        await this.createReport(); // Ensure data is loaded
        if (this.displayPairs.length === 0) {
          console.error("Still no content to print after report creation.");
          this.isLoading = false;
          return;
        }
      }

      this.isLoading = true;

      try {
        const { jsPDF } = await import("jspdf");
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF('p', 'pt', 'letter');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - 2 * margin;
        const estimatedFooterHeight = 30; 
        const estimatedHeaderHeight = 120; // Used for autoTable's top margin on new pages

        // --- Load Logo (for header) ---
        const logoImg = this.$refs.logoImage;
        let logoDataUrl = '';
        if (logoImg && logoImg.src) {
          try {
            logoDataUrl = await this.getImageDataUrl(logoImg.src, true); // true for isLogo
          } catch (e) {
            console.error("Error loading logo image for PDF header:", e);
          }
        }

        // --- Load Title Page Image (quadrants.png) ---
        let quadrantsImageDataUrl = '';
        try {
          quadrantsImageDataUrl = await this.getImageDataUrl(quadrantsImageFile, false); // false: not a logo
        } catch (e) {
          console.error("Error loading quadrants.png for title page:", e);
        }

        const addPageHeader = (docInstance, pageNumToAddHeaderTo) => {
          const originalPage = docInstance.internal.getCurrentPageInfo().pageNumber;
          docInstance.setPage(pageNumToAddHeaderTo);
          docInstance.setTextColor(0, 0, 0);

          let currentY = margin;
          const logoPhysicalWidth = 75;
          let logoPhysicalHeight = 35;

          if (logoImg && logoImg.naturalWidth > 0) {
             logoPhysicalHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoPhysicalWidth;
          }

          if (logoDataUrl) {
            try {
              const format = logoDataUrl.substring(logoDataUrl.indexOf('/') + 1, logoDataUrl.indexOf(';')).toUpperCase();
              docInstance.addImage(logoDataUrl, format, margin, currentY, logoPhysicalWidth, logoPhysicalHeight);
            } catch (imgError) {
              console.error("Error adding logo to PDF header:", imgError);
            }
          }

          docInstance.setFontSize(22);
          docInstance.setFont(undefined, 'bold');
          const pageHeadingText = this.pageHeading;
          const logoPadding = 20; // Padding between logo and text
          const spaceForHeading = contentWidth - logoPhysicalWidth - logoPadding;
          const headingX = margin + logoPhysicalWidth + logoPadding + (spaceForHeading / 2);
          const headingY = currentY + (logoPhysicalHeight / 2) + (docInstance.getFontSize() / 3);
          docInstance.text(pageHeadingText, headingX, headingY, { align: 'center', maxWidth: spaceForHeading });

          currentY += Math.max(logoPhysicalHeight, docInstance.getLineHeightFactor() * 22) + 15;

          docInstance.setFontSize(16);
          docInstance.setFont(undefined, 'normal');
          const filterText = `${this.filterLevel} = ${this.filterIDValue} | Date Range: ${this.startDate} To ${this.endDate}`;
          docInstance.text(filterText, pageWidth / 2, currentY, { align: 'center', maxWidth: contentWidth });
          currentY += docInstance.getLineHeightFactor() * 16 + 20;

          docInstance.setPage(originalPage);
          return currentY; 
        };

        const addPageFooter = (docInstance, pageNumToAddFooterTo, totalPages) => {
          const originalPage = docInstance.internal.getCurrentPageInfo().pageNumber;
          docInstance.setPage(pageNumToAddFooterTo);
          docInstance.setTextColor(0, 0, 0); 
          docInstance.setFontSize(9); 
          docInstance.setFont(undefined, 'normal');

          const footerY = pageHeight - margin + 10; 
          const dateTime = new Date().toLocaleString();
          docInstance.text(dateTime, margin, footerY);

          const pageText = `Page ${pageNumToAddFooterTo} of ${totalPages}`;
          const pageTextWidth = docInstance.getTextWidth(pageText);
          docInstance.text(pageText, pageWidth - margin - pageTextWidth, footerY);
          docInstance.setPage(originalPage);
        };

        // --- Create Title Page (Page 1) ---
        const titlePageNum = 1; 
        let titlePageContentStartY = addPageHeader(doc, titlePageNum);
        const titlePageAvailableBodyHeight = pageHeight - titlePageContentStartY - margin - estimatedFooterHeight;


        if (quadrantsImageDataUrl) {
          try {
            const imgProps = doc.getImageProperties(quadrantsImageDataUrl);
            const titleImageRenderWidth = contentWidth * 0.9; // 90% of content width
            const titleImageRenderHeight = (imgProps.height / imgProps.width) * titleImageRenderWidth;
            const titleImageX = margin + (contentWidth - titleImageRenderWidth) / 2; // Center the 90% image
            
            // Simple vertical centering for the title image in the available body space
            let titleImageY = titlePageContentStartY + (titlePageAvailableBodyHeight - titleImageRenderHeight) / 2;
            if (titleImageY < titlePageContentStartY) titleImageY = titlePageContentStartY; // Ensure it doesn't go above start Y

            const format = quadrantsImageDataUrl.substring(quadrantsImageDataUrl.indexOf('/') + 1, quadrantsImageDataUrl.indexOf(';')).toUpperCase();
            doc.addImage(quadrantsImageDataUrl, format, titleImageX, titleImageY, titleImageRenderWidth, titleImageRenderHeight, undefined, 'MEDIUM');
          } catch (e) {
            console.error("Error adding quadrants.png to title page:", e);
            doc.setTextColor(255,0,0);
            doc.text("Error loading title page image.", margin, titlePageContentStartY + 20);
            doc.setTextColor(0,0,0);
          }
        } else {
            doc.setTextColor(255,0,0); // Keep error messages in red
            doc.text("Title page image (quadrants.png) could not be loaded.", margin, titlePageContentStartY + 20);
            doc.setTextColor(0,0,0); // Reset to black
        }

        // --- Loop for each image-table pair (starting on new pages) ---
        for (let i = 0; i < this.displayPairs.length; i++) {
          const pair = this.displayPairs[i];
          doc.addPage(); // Each report pair gets a new page
          const currentPageForPair = doc.internal.getCurrentPageInfo().pageNumber;
          let contentStartY = addPageHeader(doc, currentPageForPair);

          const availableBodyHeight = pageHeight - contentStartY - margin - estimatedFooterHeight;
          let imageActualHeight = 0;

          if (pair.imageUrl) {
            try {
              const imageDataUrl = await this.getImageDataUrl(pair.imageUrl);
              if (imageDataUrl) {
                const imgProps = doc.getImageProperties(imageDataUrl);
                
                const targetImageContainerWidth = contentWidth; // 100% horizontal
                const targetImageContainerHeight = availableBodyHeight * 0.60; // 60% vertical space for image section

                let imgRenderWidth, imgRenderHeight;

                if ((imgProps.width / imgProps.height) > (targetImageContainerWidth / targetImageContainerHeight)) {
                    imgRenderWidth = targetImageContainerWidth;
                    imgRenderHeight = (imgProps.height / imgProps.width) * imgRenderWidth;
                } else {
                    imgRenderHeight = targetImageContainerHeight;
                    imgRenderWidth = (imgProps.width / imgProps.height) * imgRenderHeight;
                }
                
                // Ensure rendered image does not exceed the container dimensions (safeguard)
                if (imgRenderHeight > targetImageContainerHeight) {
                    imgRenderHeight = targetImageContainerHeight;
                    imgRenderWidth = (imgProps.width / imgProps.height) * imgRenderHeight;
                }
                if (imgRenderWidth > targetImageContainerWidth) { // Should not happen if logic above is correct
                    imgRenderWidth = targetImageContainerWidth;
                    imgRenderHeight = (imgProps.height / imgProps.width) * imgRenderWidth;
                }

                imageActualHeight = imgRenderHeight;
                const imgX = margin + (contentWidth - imgRenderWidth) / 2; // Center the image

                const format = imageDataUrl.substring(imageDataUrl.indexOf('/') + 1, imageDataUrl.indexOf(';')).toUpperCase();
                doc.addImage(imageDataUrl, format, imgX, contentStartY, imgRenderWidth, imgRenderHeight, undefined, 'MEDIUM');
              }
            } catch (e) {
              console.error(`Error processing image ${pair.imageUrl} for PDF:`, e);
              doc.setTextColor(255,0,0);
              doc.text("Error loading image.", margin, contentStartY + 20);
              doc.setTextColor(0,0,0);
            }
          }
          contentStartY += imageActualHeight + 10; // Space after image

          if (pair.tableData && pair.tableData.length > 0) {
            const columns = this.getTableColumns(pair.tableData);
            const limitedTableData = pair.tableData.slice(0, 30);
            const body = limitedTableData.map(row => columns.map(col => this.formatCellValue(row[col], col)));

            autoTable(doc, {
              head: [columns],
              body: body,
              startY: contentStartY,
              theme: 'grid',
              styles: {
                fontSize: 8, 
                textColor: [0, 0, 0],
                cellPadding: 2,
                overflow: 'linebreak'
              },
              headStyles: { fillColor: [233, 236, 239], textColor: [0, 0, 0], fontStyle: 'bold' },
              bodyStyles: { textColor: [0, 0, 0] },
              columnStyles: this.getColumnStyles(columns),
              margin: { top: estimatedHeaderHeight, left: margin, right: margin, bottom: margin + estimatedFooterHeight },
              pageBreak: 'auto',
              didDrawPage: (data) => {
                addPageHeader(doc, data.pageNumber);
              }
            });
          }
        }

        // --- Final pass to add footers to all pages ---
        const totalPages = doc.internal.getNumberOfPages();
        for (let k = 1; k <= totalPages; k++) {
          addPageFooter(doc, k, totalPages);
        }

        doc.save('ClinicQuadrants_Report.pdf');
        console.log(`PDF generated successfully with ${totalPages} pages`);

      } catch (error) {
        console.error('Failed to generate PDF:', error);
        this.progress.step = `Failed to generate PDF: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    async getImageDataUrl(url, isLogo = false) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText} (URL: ${url})`);
        }
        const blob = await response.blob();

        if (blob.type === 'image/svg+xml') {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
              const canvas = document.createElement('canvas');
              let drawWidth = this.naturalWidth;
              let drawHeight = this.naturalHeight;
              const MAX_SVG_CANVAS_DIM = 2000; // Limit canvas size for performance
              if (drawWidth > MAX_SVG_CANVAS_DIM || drawHeight > MAX_SVG_CANVAS_DIM) {
                const ratio = Math.min(MAX_SVG_CANVAS_DIM / drawWidth, MAX_SVG_CANVAS_DIM / drawHeight);
                drawWidth *= ratio;
                drawHeight *= ratio;
              }
              canvas.width = drawWidth;
              canvas.height = drawHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(this, 0, 0, drawWidth, drawHeight);
              resolve(canvas.toDataURL('image/png')); // Convert SVG to PNG
            };
            img.onerror = (errEvent) => reject(new Error('Failed to load SVG into Image element. ' + (errEvent.toString ? errEvent.toString() : JSON.stringify(errEvent))));
            const reader = new FileReader();
            reader.onloadend = () => { img.src = reader.result; }; // reader.result is a dataURL
            reader.onerror = () => reject(new Error('Failed to read SVG blob as dataURL.'));
            reader.readAsDataURL(blob);
          });
        } else if (!isLogo && (blob.type === 'image/png' || blob.type === 'image/bmp' || !blob.type.startsWith('image/jpeg'))) {
          // Convert non-logo, non-JPEG images to JPEG for size reduction
          return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(image, 0, 0);
              resolve(canvas.toDataURL('image/jpeg', 0.75)); // Quality 0.75 for JPEG
            };
            image.onerror = (errEvent) => reject(new Error('Failed to load image for JPEG conversion. ' + (errEvent.toString ? errEvent.toString() : JSON.stringify(errEvent))));
            image.src = URL.createObjectURL(blob); // Use Object URL for non-SVG blobs
            image.onloadend = () => URL.revokeObjectURL(image.src); // Clean up object URL
          });
        } else {
          // For logos (if not SVG), already JPEGs, or other types, return as base64 data URL
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read image blob as dataURL.'));
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.error(`Error in getImageDataUrl for ${url}:`, error);
        return null;
      }
    },
    // Helper function to get column styles for the table
    getColumnStyles(columns) {
      const styles = {};
      
      columns.forEach((col, index) => {
        if (col === 'DepartmentNM' || col === 'ProviderNM' || col === 'ClinicNM') {
          // Text columns - left aligned
          styles[index] = { 
            halign: 'left',
            cellWidth: 'auto'
          };
        } else if (col === 'Fiscal_Year') {
          // Year column - centered
          styles[index] = { 
            halign: 'center',
            cellWidth: 'wrap'
          };
        } else if (col === 'Fill_Rate') {
          // Percentage columns - right aligned, bold
          styles[index] = { 
            halign: 'right',
            fontStyle: 'bold',
            cellWidth: 'wrap'
          };
        } else {
          // Numeric columns - right aligned
          styles[index] = { 
            halign: 'right',
            cellWidth: 'wrap'
          };
        }
      });
      
      return styles;
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
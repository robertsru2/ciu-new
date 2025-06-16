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
          <label>Fiscal Year: 
            <select v-model="fiscalYear" class="fiscal-year-select">
              <option v-for="year in availableFiscalYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </label>
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

    <!-- Loading spinner overlay with messages and timer -->
    <LoadingSpinnerWithMessages :isLoading="isLoading" />
  </div> 
</template>

<script>
import axios from 'axios';
import LoadingSpinnerWithMessages from './LoadingSpinnerWithMessages.vue';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default {
  components: {
    LoadingSpinnerWithMessages
  },
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
      fiscalYear: this.getCurrentFiscalYear(), // Default to current fiscal year
      isLoading: false,
    };
  },
  computed: {
    filteredDivisions() {
      return this.departments.filter(department => department.DepartmentLevel === 'DOM');
    },
    availableFiscalYears() {
      // Generate fiscal years from 2024 to current fiscal year + 2
      const currentFY = this.getCurrentFiscalYear();
      const years = [];
      for (let year = 2024; year <= currentFY + 2; year++) {
        years.push(year);
      }
      return years;
    }
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:8000/dashboard-ciu');
      this.departments = response.data.departments;
      this.divisions = response.data.divisions;
      console.log('Server is up');
    } catch (error) {
      console.log('Server is down');
      this.progress.step = 'API Server Down';
    }
  },
  methods: {
    getCurrentFiscalYear() {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-based (0 = January, 6 = July)
      
      // If current month is July (6) or later, we're in the next fiscal year
      // If current month is before July (0-5), we're still in the current fiscal year
      if (currentMonth >= 6) { // July or later
        return currentYear + 1;
      } else { // January through June
        return currentYear;
      }
    },

    clearOtherSelections(changedField) {
      if (changedField !== 'department') {
        this.selectedDepartment = '';
      }
      if (changedField !== 'division') {
        this.selectedDivision = '';
      }
      
      if (this.selectedDepartment) {
        this.filterIDValue = this.selectedDepartment;
        this.filterLevel = 'DepartmentLevel';
      } else if (this.selectedDivision) {
        this.filterIDValue = this.selectedDivision;
        this.filterLevel = 'DivisionNM';
      }
    },

    async createReport() {
      this.isLoading = true;
      this.progress.step = 'Creating report...';
      
      try {
        const params = {
          startDate: this.startDate,
          endDate: this.endDate,
          filter_level: this.filterLevel,
          filter_id_value: this.filterIDValue,
          fiscal_year: this.fiscalYear // Updated parameter name
        };

        const response = await axios.post('http://localhost:8000/actual-to-budget', params );
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
        console.error('Error creating report:', error);
        this.progress.step = 'Failed to create report: ' + error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async downloadData() {
      if (!this.tableData) {
        alert('No data available to download');
        return;
      }
      
      try {
        const params = {
          start_date: this.startDate,
          end_date: this.endDate,
          filter_level: this.filterLevel,
          filter_id_value: this.filterIDValue,
          fiscal_year: this.fiscalYear // Updated parameter name
        };

        const response = await axios.get('http://localhost:8000/actual-budget/download', { 
          params,
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ActualToBudget_${this.filterIDValue}_FY${this.fiscalYear}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading data:', error);
        alert('Failed to download data');
      }
    },

    async printToPDF() {
      if (this.imageUrls.length === 0 && !this.tableData) {
        console.log('No content to print. Creating report...');
        await this.createReport();
        if (this.imageUrls.length === 0 && !this.tableData) {
          console.error("Still no content to print after report creation.");
          return;
        }
      }

      this.isLoading = true;
      this.progress.step = 'Generating PDF...';

      try {
        // Create new PDF document
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Page dimensions
        const pageWidth = 612; // Letter size width in points
        const pageHeight = 792; // Letter size height in points
        const margin = 40;
        const contentWidth = pageWidth - 2 * margin;
        const headerHeight = 80;
        const footerHeight = 30;
        const bodyHeight = pageHeight - headerHeight - footerHeight - 2 * margin;

        // Load and optimize images
        const processedImages = await this.processImagesForPDF(this.imageUrls);
        
        // Create first page
        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let currentY = pageHeight - margin;

        // Add header to first page
        currentY = await this.addPDFHeader(page, helveticaBoldFont, helveticaFont, currentY, contentWidth, margin);

        // Add first image (half of body height)
        if (processedImages.length > 0) {
          const imageHeight = bodyHeight * 0.5;
          const imageWidth = contentWidth;
          
          currentY -= 10; // Small gap after header
          await this.addImageToPDF(page, processedImages[0], margin, currentY - imageHeight, imageWidth, imageHeight);
          currentY -= imageHeight + 10;
        }

        // Add table data to remaining space on first page
        if (this.tableData) {
          await this.addTableToPDF(page, helveticaFont, helveticaBoldFont, margin, currentY, contentWidth, bodyHeight * 0.4);
        }

        // Add footer to first page
        this.addPDFFooter(page, helveticaFont, margin, pageWidth, 1, Math.ceil((processedImages.length - 1) / 2) + 1);

        // Add remaining images (2 per page)
        let imageIndex = 1;
        let pageNumber = 2;
        
        while (imageIndex < processedImages.length) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;

          // Add header
          currentY = await this.addPDFHeader(page, helveticaBoldFont, helveticaFont, currentY, contentWidth, margin);
          currentY -= 10;

          // Add up to 2 images per page
          const imageHeight = bodyHeight * 0.45; // Slightly smaller to fit 2 images
          const imageWidth = contentWidth;

          // First image on page
          if (imageIndex < processedImages.length) {
            await this.addImageToPDF(page, processedImages[imageIndex], margin, currentY - imageHeight, imageWidth, imageHeight);
            currentY -= imageHeight + 20;
            imageIndex++;
          }

          // Second image on page
          if (imageIndex < processedImages.length) {
            await this.addImageToPDF(page, processedImages[imageIndex], margin, currentY - imageHeight, imageWidth, imageHeight);
            imageIndex++;
          }

          // Add footer
          this.addPDFFooter(page, helveticaFont, margin, pageWidth, pageNumber, Math.ceil((processedImages.length - 1) / 2) + 1);
          pageNumber++;
        }

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ActualToBudgetDashboard_Report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`PDF generated successfully. Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        this.progress.step = 'PDF generated successfully';

      } catch (error) {
        console.error('Failed to generate PDF:', error);
        this.progress.step = `Failed to generate PDF: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    async processImagesForPDF(imageUrls) {
      const processedImages = [];
      
      for (const url of imageUrls) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          // Determine image type and process accordingly
          const isSvg = blob.type === 'image/svg+xml' || url.endsWith('.svg');
          
          if (isSvg) {
            // Convert SVG to PNG for PDF embedding
            const pngBuffer = await this.convertSvgToPng(arrayBuffer);
            processedImages.push({
              data: pngBuffer,
              type: 'png'
            });
          } else {
            // Use PNG directly but compress if needed
            processedImages.push({
              data: arrayBuffer,
              type: 'png'
            });
          }
        } catch (error) {
          console.error(`Error processing image ${url}:`, error);
        }
      }
      
      return processedImages;
    },

    async convertSvgToPng(svgBuffer) {
      return new Promise((resolve, reject) => {
        const svgString = new TextDecoder().decode(svgBuffer);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Set canvas size for good quality but not excessive
          canvas.width = Math.min(img.width, 1200);
          canvas.height = Math.min(img.height, 900);
          
          // Draw SVG to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert to PNG with compression
          canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(resolve).catch(reject);
            } else {
              reject(new Error('Failed to convert SVG to PNG'));
            }
          }, 'image/png', 0.8); // 80% quality
        };
        
        img.onerror = reject;
        
        // Create blob URL for SVG
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        img.src = URL.createObjectURL(svgBlob);
      });
    },

    async addPDFHeader(page, boldFont, normalFont, currentY, contentWidth, margin) {
      // Page heading - properly centered
      const headingText = this.pageHeading;
      const headingWidth = boldFont.widthOfTextAtSize(headingText, 22);
      const headingX = margin + (contentWidth - headingWidth) / 2; // Center calculation
      
      page.drawText(headingText, {
        x: headingX,
        y: currentY - 30,
        size: 22,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Filter information - properly centered
      const filterText = `${this.filterLevel} = ${this.filterIDValue} | Date Range: ${this.startDate} To ${this.endDate}`;
      const filterWidth = normalFont.widthOfTextAtSize(filterText, 14);
      const filterX = margin + (contentWidth - filterWidth) / 2; // Center calculation
      
      page.drawText(filterText, {
        x: filterX,
        y: currentY - 60,
        size: 14,
        font: normalFont,
        color: rgb(0, 0, 0),
      });
      
      return currentY - 80; // Return new Y position after header
    },

    addPDFFooter(page, font, margin, pageWidth, pageNumber, totalPages) {
      const footerY = 20;
      
      // Date/time
      const dateTime = new Date().toLocaleString();
      page.drawText(dateTime, {
        x: margin,
        y: footerY,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      // Page number
      const pageText = `Page ${pageNumber} of ${totalPages}`;
      page.drawText(pageText, {
        x: pageWidth - margin - 80,
        y: footerY,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    },

    async addImageToPDF(page, imageData, x, y, maxWidth, maxHeight) {
      try {
        const image = await page.doc.embedPng(imageData.data);
        const { width, height } = image;
        
        // Calculate scaling to fit within bounds
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        
        // Center the image within the available space
        const centeredX = x + (maxWidth - scaledWidth) / 2;
        
        page.drawImage(image, {
          x: centeredX,
          y: y,
          width: scaledWidth,
          height: scaledHeight,
        });
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        // Add error text instead
        page.drawText('Error loading image', {
          x: x + 20,
          y: y + maxHeight / 2,
          size: 12,
          color: rgb(1, 0, 0),
        });
      }
    },

    async addTableToPDF(page, font, boldFont, x, startY, maxWidth, maxHeight) {
      if (!this.tableData) return;
      
      try {
        const fontSize = 8;
        const headerFontSize = 8; // Reduced to fit better
        const titleFontSize = 10;
        const rowHeight = 16;
        const cellPadding = 2;
        let currentY = startY;
        
        // Calculate column widths more carefully to prevent overflow
        const rowLabelWidth = 160; // Increased for longer labels like "2025 Follow-Up Patients"
        const totalDataColumns = this.tableData.columns.length;
        const availableDataWidth = maxWidth - rowLabelWidth;
        const dataColumnWidth = Math.floor(availableDataWidth / totalDataColumns); // Use floor to ensure no overflow
        
        console.log(`Table layout: maxWidth=${maxWidth}, rowLabelWidth=${rowLabelWidth}, dataColumnWidth=${dataColumnWidth}, totalColumns=${totalDataColumns}`);
        
        // Calculate actual table width to center it if needed
        const actualTableWidth = rowLabelWidth + (dataColumnWidth * totalDataColumns);
        const tableStartX = x + (maxWidth - actualTableWidth) / 2;
        
        // Draw table title as part of the table structure (like HTML <caption>)
        const titleText = 'Actual to Budget Data by Month';
        const titleWidth = boldFont.widthOfTextAtSize(titleText, titleFontSize);
        const titleX = tableStartX + (actualTableWidth - titleWidth) / 2;
        
        // Title background (part of table)
        page.drawRectangle({
          x: tableStartX,
          y: currentY - 18,
          width: actualTableWidth,
          height: 18,
          color: rgb(0.92, 0.92, 0.92), // Slightly darker gray for title
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 0.5,
        });
        
        page.drawText(titleText, {
          x: titleX,
          y: currentY - 14,
          size: titleFontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        currentY -= 18;
        
        // Draw header row background (light gray like HTML)
        const headerRowY = currentY;
        page.drawRectangle({
          x: tableStartX,
          y: headerRowY - rowHeight,
          width: actualTableWidth,
          height: rowHeight,
          color: rgb(0.95, 0.95, 0.95), // Light gray background
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 0.5,
        });
        
        // Draw empty header cell for row labels column
        page.drawRectangle({
          x: tableStartX,
          y: headerRowY - rowHeight,
          width: rowLabelWidth,
          height: rowHeight,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 0.5,
        });
        
        // Draw column headers with careful width management
        for (let i = 0; i < this.tableData.columns.length; i++) {
          const colX = tableStartX + rowLabelWidth + (i * dataColumnWidth);
          const headerText = this.tableData.columns[i];
          
          // Draw cell border
          page.drawRectangle({
            x: colX,
            y: headerRowY - rowHeight,
            width: dataColumnWidth,
            height: rowHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
          });
          
          // Truncate text if too long and center it
          const maxTextWidth = dataColumnWidth - (2 * cellPadding);
          let displayText = headerText;
          let textWidth = boldFont.widthOfTextAtSize(displayText, headerFontSize);
          
          // Truncate if necessary
          while (textWidth > maxTextWidth && displayText.length > 3) {
            displayText = displayText.substring(0, displayText.length - 1);
            textWidth = boldFont.widthOfTextAtSize(displayText + '...', headerFontSize);
          }
          if (displayText !== headerText) {
            displayText += '...';
          }
          
          // Center the text
          const textX = colX + (dataColumnWidth - textWidth) / 2;
          
          page.drawText(displayText, {
            x: Math.max(colX + cellPadding, textX),
            y: headerRowY - rowHeight + 6,
            size: headerFontSize,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
        }
        
        currentY -= rowHeight;
        
        // Draw data rows (excluding any empty rows)
        const validRows = this.tableData.rows.filter((row, index) => {
          return row && this.tableData.cell_data[index] && 
                 this.tableData.cell_data[index].some(cell => cell !== null && cell !== undefined && cell !== '');
        });
        
        console.log(`Drawing ${validRows.length} valid rows out of ${this.tableData.rows.length} total rows`);
        
        for (let rowIndex = 0; rowIndex < validRows.length; rowIndex++) {
          const originalRowIndex = this.tableData.rows.indexOf(validRows[rowIndex]);
          
          // Alternate row background
          if (rowIndex % 2 === 1) {
            page.drawRectangle({
              x: tableStartX,
              y: currentY - rowHeight,
              width: actualTableWidth,
              height: rowHeight,
              color: rgb(0.98, 0.98, 0.98),
            });
          }
          
          // Draw row border
          page.drawRectangle({
            x: tableStartX,
            y: currentY - rowHeight,
            width: actualTableWidth,
            height: rowHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
          });
          
          // Row label cell with border
          page.drawRectangle({
            x: tableStartX,
            y: currentY - rowHeight,
            width: rowLabelWidth,
            height: rowHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
          });
          
          // Row label text - truncate if too long
          const rowLabel = validRows[rowIndex];
          const maxLabelWidth = rowLabelWidth - (2 * cellPadding);
          let displayLabel = rowLabel;
          let labelWidth = boldFont.widthOfTextAtSize(displayLabel, fontSize);
          
          while (labelWidth > maxLabelWidth && displayLabel.length > 3) {
            displayLabel = displayLabel.substring(0, displayLabel.length - 1);
            labelWidth = boldFont.widthOfTextAtSize(displayLabel + '...', fontSize);
          }
          if (displayLabel !== rowLabel) {
            displayLabel += '...';
          }
          
          page.drawText(displayLabel, {
            x: tableStartX + cellPadding,
            y: currentY - rowHeight + 6,
            size: fontSize,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
          
          // Data cells
          for (let colIndex = 0; colIndex < this.tableData.columns.length; colIndex++) {
            const colX = tableStartX + rowLabelWidth + (colIndex * dataColumnWidth);
            
            // Draw cell border
            page.drawRectangle({
              x: colX,
              y: currentY - rowHeight,
              width: dataColumnWidth,
              height: rowHeight,
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 0.5,
            });
            
            // Get cell value
            const cellValue = this.tableData.cell_data[originalRowIndex] ? 
                             this.tableData.cell_data[originalRowIndex][colIndex] : '';
            
            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
              const cellText = cellValue.toString();
              
              // Check if text fits in column
              const maxCellWidth = dataColumnWidth - (2 * cellPadding);
              let displayCellText = cellText;
              let cellTextWidth = font.widthOfTextAtSize(displayCellText, fontSize);
              
              // Truncate if necessary
              while (cellTextWidth > maxCellWidth && displayCellText.length > 1) {
                displayCellText = displayCellText.substring(0, displayCellText.length - 1);
                cellTextWidth = font.widthOfTextAtSize(displayCellText, fontSize);
              }
              
              // Right align numbers, left align text
              const isNumber = !isNaN(parseFloat(cellText)) && isFinite(cellText);
              let textX;
              
              if (isNumber) {
                textX = colX + dataColumnWidth - cellTextWidth - cellPadding; // Right align
              } else {
                textX = colX + cellPadding; // Left align
              }
              
              // Apply color styling
              let textColor = rgb(0, 0, 0);
              if (this.tableData.cell_colors && 
                  this.tableData.cell_colors[originalRowIndex] && 
                  this.tableData.cell_colors[originalRowIndex][colIndex]) {
                const colorStr = this.tableData.cell_colors[originalRowIndex][colIndex];
                if (colorStr.includes('red') || colorStr.includes('#') || parseFloat(cellText) < 0) {
                  textColor = rgb(0.8, 0, 0);
                }
              }
              
              page.drawText(displayCellText, {
                x: textX,
                y: currentY - rowHeight + 6,
                size: fontSize,
                font: font,
                color: textColor,
              });
            }
          }
          
          currentY -= rowHeight;
          
          // Stop if running out of space
          if (currentY < startY - maxHeight + rowHeight) {
            console.log('Reached maximum table height, stopping at row', rowIndex + 1);
            break;
          }
        }
        
      } catch (error) {
        console.error('Error adding table to PDF:', error);
        page.drawText('Error rendering table. Please check console for details.', {
          x: x + 20,
          y: startY - 20,
          size: 10,
          color: rgb(1, 0, 0),
        });
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

/* Add styling for the fiscal year select */
.fiscal-year-select {
  padding: 5px;
  margin-left: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
</style>
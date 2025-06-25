<template>
  <div class="container">
    <div class="header">
      <div class="logo-header">
        <img class="logo" alt="National Jewish Health" src="../assets/NJ_Logo.png">
      </div>
      <div class="multiselect-container">
        <h2 class="page-heading">{{ pageHeading }}</h2>
        <div class="date-inputs">
          <label>Start Date: 
            <input 
              type="date" 
              v-model="startDate" 
              class="date-input"
            >
          </label>
          <label>End Date: 
            <input 
              type="date" 
              v-model="endDate" 
              class="date-input"
            >
          </label>
        </div>
        <div class="button-progress-container">
          <div class="button-container">
            <button class="b-button" @click="submitReport" :disabled="isLoading">
              {{ isLoading ? 'Loading...' : 'Submit' }}
            </button>
            <button class="b-button" @click="downloadData" :disabled="reportData.length === 0">
              Download Data
            </button>
            <button class="b-button" @click="printToPDF" :disabled="reportData.length === 0">
              Print to PDF
            </button>
          </div>
          <div class="progress-bar-container">
            <p :class="{ 'red-text': progress.step === 'API Server Down' || progress.step.startsWith('Failed') }">
              {{ progress.step }}
            </p> 
          </div>
        </div> 
      </div> 
    </div> 

    <div class="content-area">
      <div v-if="reportData.length > 0" class="table-container">
        <h3>Lag Time Report Results</h3>
        <div class="table-info">
          <p><strong>Status:</strong> {{ reportStatus }}</p>
          <p><strong>Message:</strong> {{ reportMessage }}</p>
          <p><strong>Rows Processed:</strong> {{ dataInfo.rows_processed }}</p>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="column in dataInfo.columns" :key="column">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in reportData" :key="index">
              <td>{{ formatDateTime(row.RunDate) }}</td>
              <td>{{ row.Department }}</td>
              <td>{{ row.Provider }}</td>
              <td>{{ row.VisitType }}</td>
              <td>{{ formatDateTime(row['1st Date Available']) }}</td>
              <td>{{ row['1st Block Type'] }}</td>
              <td>{{ row['2nd Date Available'] }}</td>
              <td>{{ formatDateTime(row['2nd Block Type']) }}</td>
              <td>{{ row['3rd Date Available'] }}</td>
              <td>{{ row['2nd Block Type'] }}</td>
              <td>{{ formatDateTime(row['3rd Date Available']) }}</td>
              <td>{{ row['3rd Block Type'] }}</td>
              <!-- <td>{{ row['3rd Block Type'] }}</td> -->
            </tr>
          </tbody>
        </table>
      </div>
    </div> 
  </div> 
</template>

<script>
import axios from 'axios';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default {
  data() {
    // Calculate default dates
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 180);

    return {
      pageHeading: 'Lag Time Report',
      startDate: this.formatDateOnly(startDate),
      endDate: this.formatDateOnly(endDate),
      progress: { step: 'Ready to generate report' },
      isLoading: false,
      reportData: [],
      reportStatus: '',
      reportMessage: '',
      dataInfo: {
        rows_processed: 0,
        columns: []
      }
    };
  },
  methods: {
    formatDateOnly(date) {
      // Format date for date input (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '';
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    },

    async submitReport() {
      try {
        this.isLoading = true;
        this.progress.step = 'Generating lag time report...';
        this.reportData = []; // Clear previous data

        const reportRequest = {
          startDate: this.startDate,
          endDate: this.endDate
        };

        console.log('Lag Time Report Request:', reportRequest);

        const response = await axios.post('http://localhost:8000/lagtime', reportRequest);
        
        console.log('Lag Time Report Response:', response.data);

        if (response.data && response.data.status === 'success') {
          this.reportStatus = response.data.status;
          this.reportMessage = response.data.message;
          this.dataInfo = response.data.data_info;
          this.reportData = response.data.data || [];
          this.progress.step = `Report generated successfully - ${this.dataInfo.rows_processed} rows processed`;
        } else {
          throw new Error('Invalid response format from server');
        }

      } catch (error) {
        console.error('Failed to generate lag time report:', error);
        this.progress.step = `Failed to generate report: ${error.message}`;
        this.reportData = [];
      } finally {
        this.isLoading = false;
      }
    },

    async downloadData() {
      this.isLoading = true;
      this.progress.step = 'Downloading lag time report...';
      try {
        console.log('downloadData method called');
        const reportRequest = {
          startDate: this.startDate,
          endDate: this.endDate,
          action: 'LagTimeDownloadData'
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
        link.setAttribute('download', 'lag-time-data.csv'); // Choose a suitable filename and extension
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        window.URL.revokeObjectURL(url);
        this.progress.step = `Report saved successfully - ${this.dataInfo.rows_processed} rows processed`;
      } catch (error) {
        console.error('Failed to download data:', error);
        this.progress.step = `Failed to download data: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    async loadLogoImage() {
      try {
        // Create a canvas to convert the image to PNG bytes
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        return new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
              const reader = new FileReader();
              reader.onload = () => resolve(new Uint8Array(reader.result));
              reader.onerror = reject;
              reader.readAsArrayBuffer(blob);
            }, 'image/png');
          };
          img.onerror = reject;
          // Use the logo from assets folder
          img.src = require('../assets/NJ_Logo.png');
        });
      } catch (error) {
        console.warn('Could not load logo image:', error);
        return null;
      }
    },

    async printToPDF() {
      try {
        this.isLoading = true;
        this.progress.step = 'Generating PDF...';

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        
        // Landscape page dimensions (11" x 8.5")
        const pageWidth = 792; // 11 inches * 72 points/inch
        const pageHeight = 612; // 8.5 inches * 72 points/inch
        
        // Embed fonts
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        // Load and embed logo
        let logoImage = null;
        try {
          const logoBytes = await this.loadLogoImage();
          if (logoBytes) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          }
        } catch (error) {
          console.warn('Could not embed logo:', error);
        }
        
        // Page layout constants
        const leftMargin = 50;
        const rightMargin = 50;
        const topMargin = 70;
        const bottomMargin = 50;
        const footerHeight = 30;
        
        const contentWidth = pageWidth - leftMargin - rightMargin;
        const contentStartY = pageHeight - topMargin;
        const contentEndY = bottomMargin + footerHeight + 10;
        
        // Table settings - increased row height for text wrapping
        const minRowHeight = 24;
        const headerRowHeight = 20;
        const cellPadding = 3;
        const fontSize = 7;
        const headerFontSize = 8;
        
        // Calculate column widths
        const columns = this.dataInfo.columns || [];
        const columnWidth = contentWidth / columns.length;
        
        // Get current date/time for footer
        const printDateTime = new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        // Calculate total pages needed with dynamic row heights
        const estimatedRowHeight = minRowHeight;
        const rowsPerPage = Math.floor((contentStartY - contentEndY - headerRowHeight) / estimatedRowHeight);
        const totalPages = Math.ceil(this.reportData.length / rowsPerPage) || 1;
        
        let currentRowIndex = 0;
        
        // Generate pages
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = pdfDoc.addPage([pageWidth, pageHeight]);
          
          // Draw header
          this.drawPageHeader(page, font, boldFont, logoImage, leftMargin, pageHeight - 30, contentWidth);
          
          // Draw footer
          this.drawPageFooter(page, font, leftMargin, rightMargin, 20, printDateTime, pageNum, totalPages);
          
          // Draw table header
          let currentY = contentStartY;
          currentY = this.drawTableHeader(page, font, boldFont, leftMargin, currentY, columnWidth, columns, headerRowHeight, cellPadding, headerFontSize);
          
          // Draw table rows for this page
          const endRowIndex = Math.min(currentRowIndex + rowsPerPage, this.reportData.length);
          
          for (let i = currentRowIndex; i < endRowIndex; i++) {
            const row = this.reportData[i];
            const rowResult = this.drawTableRowWithWrapping(page, font, leftMargin, currentY, columnWidth, columns, row, minRowHeight, cellPadding, i, fontSize);
            currentY = rowResult.newY;
            
            // Check if we're running out of space
            if (currentY < contentEndY) {
              break;
            }
          }
          
          currentRowIndex = endRowIndex;
        }
        
        // Generate PDF bytes and download
        const pdfBytes = await pdfDoc.save();
        
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'lag-time-report.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.progress.step = 'PDF generated successfully';
        
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        this.progress.step = `Failed to generate PDF: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    drawPageHeader(page, font, boldFont, logoImage, x, y, width) {
      // Draw NJ Logo (left justified)
      if (logoImage) {
        const logoHeight = 40;
        const logoWidth = logoImage.width * (logoHeight / logoImage.height);
        
        page.drawImage(logoImage, {
          x: x,
          y: y - logoHeight + 10,
          width: logoWidth,
          height: logoHeight,
        });
      } else {
        // Fallback to text if logo can't be loaded
        page.drawText('NJ Logo', {
          x: x,
          y: y,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
      
      // Draw centered page heading
      const titleText = this.pageHeading;
      const titleWidth = boldFont.widthOfTextAtSize(titleText, 20);
      const titleX = x + (width - titleWidth) / 2;
      
      page.drawText(titleText, {
        x: titleX,
        y: y,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    },

    drawPageFooter(page, font, leftMargin, rightMargin, y, printDateTime, pageNum, totalPages) {
      // Left justified print date
      page.drawText(`Printed on: ${printDateTime}`, {
        x: leftMargin,
        y: y,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      // Right justified page number
      const pageText = `Page ${pageNum} of ${totalPages}`;
      const pageTextWidth = font.widthOfTextAtSize(pageText, 10);
      const pageTextX = 792 - rightMargin - pageTextWidth; // 792 is page width
      
      page.drawText(pageText, {
        x: pageTextX,
        y: y,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    },

    drawTableHeader(page, font, boldFont, x, startY, columnWidth, columns, headerRowHeight, cellPadding, fontSize) {
      const y = startY - headerRowHeight;
      
      // Draw header background
      page.drawRectangle({
        x: x,
        y: y,
        width: columnWidth * columns.length,
        height: headerRowHeight,
        color: rgb(0.95, 0.95, 0.95),
      });
      
      // Draw header cells and text
      for (let i = 0; i < columns.length; i++) {
        const cellX = x + (i * columnWidth);
        
        // Cell border
        page.drawRectangle({
          x: cellX,
          y: y,
          width: columnWidth,
          height: headerRowHeight,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });
        
        // Header text - centered horizontally and vertically
        let headerText = columns[i];
        const maxTextWidth = columnWidth - (2 * cellPadding);
        
        // Truncate text if too long for the cell
        let textWidth = boldFont.widthOfTextAtSize(headerText, fontSize);
        while (textWidth > maxTextWidth && headerText.length > 3) {
          headerText = headerText.substring(0, headerText.length - 1);
          textWidth = boldFont.widthOfTextAtSize(headerText + '...', fontSize);
        }
        if (headerText !== columns[i]) {
          headerText += '...';
          textWidth = boldFont.widthOfTextAtSize(headerText, fontSize);
        }
        
        // Calculate centered position
        const textX = cellX + (columnWidth - textWidth) / 2; // Horizontal center
        const textY = y + (headerRowHeight - fontSize) / 2 + fontSize / 3; // Vertical center
        
        page.drawText(headerText, {
          x: textX,
          y: textY,
          size: fontSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      }
      
      return y;
    },

    drawTableRowWithWrapping(page, font, x, startY, columnWidth, columns, rowData, minRowHeight, cellPadding, rowIndex, fontSize) {
      // Prepare row data array to match the HTML table structure exactly
      const cellData = [
        this.formatDateTime(rowData.RunDate),           // RunDate
        rowData.Department,                             // Department
        rowData.Provider,                               // Provider - THIS WAS MISSING!
        rowData.VisitType,                             // VisitType
        this.formatDateTime(rowData['1st Date Available']), // 1st Date Available
        rowData['1st Block Type'],                      // 1st Block Type
        rowData['2nd Date Available'] || '',            // 2nd Date Available (raw, not formatted)
        rowData['2nd Block Type'],                      // 2nd Block Type
        rowData['3rd Date Available'] || '',            // 3rd Date Available (raw, not formatted)
        rowData['2nd Block Type'],                      // 2nd Block Type (this seems to be repeated in your HTML)
        this.formatDateTime(rowData['3rd Date Available']), // 3rd Date Available (formatted)
        rowData['3rd Block Type']                       // 3rd Block Type
      ];
      
      // Calculate required height for this row based on text wrapping
      let maxTextHeight = minRowHeight;
      const textSpacing = fontSize + 2;
      
      for (let i = 0; i < columns.length && i < cellData.length; i++) {
        const cellText = (cellData[i] || '').toString();
        const maxTextWidth = columnWidth - (2 * cellPadding);
        const lines = this.getWrappedTextLines(font, cellText, maxTextWidth, fontSize);
        const textHeight = lines.length * textSpacing + (2 * cellPadding);
        maxTextHeight = Math.max(maxTextHeight, textHeight);
      }
      
      const rowHeight = maxTextHeight;
      const y = startY - rowHeight;
      
      // Alternate row background
      if (rowIndex % 2 === 1) {
        page.drawRectangle({
          x: x,
          y: y,
          width: columnWidth * columns.length,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }
      
      // Draw data cells for this row
      for (let i = 0; i < columns.length && i < cellData.length; i++) {
        const cellX = x + (i * columnWidth);
        
        // Cell border
        page.drawRectangle({
          x: cellX,
          y: y,
          width: columnWidth,
          height: rowHeight,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });
        
        // Cell text with wrapping
        const cellText = (cellData[i] || '').toString();
        this.drawWrappedText(page, font, cellText, cellX + cellPadding, y + rowHeight - cellPadding - fontSize, columnWidth - (2 * cellPadding), fontSize, rowHeight - (2 * cellPadding));
      }
      
      return { newY: y };
    },

    getWrappedTextLines(font, text, maxWidth, fontSize) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Word is too long, truncate it
            let truncated = word;
            while (font.widthOfTextAtSize(truncated, fontSize) > maxWidth && truncated.length > 1) {
              truncated = truncated.slice(0, -1);
            }
            lines.push(truncated);
            currentLine = '';
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines.length > 0 ? lines : [''];
    },

    drawWrappedText(page, font, text, x, y, maxWidth, fontSize, maxHeight) {
      const lines = this.getWrappedTextLines(font, text, maxWidth, fontSize);
      const lineHeight = fontSize + 2;
      let currentY = y;
      
      for (let i = 0; i < lines.length; i++) {
        if (currentY - lineHeight < y - maxHeight) {
          break; // Stop if we exceed the available height
        }
        
        page.drawText(lines[i], {
          x: x,
          y: currentY,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        currentY -= lineHeight;
      }
    },

    // ...rest of existing methods remain the same...
  }
}
</script>

<style scoped>
.logo {
  width: 150px;
  height: auto;
  margin-right: 1rem;
  margin-bottom: 1.5rem;
}

.logo-header {
  display: flex;
  align-items: center;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
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
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.date-inputs {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.date-input {
  margin-left: 0.5rem;
  padding: 0.25rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.button-progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.progress-bar-container {
  text-align: center;
  padding: 0 1rem;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
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

.table-container {
  width: 95%;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.table-info {
  background-color: #f8f9fa;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
  border: 1px solid #dee2e6;
}

.table-info p {
  margin: 0.25rem 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.data-table th,
.data-table td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
  vertical-align: top;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.data-table tr:hover {
  background-color: #e9ecef;
}

.b-button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.3s ease-in-out;
  cursor: pointer;
  min-width: 120px;
}

.b-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.b-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.red-text {
  color: red;
}

/* Responsive design */
@media (max-width: 768px) {
  .multiselect-container {
    max-width: 95vw;
  }
  
  .date-inputs {
    flex-direction: column;
    align-items: center;
  }
  
  .button-container {
    flex-direction: column;
    align-items: center;
  }
  
  .table-container {
    width: 100%;
  }
  
  .data-table {
    font-size: 0.875rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 6px;
  }
}
</style>
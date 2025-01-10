<template>
  <div class="container">
    <div class="file-upload">
      <label for="csvFile">Upload CSV (optional):</label>
      <input type="file" id="csvFile" accept=".csv" @change="handleCsvUpload" />
      <div v-if="uploadError" class="error-message">{{ uploadError }}</div>
    </div>
    <GenericTableUpdater
      :table-config="payPeriodTableConfig"
      :initial-data="tableData"
      @update-item="updatePayPeriod"
    />
  </div>
</template>

<script>
import GenericTableUpdater from '@/components/GenericTableUpdater';
import Papa from 'papaparse';
import axios from 'axios'; // Import axios

export default {
  components: {
    GenericTableUpdater,
  },
  data() {
    return {
      tableData: [],
      uploadError: null,
      payPeriodTableConfig: {
        tableName: 'PayPeriod',
        displayName: 'Pay Periods',
        idField: 'ID',
        displayField: 'Period',
        apiBaseUrl: 'http://localhost:8000',
        fields: [
          { name: 'ID', label: 'ID', type: 'number', readonly: true },
          { name: 'Period', label: 'Period', type: 'number', required: true },
          { name: 'Period_End_Date', label: 'Period End Date', type: 'text', required: true },
          { name: 'Period_Hours', label: 'Period Hours', type: 'number', required: true },
          { name: 'Year', label: 'Year', type: 'number', required: true },
        ],
      },
    };
  },
  methods: {
    handleCsvUpload(event) {
        console.log("Uploading CSV...");
        this.uploadError = null;
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvData = event.target.result;
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        this.uploadError = "Error parsing CSV: " + results.errors.map(e => e.message).join(", ");
                        return;
                    }
                    // eslint-disable-next-line
                    this.tableData = results.data.map(({ ID, ...rest }) => rest); // Correct way
                    console.log("CSV data parsed successfully:", this.tableData);
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                    this.uploadError = "An unexpected error occurred during CSV parsing.";
                },
            });
        };
        reader.readAsText(file);
    },
    updatePayPeriod(data) {
      // Send data to FastAPI backend
      console.log("Updating Pay Period:", data)
      try {
        console.log(`Updating PayPeriod:`, data);
        console.log(`${this.payPeriodTableConfig.apiBaseUrl}/${this.payPeriodTableConfig.tableName}-update/`, data);
         // Send a POST request to the FastAPI backend
        axios.post(`${this.payPeriodTableConfig.apiBaseUrl}/${this.payPeriodTableConfig.tableName}-update/`, data).then(response => {
          console.log(`PayPeriod updated:`, response.data);
        })
      }
      catch (error) {
        console.error(`Error updating PayPeriod:`, error);
      }
    },
  },
};
</script>

<style scoped>
/* ... (styles remain the same) */
.error-message {
  color: red;
  margin-top: 5px;
}
</style>
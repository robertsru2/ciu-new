<template>
  <div class="container">
    <h1>{{ pageHeading }}</h1>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="departments">Departments:</label>
        <multiselect 
          ref="departmentsMultiselect"
          v-model="selectedDepartments" 
          :options="departments" 
          :multiple="true" 
          :close-on-select="false" 
          placeholder="Select Department"
          label="DepartmentLevel"
          track-by="DepartmentLevel"
          @update:modelValue="clearOtherSelections('department')"
        />
      </div>
      <div class="form-group">
        <label for="divisions">Divisions:</label>
        <multiselect 
          ref="divisionsMultiselect"
          v-model="selectedDivisions" 
          :options="divisions" 
          :multiple="true" 
          :close-on-select="false" 
          placeholder="Select Division"
          label="DivisionNM"
          track-by="DivisionNM"
          @update:modelValue="clearOtherSelections('division')"
        />
      </div>
      <div class="form-group">
        <label for="providers">Providers:</label>
        <multiselect 
          ref="providersMultiselect"
          v-model="selectedProviders" 
          :options="providers" 
          :multiple="true" 
          :close-on-select="false" 
          placeholder="Select Provider"
          track-by="ProviderID"
          :custom-label="providerLabel"
          @update:modelValue="clearOtherSelections('provider')"
        >
          <template #option="{ option }">
            {{ option.ProviderID }} - {{ option.ProviderNM }}
          </template>
          <template #selected="{ option }">
            {{ option.ProviderID }} - {{ option.ProviderNM }}
          </template>
        </multiselect>
      </div>
      <div class="form-group">
        <label for="startDate">Start Date:</label>
        <input type="date" v-model="startDate" id="startDate" class="form-control" />
      </div>
      <div class="form-group">
        <label for="endDate">End Date:</label>
        <input type="date" v-model="endDate" id="endDate" class="form-control" />
      </div>
      <div class="button-group">
        <button type="submit" class="btn btn-primary">Submit</button>
        <button type="button" class="btn btn-secondary" @click="downloadData">Download Data</button>
      </div>
    </form>
    <div v-if="htmlResponse" v-html="htmlResponse"></div>
  </div>
</template>

<script>
import axios from 'axios';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';

export default {
  components: {
    Multiselect
  },
  data() {
    return {
      htmlResponse: '', // Add a data property to store the HTML content
      pageHeading: 'APP Time Report',
      departments: [],
      divisions: [],
      providers: [],
      selectedDepartments: [],
      selectedDivisions: [],
      selectedProviders: [],
      selectedDepartment: 'DOM',
      selectedDivision: '',
      selectedProvider: '',
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().substr(0, 10),
      endDate: (() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 6);
        return date.toISOString().substr(0, 10);
      })(),
    };
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:8000/dashboard-ciu'); // replace with your server's URL
      this.departments = response.data.departments;
      this.divisions = response.data.divisions;
      // Fetch providers with current_year and provider_type parameters
      const response2 = await axios.get('http://localhost:8000/providers', {
        params: {
          current_year: 2025,
          provider_type: 'APP'
        }
      });
      this.providers = response2.data;
    console.log('Server is up');
    } catch (error) {
      console.log('Server is down');
      this.progress.step = 'API Server Down';
    }
  },
  methods: {
    async submitForm() {
      try {
        console.log('Form submitted with:', this.filterIDValue, this.filterLevel, this.startDate, this.endDate);
        const response = await axios.post('http://localhost:8000/app-time/', {
            action: 'createAPPReport',
            startDate: this.startDate,
            endDate: this.endDate,
            filter_id_value: this.filterIDValue,
            filter_level: this.filterLevel,       // DepartmentLevel, DivisionNM, BillingProviderID
        });
        this.htmlResponse = this.formatResponse(response.data);
      } catch (error) {
        console.error('Error fetching APP Time Report:', error);
      }
    },
    formatResponse(data) {
      let html = '<table class="table table-striped">';
      html += '<thead><tr>';
      html += '<th>Provider ID</th><th>Provider Name</th><th>Division</th><th>Month/Year</th><th>Period</th><th>Available Time</th><th>Extra Time</th><th>Expected Hours</th><th>Difference</th><th>Difference Percent</th><th>Department Level</th><th>Provider Category</th>';
      html += '</tr></thead><tbody>';
      data.forEach(row => {
        html += '<tr>';
        html += `<td>${row.ProviderID}</td><td>${row.ProviderNM}</td><td>${row.DivisionNM}</td><td>${row.Month_Year}</td><td>${row.Period}</td><td>${row.Available_Time}</td><td>${row.Extra_Time}</td><td>${row.Exp_Hrs_PayPeriod}</td><td>${row.Difference}</td><td>${row.Difference_Percent}</td><td>${row.DepartmentLevel}</td><td>${row.ProviderCategory}</td>`;
        html += '</tr>';
      });
      html += '</tbody></table>';
      return html;
    },
    providerLabel(provider) {
      return `${provider.ProviderNM} - ${provider.ProviderID}`;
    },
    onDepartmentsChange() {
      if (this.selectedDepartments.length > 0) {
        console.log('Departments changed');      
        this.selectedDivisions = [];
        this.selectedProviders = [];
      } else if (this.selectedDepartments.length === 0) {
        console.log('Departments changed outside of Length()');
      }
    },
    onDivisionsChange() {
      if (this.selectedDivisions.length > 0) {
        console.log('Divisions changed', this.selectedDivisions);
        this.selectedDepartments = [];
        this.selectedProviders = [];
      }
    },
    onProvidersChange() {
      if (this.selectedProviders.length > 0) {
        console.log('Providers changed', this.selectedProviders);
        this.selectedDepartments = [];
        this.selectedDivisions = [];
      }
    },
    clearOtherSelections(selected) {
    if (selected === 'department') {
      this.selectedDivisions = [];
      this.selectedProviders = [];
      if (this.selectedDepartments.length > 0) {
        this.filterIDValue = this.selectedDepartments
          .map(department => department.DepartmentLevel)
          .join('|');
        this.filterLevel = 'DepartmentLevel';
        console.log('Selected Departments:', this.selectedDepartments);
      }
    } else if (selected === 'division') {
      this.selectedDepartments = [];
      this.selectedProviders = [];
      if (this.selectedDivisions.length > 0) {
        this.filterIDValue = this.selectedDivisions
          .map(division => division.DivisionNM)
          .join('|');
        this.filterLevel = 'DivisionNM';
      }
    } else if (selected === 'provider') {
      this.selectedDivisions = [];
      this.selectedDepartments = [];
      this.filterIDValue = this.selectedProviders
        .map(provider => provider.ProviderID)
        .join('|');
      this.filterLevel = 'ProviderID';
      console.log('Selected Providers:', this.filterIDValue);
    } else {
      console.log('No selection made');
    }
  },
  async downloadData() {
    try {
      console.log('APP downloadData method called')
      const reportRequest = {
        startDate: this.startDate,
        endDate: this.endDate,
        action: 'APPTimeDownloadData',
        filter_id_value: this.filterIDValue,
        filter_level: this.filterLevel
      };
      console.log(reportRequest)
      const response = await axios.post('http://localhost:8000/dashboard-get-file-new/', reportRequest, {
        responseType: 'blob', // Important for creating a downloadable file
      });
      // Create a blob URL representing the data
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a link element and programmatically click it to start the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'data.xlsx'); // Choose a suitable filename and extension
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download data:', error);
    }
  },
 },
};
</script>

<style scoped>
.container {
  padding: 20px;
  text-align: left; /* Ensure all text is left-aligned */
}

.form-group {
  margin-bottom: 15px;
  text-align: left; /* Ensure form labels and inputs are left-aligned */
}

.table {
  margin-top: 20px;
  text-align: left; /* Ensure table text is left-aligned */
}

.button-group {
  display: flex;
  justify-content: space-between; /* Evenly space the buttons horizontally */
  align-items: center; /* Align items vertically in the center */
  gap: 10px; /* Add some space between the buttons */
}
</style>
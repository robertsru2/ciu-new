<template>
  <div class="container">
    <div class="tree-view-wrapper">
      <h2>Providers</h2>
      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search Providers"
          class="search-input"
        />
        <button @click="clearSearch" class="btn btn-secondary clear-button">
          Clear Search
        </button>
      </div>
      <div class="tree-view-container">
        <ul>
          <li
            v-for="provider in filteredProviders"
            :key="provider.ProviderID"
            @click="confirmNavigation(provider)"
            :class="{ selected: provider.ProviderID === selectedProviderID }"
          >
            {{ provider.ProviderNM }}
          </li>
        </ul>
      </div>
      <div class="button-group">
        <button @click="createNewProvider" class="btn btn-primary new-button">
          New
        </button>
        <button @click="deleteProvider" class="btn btn-danger delete-button">
          Delete
        </button>
      </div>
    </div>
    <div class="form-container-wrapper">
      <h1>Update Provider</h1>
      <div class="form-container">
        <form @submit.prevent="updateProvider" class="form-grid">
          <div v-for="field in fields" :key="field.name" class="form-group">
            <label :for="field.name" class="form-label">{{ field.label }}</label>
            <div class="form-input">
              <input
                v-if="field.type !== 'textarea'"
                :type="field.type"
                class="form-control"
                :id="field.name"
                v-model="provider[field.name]"
                :maxlength="field.name === 'ProviderID' ? 7 : null"
                :readonly="field.name === 'FiscalYear'"
                :step="field.type === 'number' ? 'any' : null"
                @input="handleInputChange(field.name)"
              />
              <textarea
                v-else
                class="form-control"
                :id="field.name"
                v-model="provider[field.name]"
                @input="handleInputChange(field.name)"
              ></textarea>
            </div>
          </div>
        </form>
      </div>
      <button @click="updateProvider" class="btn btn-primary update-button">
        Update Provider
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      providers: [],
      provider: {
        ID: null,
        ProviderID: '',
        ProviderNM: '',
        PrimaryDepartmentID: '',
        DepartmentNM: '',
        ProviderTypeNM: '',
        ProviderTypeDSC: '',
        DoctorDegreeNM: '',
        ProviderCategory: '',
        DivisionNM: '',
        Subspecialty: '',
        DepartmentLevel: 'DOM',
        ExpectedHours: 0.0,
        ExpectedNew: 0,
        ExpectedFU: 0,
        ExpectedRVU: 0.0,
        AmbulatoryFTE: 0.0,
        cFTE: 0.0,
        FiscalYear: 0,
        FMLACompHours: 0.0,
        Active: 1,
        UpdateDate: '',
      },
      fields: [
        { name: 'ProviderID', label: 'Provider ID', type: 'text' },
        { name: 'ProviderNM', label: 'Provider Name', type: 'text' },
        { name: 'PrimaryDepartmentID', label: 'Primary Department ID', type: 'text' },
        { name: 'DepartmentNM', label: 'Department Name', type: 'text' },
        { name: 'ProviderTypeNM', label: 'Provider Type Name', type: 'text' },
        { name: 'ProviderTypeDSC', label: 'Provider Type Description', type: 'text' },
        { name: 'DoctorDegreeNM', label: 'Doctor Degree Name', type: 'text' },
        { name: 'ProviderCategory', label: 'Provider Category', type: 'text' },
        { name: 'DivisionNM', label: 'Division Name', type: 'text' },
        { name: 'Subspecialty', label: 'Sub Specialty', type: 'text' },
        { name: 'DepartmentLevel', label: 'Department Level', type: 'text' },
        { name: 'ExpectedHours', label: 'Expected Hours', type: 'number' },
        { name: 'ExpectedNew', label: 'Expected New', type: 'number' },
        { name: 'ExpectedFU', label: 'Expected Follow-Up', type: 'number' },
        { name: 'ExpectedRVU', label: 'Expected RVU', type: 'number' },
        { name: 'AmbulatoryFTE', label: 'Ambulatory FTE', type: 'number' },
        { name: 'cFTE', label: 'Clinical FTE', type: 'number' },
        { name: 'FiscalYear', label: 'Fiscal Year', type: 'number' },
        { name: 'FMLACompHours', label: 'FMLA Comp Hours', type: 'number' },
        { name: 'Active', label: 'Active', type: 'number' },
      ],
      selectedProviderID: null,
      currentFiscalYear: this.getCurrentFiscalYear(),
      searchQuery: '',
      formChanged: false, // Track if form has been changed
      pendingProvider: null, // Track the provider to navigate to
    };
  },
  computed: {
    filteredProviders() {
      return this.providers.filter((provider) =>
        provider.ProviderNM.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },
  async created() {
    this.fetchProviders();
  },
  mounted() {
    console.log('Adding beforeunload event listener');
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    // Additional debugging to check if the event listener is attached
    window.addEventListener('beforeunload', () => {
      console.log('beforeunload event triggered');
    });
    console.log('window.onbeforeunload beforeunload event listener added');
    window.onbeforeunload = this.beforeUnloadHandler;
  },
  beforeUnmount() {
    console.log('Removing beforeunload event listener');
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    console.log('window.onbeforeunload = null Removing beforeunload event listener');
    window.onbeforeunload = null;
  },
  methods: {
    getCurrentFiscalYear() {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = currentDate.getFullYear();

      // Fiscal year determination
      if (currentMonth >= 7) {
        return currentYear + 1;
      } else {
        return currentYear;
      }
    },
    async fetchProviders() {
      try {
        const response = await axios.get(`http://localhost:8000/providers`, {
          params: {
            fiscal_year: this.currentFiscalYear, // Ensure the parameter name matches what the backend expects
          },
        });
        console.log('Providers from API:', response.data);
        this.providers = response.data;
        console.log('Assigned Providers:', this.providers);
        if (this.providers.length > 0) {
          this.selectProvider(this.providers[0]); // Set the provider data to the first provider
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    },
    selectProvider(provider) {
      this.provider = { ...provider };
      this.selectedProviderID = provider.ProviderID;
      this.formChanged = false; // Reset form changed flag
    },
    createNewProvider() {
      this.provider = {
        ID: null,
        ProviderID: '',
        ProviderNM: '',
        PrimaryDepartmentID: '',
        DepartmentNM: '',
        ProviderTypeNM: '',
        ProviderTypeDSC: '',
        DoctorDegreeNM: '',
        ProviderCategory: '',
        DivisionNM: '',
        Subspecialty: '',
        DepartmentLevel: 'DOM',
        ExpectedHours: 1472.0,
        ExpectedNew: 0,
        ExpectedFU: 0,
        ExpectedRVU: 3700.0,
        AmbulatoryFTE: 1.0,
        cFTE: 1.0,
        FiscalYear: this.getCurrentFiscalYear(),
        FMLACompHours: 0.0,
        Active: 1,
        UpdateDate: '',
      };
      this.selectedProviderID = null;
      this.formChanged = false; // Reset form changed flag
      console.log('New provider created:', this.provider);
    },
    async updateProvider() {
      try {
        // Explicitly convert numeric fields to floats before sending to API
        this.provider.ExpectedRVU = parseFloat(
          this.provider.ExpectedRVU
        ).toFixed(1);
        this.provider.ExpectedHours = parseFloat(
          this.provider.ExpectedHours
        ).toFixed(1);
        this.provider.AmbulatoryFTE = parseFloat(
          this.provider.AmbulatoryFTE
        ).toFixed(1);
        this.provider.cFTE = parseFloat(this.provider.cFTE).toFixed(1);
        this.provider.FMLACompHours = parseFloat(
          this.provider.FMLACompHours
        ).toFixed(1);
        this.provider.UpdateDate = new Date().toISOString();
        console.log('Provider updated:', this.provider);
        const response = await axios.post(
          'http://localhost:8000/providers-update/',
          this.provider
        );
        console.log('Provider updated:', response.data);
        this.clearSearch()
        this.fetchProviders(); // Fetch the updated list of providers
        this.formChanged = false; // Reset form changed flag
      } catch (error) {
        console.error('Error updating provider:', error);
      }
    },
    async deleteProvider() {
      if (confirm('Are you sure you want to delete this provider?')) {
        try {
          const response = await axios.delete(
            `http://localhost:8000/providers-delete/${this.provider.ID}`
          );
          console.log('Provider deleted:', response.data);
          this.fetchProviders(); // Fetch the updated list of providers
        } catch (error) {
          console.error('Error deleting provider:', error);
        }
      }
    },
    clearSearch() {
      this.searchQuery = '';
    },
    formatProviderID() {
      this.provider.ProviderID = this.provider.ProviderID.replace(/\D/g, '').slice(0, 7);
    },
    formatToUpperCase(fieldName) {
      if (typeof this.provider[fieldName] === 'string') {
        this.provider[fieldName] = this.provider[fieldName].toUpperCase();
      }
    },
    handleInputChange(fieldName) {
      this.formChanged = true; // Set form changed flag
      console.log('Field changed:', fieldName);
      if (fieldName === 'ProviderID') {
        this.formatProviderID();
      } else {
        this.formatToUpperCase(fieldName);
      }
    },
    beforeUnloadHandler(event) {
      console.log('beforeUnloadHandler called');
      if (this.formChanged) {
        const message =
          'You have unsaved changes. Are you sure you want to leave?';
        event.returnValue = message; // Standard for most browsers
        return message; // For some older browsers
      } else {
        console.log('No changes detected in beforeUnloadHandler');
        return undefined;
      }
    },
    confirmNavigation(provider) {
      if (this.formChanged) {
        this.pendingProvider = provider;
        if (
          confirm(
            'You have unsaved changes. Do you want to discard them and navigate away?'
          )
        ) {
          this.navigateToProvider();
        }
      } else {
        this.selectProvider(provider);
      }
    },
    navigateToProvider() {
      if (this.pendingProvider) {
        this.selectProvider(this.pendingProvider);
        this.pendingProvider = null;
      }
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
  gap: 20px;
  height: 100vh; /* Adjust the height as needed */
  justify-content: center;
  align-items: center;
}

.tree-view-wrapper,
.form-container-wrapper {
  height: 90%;
}

.tree-view-wrapper {
  display: flex;
  flex-direction: column;
  width: 33%;
  flex: 1; /* Ensure it takes up the remaining space */
}

.search-container {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.search-input {
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
  flex: 1;
}

.clear-button {
  padding: 5px 10px;
  height: 100%; /* Match the height of the input field */
}

.tree-view-container {
  overflow-y: auto;
  resize: horizontal;
  flex: 1;
  border-right: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tree-view-container ul {
  list-style: none;
  padding: 0;
}

.tree-view-container li {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 3px;
  transition: background-color 0.3s, color 0.3s;
}

.tree-view-container li:hover {
  background-color: #e0e0e0;
}

.tree-view-container li.selected {
  background-color: #007bff;
  color: white;
}

.form-container-wrapper {
  display: flex;
  flex-direction: column;
  width: 67%;
  background-color: #f9f9f9;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  justify-content: space-between;
}

.form-container {
  flex: 1;
  overflow-y: auto;
}

.update-button {
  align-self: center;
  margin-top: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px; /* Decreased gap between fields */
}

.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 5px; /* Decreased margin between fields */
}

.form-label {
  flex: 1;
  margin-right: 10px;
  font-weight: bold;
  text-align: right;
}

.form-input {
  flex: 2;
}

.full-width {
  grid-column: span 2;
}

.form-control {
  width: 100%;
}

.button-group {
  display: flex;
  justify-content: flex-start; /* Align buttons horizontally */
  align-items: center; /* Align vertically with flex items */
  gap: 10px;
}

.new-button {
    margin-top: 0; /* Reset the margin */
}

.delete-button {
  margin-top: 0; /* Reset the margin */
}
</style>
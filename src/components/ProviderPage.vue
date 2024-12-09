<template>
  <div class="container">
    <div class="tree-view-wrapper">
      <h2>Providers</h2>
      <div class="tree-view-container">
        <ul>
          <li v-for="provider in providers" :key="provider.ProviderID" @click="selectProvider(provider)" :class="{ selected: provider.ProviderID === selectedProviderID }">
            {{ provider.ProviderNM }}
          </li>
        </ul>
      </div>
      <button @click="createNewProvider" class="btn btn-primary new-button">New</button>
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
              />
              <textarea
                v-else
                class="form-control"
                :id="field.name"
                v-model="provider[field.name]"
              ></textarea>
            </div>
          </div>
        </form>
      </div>
      <button @click="updateProvider" class="btn btn-primary update-button">Update Provider</button>
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
        ProviderID: '',
        ProviderNM: '',
        PrimaryDepartmentID: '',
        DepartmentNM: '',
        ProviderTypeNM: '',
        ProviderTypeDSC: '',
        DoctorDegreeNM: '',
        ProviderCategory: '',
        DivisionNM: '',
        SubSpeciaity: '',
        DepartmentLevel: '',
        ExpectedHours: 0,
        ExpectedNew: 0,
        ExpectedFU: 0,
        ExpectedRVU: 0,
        AmbulatoryFTE: 0,
        cFTE: 0,
        FiscalYear: 0,
        FMLACompHours: 0,
        Active: 1
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
        { name: 'SubSpeciaity', label: 'Sub Specialty', type: 'text' },
        { name: 'DepartmentLevel', label: 'Department Level', type: 'text' },
        { name: 'ExpectedHours', label: 'Expected Hours', type: 'number' },
        { name: 'ExpectedNew', label: 'Expected New', type: 'number' },
        { name: 'ExpectedFU', label: 'Expected Follow-Up', type: 'number' },
        { name: 'ExpectedRVU', label: 'Expected RVU', type: 'number' },
        { name: 'AmbulatoryFTE', label: 'Ambulatory FTE', type: 'number' },
        { name: 'cFTE', label: 'Clinical FTE', type: 'number' },
        { name: 'FiscalYear', label: 'Fiscal Year', type: 'number' },
        { name: 'FMLACompHours', label: 'FMLA Comp Hours', type: 'number' },
        { name: 'Active', label: 'Active', type: 'number' }
      ],
      selectedProviderID: null
    };
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:8000/providers');
      console.log('Providers:', response.data);
      this.providers = response.data;
      console.log('Assigned Providers:', this.providers);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  },
  methods: {
    selectProvider(provider) {
      this.provider = { ...provider };
      this.selectedProviderID = provider.ProviderID;
    },
    createNewProvider() {
      this.provider = {
        ProviderID: '',
        ProviderNM: '',
        PrimaryDepartmentID: '',
        DepartmentNM: '',
        ProviderTypeNM: '',
        ProviderTypeDSC: '',
        DoctorDegreeNM: '',
        ProviderCategory: '',
        DivisionNM: '',
        SubSpeciaity: '',
        DepartmentLevel: '',
        ExpectedHours: 0,
        ExpectedNew: 0,
        ExpectedFU: 0,
        ExpectedRVU: 0,
        AmbulatoryFTE: 0,
        cFTE: 0,
        FiscalYear: 0,
        FMLACompHours: 0,
        Active: 1
      };
      this.selectedProviderID = null;
    },
    async updateProvider() {
      try {
        const response = await axios.post('http://localhost:8000/providers', this.provider);
        console.log('Provider updated:', response.data);
      } catch (error) {
        console.error('Error updating provider:', error);
      }
    }
  }
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

.new-button {
  margin-top: 10px;
  align-self: center;
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
</style>
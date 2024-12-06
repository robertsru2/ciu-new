<template>
  <div>
    <h1>CIU Reports</h1>
    <p>Clinical Information Update Reports Page.</p>
    <div class="container">
      <div class="report-creation">
        <div class="date-container">
          <label>Start Date: <input type="date" v-model="startDate" min="2023-05-01" class="date-input"></label>
          <label>End Date: <input type="date" v-model="endDate" min="2023-07-01" class="date-input"></label>
        </div>
        <div class="form-row">
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
              @update:modelValue="onDepartmentsChange"
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
              placeholder="Select divisions"
              label="DivisionNM"
              track-by="DivisionNM"
              @update:modelValue="onDivisionsChange"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="providertype">Provider Type:</label>
          <multiselect 
            ref = "providertypesMultiselect"
            v-model="selectedProviderTypes" 
            :options="providertypes" 
            :multiple="true" 
            :close-on-select="false" 
            placeholder="Select Provider Type"
            label="ProviderCategory"
            track-by="ProviderCategory"
            @update:modelValue="onProviderTypeChange"
          />
        </div>
        <div class="form-group">
          <label for="providers">Provider:</label>
          <multiselect 
            ref="providersMultiselect"
            v-model="selectedProviders" 
            :options="providers" 
            :multiple="true" 
            :close-on-select="false" 
            placeholder="Select Provider(s)"
            track-by="ProviderID"
            :custom-label="providerLabel"
            @update:modelValue="onProvidersChange"
          >
            <template #option="{ option }">
              {{ option.ProviderNM }} - {{ option.ProviderID }}
            </template>
            <template #selected="{ option }">
              {{ option.ProviderNM }} - {{ option.ProviderID }}
            </template>
          </multiselect>
        </div>
        <div class="progress-container">
          <p>{{ progress1.step }}</p>
          <progress :value="progress1.current" :max="progress1.total"></progress>
          <p>{{ progress1.current }} / {{ progress1.total }}</p>
        </div>
        <b-button @click="createReports" variant="primary">Create Reports</b-button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
    <div class="selection-string">
      <p>Filter ID Value: {{ filterIDValue }}</p>
      <p>Filter Level: {{ filterLevel }}</p>
    </div>
    <div class="container">
      <div class="multiselect-container">
        <div class="form-check" v-for="file in files" :key="file.value">
          <input class="form-check-input" type="checkbox" :value="file.value" v-model="selectedFiles">
          <label class="form-check-label">{{ file.text }}</label>
        </div>
      </div>
      <div class="progress-container2">
        <p>Files Selected: {{ selectedFiles.length }}</p>
        <div class="button-container">
          <b-button @click="printReports" variant="primary">Print Reports</b-button>
          <b-button @click="emailReports" variant="primary">Email Reports</b-button>
        </div>
        <div class="progress-bar-container">
            <p>{{ progress2.step }}</p>
            <progress :value="progress2.current" :max="progress2.total"></progress>
            <p>{{ progress2.current }} / {{ progress2.total }}</p>
        </div>
    </div>
    </div>
  </div>
  </div>
</template>

<script>
import axios from 'axios'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
  //import config from '/config.json'; // adjust the path according to your file structure
   
  export default {
    components: {
      Multiselect
    },
    data() {
      let now = new Date();
      let endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        departments: [],
        divisions: [],
        providers: [],
        providertypes: [],
        selectedDepartments: [],
        selectedDivisions: [],
        selectedProviders: [],
        selectedProviderTypes: [], 
        socket: null,
        socket2: null,
        socket3: null,                
        files: [],
        selectedFiles: [],
        logMessages: [],
        startDate: '2023-07-01', //config.start_date,
        endDate: endDate.toISOString().substr(0, 10), // Use the calculated endDate here
        progress1: { current: 0, total: 0, step: 'Report Creation Progress Bar' },
        progress2: { current: 0, total: 0, step: 'Report Printing Progress Bar' },
        errorMessage: '',
        filterIDValue: 'DOM',
        filterLevel: 'DepartmentLevel',       // DepartmentLevel, DivisionNM, ProviderID
      }
    },
    async created() {
      try {
        const response = await axios.get('http://localhost:8000/dashboard-ciu')
        this.departments = response.data.departments;
        this.divisions = response.data.divisions;
        this.providers = response.data.providers;
        this.providertypes = response.data.providertypes;
        console.log('Server is up');
        console.log('Departments response:', response.data.departments); // Debugging line
        console.log('Divisions response:', response.data.divisions); // Debugging line
        console.log('Providers response:', response.data.providers); // Debugging line
        console.log('Provider Types response:', response.data.providertypes); // Debugging line
      } catch (error) {
        console.log('Server is down');
        this.progress1, 'step', 'API Server Down'; // Ensure progress1 is defined before setting its properties
        this.progress2, 'step', 'API Server Down'; // Ensure progress2 is defined before setting its properties

      }
      try {
        await axios.get('http://localhost:8000/load_files'); // replace with your server's URL
        console.log('Server is up');
      } catch (error) {
        console.log('Server is down');
        this.progress1.step = 'API Server Down';
        this.progress2.step = 'API Server Down';
      }
      this.loadFiles();

        try {
        console.log('Before axios.get')
        const response = await axios.get('http://localhost:8000/load_files')
        console.log('After axios.get')
        console.log('Response:', response.data)
        this.files = response.data.map(file => ({ text: file, value: file }))
        this.selectedFiles = this.files.map(file => file.value)
    } catch (error) {
        console.error(error)
      }
    },
    
    watch: {
        files: {
            handler() {
            this.loadFiles();
            },
            deep: true
        }
    },    
        methods: {
          validateDates() {
            if (this.startDate && this.endDate && this.startDate > this.endDate) {
              this.errorMessage = 'End date must be later than start date.';
            } else {
              this.errorMessage = '';
              this.createReports();
            }
          },
            async loadFiles() {
            try {
                const response = await axios.get('http://localhost:8000/load_files');
                const newFiles = response.data.map(file => ({ text: file, value: file }));
                if (newFiles.length === 0) {
                  newFiles.push({ text: 'No Files to Print', value: 'No Files to Print' });
                }
                if (JSON.stringify(newFiles) !== JSON.stringify(this.files)) {
                    this.files = newFiles;
                    this.selectedFiles = this.files.map(file => file.value);            
                    }
                } catch (error) {
                console.error(error);
            }
        },
        createReports() {
            if (this.socket) {
                this.socket.close();
            }

            this.socket = new WebSocket('ws://localhost:8000/create-reports');

            this.socket.onopen = () => {
            // Build the filterIDValue and filterLevel based on the selected departments, divisions, and providers
            if (this.selectedDepartments.length > 0) {
                this.filterIDValue = this.selectedDepartments
                  .map(department => department.DepartmentLevel)
                  .join('|') 
                  + (this.selectedProviderTypes.Length > 0 
                    ? '|' + this.selectedProviderTypes
                      .map(providertype => providertype.ProviderCategory)
                      .join('|') 
                    : '');
                this.filterLevel = 'DepartmentLevel' + (this.selectedProviderTypes.Length > 0 ? '|' + 'ProviderCategory' : '');
                console.log('Selected Departments:', this.selectedDepartments);
                console.log('Selected Provider Types:', this.selectedProviderTypes);
              } else if (this.selectedDivisions.length > 0) {
                this.filterIDValue = this.selectedDivisions
                  .map(division => division.DivisionNM).join('|') 
                  + (this.selectedProviderTypes.Length > 0 
                    ? '|' + this.selectedProviderTypes
                      .map(providertype => providertype.ProviderCategory)
                      .join('|') 
                    : '');
                this.filterLevel = 'DivisionNM' + (this.selectedProviderTypes.Length > 0 ? '|' + 'ProviderCategory' : '')
                ;
            } else if (this.selectedProviders.length > 0) {
                this.filterIDValue = this.selectedProviders.map(provider =>provider.ProviderID).join('|');
                this.filterLevel = 'BillingProviderID'
                console.log('Selected Providers:', this.filterIDValue);
            } 
            console.log('Filter ID Value:', this.filterIDValue);
            console.log('Filter Level:', this.filterLevel);
            const reportRequest = {
                action: 'createReports',
                startDate: this.startDate,
                endDate: this.endDate,
                filterIDValue: this.filterIDValue,
                filterLevel: this.filterLevel,       // DepartmentLevel, DivisionNM, BillingProviderID

                //filter_level: 'BillingProviderID',
                //filter_id_value: '9999999'    // Pass a number in so RVUGraph error parsing doesn't trigger.


            };
            this.socket.send(JSON.stringify(reportRequest));
            };

            this.socket.onmessage = (event) => {
            this.progress1 = JSON.parse(event.data);
            };

            this.socket.onerror = (event) => {
            console.error('WebSocket error:', event);
            };

            this.socket.onclose = () => {
            console.log('WebSocket connection closed');
            this.loadFiles();
            };
        },
        printReports() {
            if (this.socket2) {
                this.socket2.close();
            }

            this.socket2 = new WebSocket('ws://localhost:8000/print-reports');

            this.socket2.onopen = () => {
            const reportRequest = {
                selectedFiles: this.selectedFiles
            };
            this.socket2.send(JSON.stringify(reportRequest));
            };

            this.socket2.onmessage = (event) => {
            this.progress2 = JSON.parse(event.data);
            };

            this.socket2.onerror = (event) => {
            console.error('WebSocket error:', event);
            };

            this.socket2.onclose = () => {
            console.log('WebSocket connection closed');
            };
        },
        emailReports() {
            if (this.socket3) {
                this.socket3.close();
            }

            this.socket3 = new WebSocket('ws://localhost:8000/email-reports');

            this.socket3.onopen = () => {
            const reportRequest = {
                selectedFiles: this.selectedFiles
            };
            this.socket3.send(JSON.stringify(reportRequest));
            };

            this.socket3.onmessage = (event) => {
            this.progress2 = JSON.parse(event.data);
            };

            this.socket3.onerror = (event) => {
            console.error('WebSocket error:', event);
            };

            this.socket3.onclose = () => {
            console.log('WebSocket connection closed');
            };
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
        onProviderTypeChange() {
          if (this.selectedProviderTypes.length > 0) {
            console.log('Provider Types changed', this.selectedProviderTypes);
            this.selectedProviders = [];
          }
        },
        onProvidersChange() {
          if (this.selectedProviders.length > 0) {
            console.log('Providers changed', this.selectedProviders);
            this.selectedDepartments = [];
            this.selectedDivisions = [];
            this.selectedProviderTypes = [];      
          }
        },
    }
  }
  </script>
  
<style>
.container {
  margin-top: 20px;
}

.date-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.wide-multiselect {
  width: 100%;
}

.date-input {
  margin-right: 10px;
}

.error-message {
  color: red;
}

.progress-container {
  margin-top: 20px;
}

.multiselect-container {
  max-height: 200px; /* Set the maximum height */
  overflow-y: auto; /* Enable vertical scrolling */
  border: 1px solid #ccc; /* Optional: Add a border for better visibility */
  padding: 10px; /* Optional: Add padding for better spacing */
}

.progress-container2 {
  margin-top: 20px;
}

.button-container {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.progress-bar-container {
  margin-top: 20px;
}
</style>
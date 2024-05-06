<template>
    <div>
        <h1>CIU Reports</h1>
        <p>
            This is the Clinical Information Update Reports page.
        </p>
    </div>
    <div class="container">
      <div class="report-creation">
      <input type="date" v-model="startDate" min="2023-07-01" class="date-input">
      <input type="date" v-model="endDate" min="2023-07-01" class="date-input">
      <b-button @click="createReports" variant="primary">Create Reports</b-button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <div class="progress-container">
        <p>{{ progress1.step }}</p>
        <progress :value="progress1.current" :max="progress1.total"></progress>
        <p>{{ progress1.current }} / {{ progress1.total }}</p>
      </div>
 
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
</template>
  
  <script>
  import axios from 'axios'
  //import config from '/config.json'; // adjust the path according to your file structure
   
  export default {
    data() {
      let now = new Date();
      let endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
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
        errorMessage: ''
      }
    },
    async created() {
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
            const reportRequest = {
                action: 'createReports',
                startDate: this.startDate,
                endDate: this.endDate
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
    }
  }
  </script>
  
  <!-- ... -->
  <style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center-start;
}

.multiselect-container, .progress-container2 {
  max-height: 50vh;
  max-width: 50vw;
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
}

.progress-bar-container {
  margin-left: 20px; /* Adjust this value as needed */
}
.button-container {
  display: flex;
  justify-content: space-between; /* Or use 'space-around' */
}
</style>
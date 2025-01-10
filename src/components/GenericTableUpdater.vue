<template>
  <div class="container">
    <div class="tree-view-wrapper">
      <h2>{{ tableConfig.displayName || tableConfig.tableName }}</h2>
        <div class="search-container">
        <input
            type="text"
            v-model="searchQuery"
            :placeholder="`Search ${tableConfig.displayName || tableConfig.tableName}`"
          class="search-input"
        />
        <button @click="clearSearch" class="btn btn-secondary clear-button">
          Clear Search
        </button>
      </div>
      <div class="tree-view-container">
        <ul>
          <li
            v-for="item in filteredItems"
            :key="item[tableConfig.idField]"
            @click="confirmNavigation(item)"
            :class="{ selected: item[tableConfig.idField] === selectedItemID }"
          >
            {{ item[tableConfig.displayField] }}
          </li>
        </ul>
      </div>
      <div class="button-group">
        <button @click="createNewItem" class="btn btn-primary new-button">
          New
        </button>
        <button @click="deleteItem" class="btn btn-danger delete-button">
          Delete
        </button>
      </div>
    </div>
    <div class="form-container-wrapper">
      <h1>Update {{ tableConfig.displayName || tableConfig.tableName }}</h1>
      <div class="form-container">
        <form @submit.prevent="updateItem" class="form-grid">
          <div v-for="field in tableConfig.fields" :key="field.name" class="form-group">
            <label :for="field.name" class="form-label">{{ field.label }}</label>
            <div class="form-input">
              <input
                v-if="field.type !== 'textarea'"
                :type="field.type"
                class="form-control"
                :id="field.name"
                v-model="item[field.name]"
                :maxlength="field.maxlength"
                :readonly="field.readonly"
                :step="field.type === 'number' ? 'any' : null"
                @input="handleInputChange(field.name)"
                />
              <textarea
                v-else
                class="form-control"
                :id="field.name"
                v-model="item[field.name]"
                @input="handleInputChange(field.name)"
                />
              </div>
            </div>
          </form>
        </div>
      <button @click="updateItem" class="btn btn-primary update-button">
        Update {{ tableConfig.displayName || tableConfig.tableName }}
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    tableConfig: {
      type: Object,
      required: true,
      default: () => ({
        tableName: '',
        displayName: '',
        idField: 'ID',
        displayField: 'Name',
        apiBaseUrl: 'http://localhost:8000',
        fields: [],
      }),
    },
    initialData: {
        type: Array,
        default: () => []
    }
  },
  data() {
    return {
      items: this.initialData || [],
      item: {},
      selectedItemID: null,
      currentFiscalYear: this.getCurrentFiscalYear(),
      currentYear: this.getCurrentYear(),
      searchQuery: '',
      formChanged: false,
      pendingItem: null,
    };
  },
    computed: {
        filteredItems() {
            return this.items.filter((item) =>
                Object.values(item).some(value =>
                    typeof value === 'string' && value.toLowerCase().includes(this.searchQuery.toLowerCase())
                )
            )
      },
    },
    async created() {
        if(this.initialData.length > 0){
            this.items = this.initialData;
            this.selectItem(this.items[0]);
        }
        else{
            this.fetchData();
        }
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
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        if (currentMonth >= 7) {
            return currentYear + 1;
        } else {
            return currentYear;
        }
    },
    getCurrentYear() {
        const currentDate = new Date();
        return currentDate.getFullYear();
    },
    async fetchData() {
        try {
            const response = await axios.get(
                `${this.tableConfig.apiBaseUrl}/${this.tableConfig.tableName}`,
                {
                    params: {
                        current_year: this.currentYear,
                    },
                }
            );
            console.log(`Fetched from ProviderNew component ${this.tableConfig.tableName}:`, response.data);
            this.items = response.data;
            console.log(`Fetched Items ${this.tableConfig.tableName}:`, this.items);
            if (this.items.length > 0) {
                this.selectItem(this.items[0]);
            }
        } catch (error) {
            console.error(`Error fetching ${this.tableConfig.tableName}:`, error);
        }
    },
      selectItem(item) {
        this.item = { ...item };
        this.selectedItemID = item[this.tableConfig.idField];
        this.formChanged = false; // Reset form changed flag
      },
      createNewItem() {
            this.item = {};
            for (const field of this.tableConfig.fields) {
              this.item[field.name] = field.defaultValue ?? '';
            }
            // Set FiscalYear field to the current fiscal year
            const fiscalYearField = this.tableConfig.fields.find(field => field.name === 'FiscalYear');
            if (fiscalYearField) {
              this.item[fiscalYearField.name] = this.getCurrentFiscalYear();
            }
            this.selectedItemID = null;
            this.formChanged = false;
        console.log(`New ${this.tableConfig.tableName} created:`, this.item);
      },
      async updateItem() {
          try {
              for (const field of this.tableConfig.fields) {
                  if (field.type === 'number' && this.item[field.name] !== null) {
                      this.item[field.name] = parseFloat(this.item[field.name]).toFixed(1);
                  }
              }

              if (!this.item[this.tableConfig.idField]) { // Create new item if ID field is null
                  this.item.LastUpdate = new Date().toISOString();
                  const response = await axios.post(
                      `${this.tableConfig.apiBaseUrl}/${this.tableConfig.tableName}-update/`,
                      this.item
                  );
                  console.log(`New ${this.tableConfig.tableName} created/updated:`, response.data);
              }
              else {
                  this.item.LastUpdate = new Date().toISOString();
                  const response = await axios.post(
                      `${this.tableConfig.apiBaseUrl}/${this.tableConfig.tableName}-update/`,
                      this.item
                  );
                  console.log(`${this.tableConfig.tableName} updated:`, response.data);
              }
              this.clearSearch();
              this.fetchData(); // Refresh the list
              this.formChanged = false;
          } catch (error) {
              console.error(`Error updating ${this.tableConfig.tableName}:`, error);
          }
    },
    async deleteItem() {
          if (
        confirm(`Are you sure you want to delete this ${this.tableConfig.displayName || this.tableConfig.tableName}?`)
      ) {
        try {
          const response = await axios.delete(
            `${this.tableConfig.apiBaseUrl}/${this.tableConfig.tableName}-delete/${this.item[this.tableConfig.idField]}`
          );
          console.log(`${this.tableConfig.tableName} deleted:`, response.data);
          this.fetchData(); // Refresh the list
        } catch (error) {
          console.error(`Error deleting ${this.tableConfig.tableName}:`, error);
        }
      }
    },
      clearSearch() {
        this.searchQuery = '';
      },
      formatToUpperCase(fieldName) {
          if (typeof this.item[fieldName] === 'string') {
            this.item[fieldName] = this.item[fieldName].toUpperCase();
        }
      },
      handleInputChange(fieldName) {
        this.formChanged = true;
        console.log('Field changed:', fieldName);
          if (this.tableConfig.fields.find((f) => f.name === fieldName)?.toUpperCase)
          {
              this.formatToUpperCase(fieldName)
          }
      },
      beforeUnloadHandler(event) {
        console.log('beforeUnloadHandler called');
          if (this.formChanged) {
              const message = 'You have unsaved changes. Are you sure you want to leave?';
              event.returnValue = message; // Standard for most browsers
              return message; // For some older browsers
        } else {
              console.log('No changes detected in beforeUnloadHandler');
              return undefined;
        }
    },
      confirmNavigation(item) {
          if (this.formChanged) {
              this.pendingItem = item;
              if (
                  confirm(
                      'You have unsaved changes. Do you want to discard them and navigate away?'
                  )
            ) {
                  this.navigateToItem();
            }
        } else {
            this.selectItem(item);
          }
    },
      navigateToItem() {
        if (this.pendingItem) {
          this.selectItem(this.pendingItem);
          this.pendingItem = null;
        }
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
  gap: 20px;
  height: 100vh;
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
  flex: 1;
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
  height: 100%;
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
  gap: 10px;
}

.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
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

.form-control {
  width: 100%;
}

.button-group {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
}

.new-button {
    margin-top: 0;
}

.delete-button {
    margin-top: 0;
}
</style>
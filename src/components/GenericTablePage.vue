<template>
  <div class="container">
    <div class="tree-view-wrapper">
      <h2>{{ title }}</h2>
      <div class="search-container">
        <input type="text" v-model="searchQuery" :placeholder="'Search ' + title" class="search-input" />
        <button @click="clearSearch" class="btn btn-secondary clear-button">Clear Search</button>
      </div>
      <div class="tree-view-container">
        <ul>
          <li v-for="item in filteredItems" :key="item.id" @click="confirmNavigation(item)" :class="{ selected: item.id === selectedItemId }">
            {{ item.name }}
          </li>
        </ul>
      </div>
      <div class="button-group">
        <button @click="createNewItem" class="btn btn-primary new-button">New</button>
        <button @click="deleteItem" class="btn btn-danger delete-button">Delete</button>
      </div>
    </div>
    <div class="form-container-wrapper">
      <h1>{{ formTitle }}</h1>
      <div class="form-container">
        <form @submit.prevent="updateItem" class="form-grid">
          <div v-for="field in fields" :key="field.name" class="form-group">
            <label :for="field.name" class="form-label">{{ field.label }}</label>
            <div class="form-input">
              <input
                v-if="field.type !== 'textarea'"
                :type="field.type"
                class="form-control"
                :id="field.name"
                v-model="item[field.name]"
                :maxlength="field.maxlength || null"
                :readonly="field.readonly || false"
                :step="field.type === 'number' ? 'any' : null"
                @input="handleInputChange(field.name)"
              />
              <textarea
                v-else
                class="form-control"
                :id="field.name"
                v-model="item[field.name]"
                @input="handleInputChange(field.name)"
              ></textarea>
            </div>
          </div>
        </form>
      </div>
      <button @click="updateItem" class="btn btn-primary update-button">Update {{ title }}</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    apiUrl: {
      type: String,
      required: true
    },
    fields: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      items: [],
      item: {},
      selectedItemId: null,
      searchQuery: '',
      formChanged: false,
      pendingItem: null
    };
  },
  computed: {
    filteredItems() {
      return this.items.filter(item =>
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
    formTitle() {
      return this.item.id ? 'Update ' + this.title : 'Create New ' + this.title;
    }
  },
  async created() {
    this.fetchItems();
  },
  mounted() {
    console.log('Adding beforeunload event listener');
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  },
  beforeUnmount() {
    console.log('Removing beforeunload event listener');
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  },
  methods: {
    async fetchItems() {
      try {
        const response = await axios.get(this.apiUrl);
        this.items = response.data;
        if (this.items.length > 0) {
          this.selectItem(this.items[0]);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    },
    selectItem(item) {
      this.item = { ...item };
      this.selectedItemId = item.id;
      this.formChanged = false;
    },
    createNewItem() {
      this.item = {};
      this.selectedItemId = null;
      this.formChanged = false;
    },
    async updateItem() {
      try {
        const response = await axios.post(this.apiUrl, this.item);
        this.fetchItems();
        this.formChanged = false;
      } catch (error) {
        console.error('Error updating item:', error);
      }
    },
    async deleteItem() {
      if (confirm('Are you sure you want to delete this item?')) {
        try {
          const response = await axios.delete(`${this.apiUrl}/${this.item.id}`);
          this.fetchItems();
        } catch (error) {
          console.error('Error deleting item:', error);
        }
      }
    },
    clearSearch() {
      this.searchQuery = '';
    },
    handleInputChange(fieldName) {
      this.formChanged = true;
      console.log('Field changed:', fieldName);
    },
    confirmNavigation(item) {
      if (this.formChanged) {
        this.pendingItem = item;
        if (confirm('You have unsaved changes. Do you want to discard them and navigate away?')) {
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
    beforeUnloadHandler(event) {
      console.log('beforeUnloadHandler called');
      if (this.formChanged) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
      }
    }
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
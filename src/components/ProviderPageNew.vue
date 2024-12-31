<template>
  <div>
    <GenericTableUpdater :table-config="providerTableConfig" />
    <!-- <GenericTableUpdater :table-config="departmentTableConfig" /> -->
  </div>
</template>

<script>
  import GenericTableUpdater from '@/components/GenericTableUpdater.vue';

  export default {
    components: {
      GenericTableUpdater,
    },
    data() {
      return {
        providerTableConfig: {
          tableName: 'providers',
          displayName: 'Providers',
          idField: 'ID',
          displayField: 'ProviderNM',
          apiBaseUrl: 'http://localhost:8000',
            fields: [
            { name: 'ProviderID', label: 'Provider ID', type: 'text', maxlength: 7, toUpperCase: true },
            { name: 'ProviderNM', label: 'Provider Name', type: 'text', toUpperCase: true },
            { name: 'PrimaryDepartmentID', label: 'Primary Department ID', type: 'text', toUpperCase: true },
            { name: 'DepartmentNM', label: 'Department Name', type: 'text', toUpperCase: true },
            { name: 'ProviderTypeNM', label: 'Provider Type Name', type: 'text', toUpperCase: true },
            { name: 'ProviderTypeDSC', label: 'Provider Type Description', type: 'text', toUpperCase: true },
            { name: 'DoctorDegreeNM', label: 'Doctor Degree Name', type: 'text', toUpperCase: true },
            { name: 'ProviderCategory', label: 'Provider Category', type: 'text', toUpperCase: true },
            { name: 'DivisionNM', label: 'Division Name', type: 'text', toUpperCase: true },
            { name: 'Subspecialty', label: 'Sub Specialty', type: 'text', toUpperCase: true },
            { name: 'DepartmentLevel', label: 'Department Level', type: 'text' , toUpperCase: true},
            { name: 'ExpectedHours', label: 'Expected Hours', type: 'number', defaultValue: 1472.0 },
            { name: 'ExpectedNew', label: 'Expected New', type: 'number', defaultValue: 0 },
            { name: 'ExpectedFU', label: 'Expected Follow-Up', type: 'number', defaultValue: 0 },
            { name: 'ExpectedRVU', label: 'Expected RVU', type: 'number', defaultValue: 3700.0 },
            { name: 'AmbulatoryFTE', label: 'Ambulatory FTE', type: 'number', defaultValue: 1.0 },
            { name: 'cFTE', label: 'Clinical FTE', type: 'number', defaultValue: 1.0 },
            { name: 'FiscalYear', label: 'Fiscal Year', type: 'number', readonly: true },
            { name: 'FMLACompHours', label: 'FMLA Comp Hours', type: 'number', defaultValue: 0.0 },
            { name: 'Active', label: 'Active', type: 'number', defaultValue: 1 },
          ],
        },
        departmentTableConfig: {
          tableName: 'departments',
          displayName: 'Departments',
          idField: 'DepartmentID',
          displayField: 'DepartmentNM',
          apiBaseUrl: 'http://localhost:8000',
            fields: [
            { name: 'DepartmentID', label: 'Department ID', type: 'text', maxlength: 4, toUpperCase: true},
            { name: 'DepartmentNM', label: 'Department Name', type: 'text', toUpperCase: true},
            { name: 'DepartmentDSC', label: 'Description', type: 'textarea', toUpperCase: true}
            ]
        }
      };
    },
  };
</script>
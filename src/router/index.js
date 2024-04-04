import { createRouter, createWebHistory } from 'vue-router'
import CIUReports from '@/components/CIUReports.vue'
import CIUMaintenance from '@/components/CIUMaintenance.vue'
import HomeView from '@/views/HomeView.vue'
import DOMDashboard from '@/components/DOMDashboard.vue'
import CIUDashboard from '@/components/CIUDashboard.vue'
import FillRateDashboard from '@/components/FillRateDashboard.vue'
import ProviderTimeReport from '@/components/ProviderTimeReport.vue'


const routes = [
  { path: '/dom-dashboard', name: 'DOMDashboard', component: DOMDashboard },
  { path: '/ciu-reports', name: 'CIUReports', component: CIUReports },
  { path: '/ciu-maintenance', name: 'CIUMaintenance', component: CIUMaintenance },
  { path: '/home', name: 'Home', component: HomeView },
  { path: '/ciu-dashboard', name: 'CIUDashboard', component: CIUDashboard },
  { path: '/fill-rate-dashboard', name: 'FillRateDashboard', component: FillRateDashboard },
  { path: '/provider-time-report', name: 'ProviderTimeReport', component: ProviderTimeReport }
  // other routes... 
]


const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
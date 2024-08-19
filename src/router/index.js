import { createRouter, createWebHistory } from 'vue-router'
import CIUReports from '@/components/CIUReports.vue'
import CIUMaintenance from '@/components/CIUMaintenance.vue'
import HomeView from '@/views/HomeView.vue'
import DOMDashboard from '@/components/DOMDashboard.vue'
import CIUDashboard from '@/components/CIUDashboard.vue'
import FillRateDashboard from '@/components/FillRateDashboard.vue'
import APPTimeReport from '@/components/APPTiimeReport.vue'
import ClinicFillDashboard from '@/components/ClinicFillDashboard' // Import the new component
import SummaryDashboard from '@/components/SummaryDashboard.vue'
import OOSDashboard from '@/components/OOSDashboard.vue'
import BudgetToActual from '@/components/BudgetToActual.vue'
import NeuroPsychHours from '@/components/NeuroPsychHours.vue'
import BlockReport from '@/components/BlockReport.vue'

const routes = [
  { path: '/dom-dashboard', name: 'DOMDashboard', component: DOMDashboard },
  { path: '/ciu-reports', name: 'CIUReports', component: CIUReports },
  { path: '/ciu-maintenance', name: 'CIUMaintenance', component: CIUMaintenance },
  { path: '/home', name: 'Home', component: HomeView },
  { path: '/ciu-dashboard', name: 'CIUDashboard', component: CIUDashboard },
  { path: '/fill-rate-dashboard', name: 'FillRateDashboard', component: FillRateDashboard },
  { path: '/clinic-fill-dashboard', name: 'ClinicFillDashboard', component: ClinicFillDashboard }, // Add the new route
  { path: '/app-time-report', name: 'APPTimeReport', component: APPTimeReport },
  { path: '/summary-dashboard', name: 'SummaryDashboard', component: SummaryDashboard },
  { path: '/oos-dashboard', name: 'OOSDashboard', component: OOSDashboard },
  { path: '/budget-to-actual', name: 'BudgetToActual', component: BudgetToActual },
  { path: '/neuropsych-hours', name: 'NeuroPsychHours', component: NeuroPsychHours },
  { path: '/get_block_data', name: 'BlockReport', component: BlockReport },
  { path: '/', redirect: '/home' }  
  // other routes... 
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
import { createRouter, createWebHistory } from 'vue-router'
import CIUReports from '@/components/CIUReports.vue'
import CIUMaintenance from '@/components/CIUMaintenance.vue'
import HomeView from '@/views/HomeView.vue'
import DOMDashboard from '@/components/DOMDashboard.vue'
import CIUDashboard from '@/components/CIUDashboard.vue'
import FillRateDashboard from '@/components/FillRateDashboard.vue'
import APPTimeReport from '@/components/APPTimeReport.vue'
import ClinicFillDashboard from '@/components/ClinicFillDashboard' // Import the new component
import SummaryDashboard from '@/components/SummaryDashboard.vue'
import OOSDashboard from '@/components/OOSDashboard.vue'
import ActualToBudget from '@/components/ActualToBudget.vue'
import NeuroPsychHours from '@/components/NeuroPsychHours.vue'
import BlockReport from '@/components/BlockReport.vue'
import DOWVisitsDashboard from '@/components/DOWVisitsDashboard.vue'
import OOSCompesation from '@/components/OOSCompesation.vue'
import UserLogin from '@/components/UserLogin.vue' // Import the new component
//import ProviderPage from '@/components/ProviderPage.vue'
import ProviderPageNew from '@/components/ProviderPageNew.vue'
import PayPeriodUploader from '@/components/PayPeriodUploader.vue'


const routes = [
  { path: '/dom-dashboard', name: 'DOMDashboard', component: DOMDashboard },
  { path: '/ciu-reports', name: 'CIUReports', component: CIUReports },
  { path: '/ciu-maintenance', name: 'CIUMaintenance', component: CIUMaintenance },
  { path: '/provider-page', name: 'ProviderPageNew', component: ProviderPageNew },
  { path: '/pay-period-uploader', name: 'PayPeriodUploader', component: PayPeriodUploader },
  { path: '/home', name: 'Home', component: HomeView },
  { path: '/ciu-dashboard', name: 'CIUDashboard', component: CIUDashboard },
  { path: '/fill-rate-dashboard', name: 'FillRateDashboard', component: FillRateDashboard },
  { path: '/clinic-fill-dashboard', name: 'ClinicFillDashboard', component: ClinicFillDashboard }, // Add the new route
  { path: '/app-time-report', name: 'APPTimeReport', component: APPTimeReport },
  { path: '/summary-dashboard', name: 'SummaryDashboard', component: SummaryDashboard },
  { path: '/oos-dashboard', name: 'OOSDashboard', component: OOSDashboard },
  { path: '/actual-to-budget', name: 'ActualToBudget', component: ActualToBudget },
  { path: '/neuropsych-hours', name: 'NeuroPsychHours', component: NeuroPsychHours },
  { path: '/get_block_data', name: 'BlockReport', component: BlockReport },
  { path: '/dow-visits-dashboard', name: 'DOWVisitsDashboard', component: DOWVisitsDashboard },
  { path: '/oos-compensation', name: 'OOSCompensation', component: OOSCompesation },
  { path: '/login', name: 'Login', component: UserLogin }, // Add the new route

  { path: '/', redirect: '/home' }  
  // other routes... 
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const fromComponent = from.matched.find(record => record.name === 'ProviderPageNew')?.components.default;
  console.log("fromComponent in router:",fromComponent);
  if (from.meta.requiresSave && fromComponent?.data().formChanged) {
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

export default router
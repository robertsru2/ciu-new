import { createRouter, createWebHistory } from 'vue-router'
import MenuPage from '@/components/MenuPage' // adjust the path according to your file structure
import CIUReports from '@/components/CIUReports.vue'

const routes = [
  {
    path: '/menu',
    name: 'Menu',
    component: MenuPage
  },
  {
    path: '/ciu-reports',
    name: 'CIUReports',
    component: CIUReports
  }
  // other routes...
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
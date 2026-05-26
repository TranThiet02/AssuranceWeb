import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/UsersPage"));
const AccessLogsPage = lazy(() => import("./pages/admin/AccessLogsPage"));
const ProfilePage = lazy(() => import("./pages/admin/ProfilePage"));
const PackagesPage = lazy(() => import("./pages/assurance/Packagespage"))
const CategoriesPage = lazy(() => import("./pages/assurance/Categoriespage"))
const CustomersPage = lazy(() => import("././pages/customer/Customerspage"))
const ContractsPage = lazy(() => import("././pages/customer/Contractspage"))

const StaffDashboardPage = lazy(() => import("./pages/staff/Staffdashboardpage"))
const MyCustomersPage = lazy(() => import("./pages/staff/Mycustomers"))
const SchedulesPage = lazy(() => import("./pages/staff/Schedulespage"))
const StaffContractsPage = lazy(() => import("./pages/staff/Staffcontractspage"))
const StaffProfilePage = lazy(() => import("./pages/staff/Staffprofilepage"))

const CustomerDashboardPage = lazy(() => import("./pages/customer/Customerdashboardpage"))
const CustomerPackagesPage = lazy(() => import("./pages/customer/Customerpackagespage"))
const CustomerContractsPage = lazy(() => import("./pages/customer/Customercontractspage"))
const CustomerSchedulesPage = lazy(() => import("./pages/customer/Customerschedulespage"))
const CustomerProfilePage = lazy(() => import("./pages/customer/Customerprofilepage"))
const CustomerAnalyticsPage = lazy(() => import("./pages/customer/Customeranalyticspage"))
const StaffAnalyticsPage = lazy(() => import("./pages/staff/Staffanalyticspage"))
const StaffManagementPage = lazy(() => import("./pages/staff/Staffmanagementpage"))
const AdminAnalyticsPage = lazy(() => import("./pages/admin/Adminanalyticspage"))
const KnowledgeBasePage = lazy(() => import("./pages/chatbot/Knowledgebasepage"))
const ChatbotPage = lazy(() => import("./pages/chatbot/Chatbotpage"))

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route element={<ProtectedRoute roles={["admin"]} />}>
             <Route path="/admin/dashboard" element={<AdminAnalyticsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/knowledge" element={<KnowledgeBasePage />} />
              <Route path="/admin/staff" element={<StaffManagementPage />} />
              <Route path="/admin/packages" element={<PackagesPage />} />
              <Route path="/admin/categories" element={<CategoriesPage />} />
              <Route path="/admin/access-logs" element={<AccessLogsPage />} />
              <Route path="/admin/profile" element={<ProfilePage />} />
              <Route path="/admin/customers" element={<CustomersPage />} />
              <Route path="/admin/contracts" element={<ContractsPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={["staff"]} />}>
              <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
              <Route path="/staff/analytics" element={<StaffAnalyticsPage />} />
              <Route path="/staff/customers" element={<MyCustomersPage />} />
              <Route path="/staff/schedules" element={<SchedulesPage />} />
              <Route path="/staff/contracts" element={<StaffContractsPage />} />
              <Route path="/staff/profile" element={<StaffProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute roles={["customer"]} />}>
              <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/customer/analytics" element={<CustomerAnalyticsPage />} />
              <Route path="/customer/chatbot" element={<ChatbotPage />} />
              <Route path="/customer/packages" element={<CustomerPackagesPage />} />
              <Route path="/customer/contracts" element={<CustomerContractsPage />} />
              <Route path="/customer/schedules" element={<CustomerSchedulesPage />} />
              <Route path="/customer/profile" element={<CustomerProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
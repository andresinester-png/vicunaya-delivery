import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext.jsx';
import UpdateBanner from './components/UpdateBanner.jsx';
import CustomerGate from './components/CustomerGate.jsx';
import MainLayout from './components/MainLayout.jsx';
import AdminGuard from './components/AdminGuard.jsx';
// import DriverGuard from './components/DriverGuard.jsx'; // Remises: deshabilitado temporalmente
import RestaurantGuard from './components/RestaurantGuard.jsx';
import TurnosPanelGuard from './components/TurnosPanelGuard.jsx';

import Welcome from './pages/Welcome.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import Home from './pages/Home.jsx';
// import RemisesPage from './pages/Remises.jsx'; // Remises: deshabilitado temporalmente
import Orders from './pages/Orders.jsx';
import Profile from './pages/Profile.jsx';
import Addresses from './pages/Addresses.jsx';

import Rotiserias from './pages/Rotiserias.jsx';
import Encomiendas from './pages/Encomiendas.jsx';
import Anunciate from './pages/Anunciate.jsx';
import Sorteo from './pages/Sorteo.jsx';
import BannerDetail from './pages/BannerDetail.jsx';
import Restaurant from './pages/Restaurant.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import Turnos from './pages/Turnos.jsx';
import TurnoNegocio from './pages/TurnoNegocio.jsx';
import MisTurnos from './pages/MisTurnos.jsx';

// Remises: deshabilitado temporalmente
// import RequestTrip from './pages/RequestTrip.jsx';
// import TripTracking from './pages/TripTracking.jsx';
// import RateDriver from './pages/RateDriver.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminRestaurants from './pages/admin/AdminRestaurants.jsx';
import MenuManagement from './pages/admin/MenuManagement.jsx';
import Earnings from './pages/admin/Earnings.jsx';
import Banners from './pages/admin/Banners.jsx';

import RestaurantLogin from './pages/restaurant/RestaurantLogin.jsx';
import RestaurantDashboard from './pages/restaurant/Dashboard.jsx';
import RestaurantMenu from './pages/restaurant/Menu.jsx';
import RestaurantProfile from './pages/restaurant/Profile.jsx';
import RestaurantEarnings from './pages/restaurant/Earnings.jsx';

import TurnosPanelLogin from './pages/turnos-panel/TurnosPanelLogin.jsx';
import TurnosPanelAgenda from './pages/turnos-panel/Agenda.jsx';
import TurnosPanelServicios from './pages/turnos-panel/Servicios.jsx';
import TurnosPanelProfesionales from './pages/turnos-panel/Profesionales.jsx';
import TurnosPanelHorarios from './pages/turnos-panel/Horarios.jsx';
import TurnosPanelMiNegocio from './pages/turnos-panel/MiNegocio.jsx';

// Remises: deshabilitado temporalmente
// import DriverLogin from './pages/driver/DriverLogin.jsx';
// import DriverDashboard from './pages/driver/DriverDashboard.jsx';
import GoogleCallback from './pages/GoogleCallback.jsx';
import Legal from './pages/Legal.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px' },
            success: { iconTheme: { primary: '#e31b23', secondary: '#fff' } },
          }}
        />
        <UpdateBanner />
        <Routes>
        {/* ── Registro / login / perfil ── */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />

        <Route element={<CustomerGate />}>
          {/* ── Tabs principales con bottom nav ── */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            {/* <Route path="/remises" element={<RemisesPage />} /> */}
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/turnos"     element={<Turnos />}     />
            <Route path="/mis-turnos" element={<MisTurnos />}  />
            <Route path="/perfil"     element={<Profile />}    />
            <Route path="/direcciones" element={<Addresses />} />
          </Route>

          {/* ── Secciones principales (sin bottom nav) ── */}
          <Route path="/rotiserias" element={<Rotiserias />} />
          <Route path="/encomiendas" element={<Encomiendas />} />
          <Route path="/anunciate" element={<Anunciate />} />
          <Route path="/sorteo" element={<Sorteo />} />
          <Route path="/banner/:id" element={<BannerDetail />} />
          <Route path="/restaurant/:id" element={<Restaurant />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido/:id" element={<OrderTracking />} />
          <Route path="/turnos/:id" element={<TurnoNegocio />} />
          <Route path="/legal" element={<Legal />} />

          {/* ── Flujo remises (sin bottom nav) — deshabilitado temporalmente ──
          <Route path="/remis/pedir" element={<RequestTrip />} />
          <Route path="/remis/viaje/:id" element={<TripTracking />} />
          <Route path="/remis/viaje/:id/calificar" element={<RateDriver />} />
          ── */}
        </Route>

        {/* ── Panel admin (sidebar propio) ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard />}>
          <Route index element={<Navigate to="/admin/pedidos" replace />} />
          <Route path="pedidos"      element={<AdminDashboard />} />
          <Route path="restaurantes" element={<AdminRestaurants />} />
          <Route path="menu"         element={<MenuManagement />} />
          <Route path="ganancias"    element={<Earnings />} />
          <Route path="banners"      element={<Banners />} />
        </Route>

        {/* ── Panel restaurante ── */}
        <Route path="/restaurant/login" element={<RestaurantLogin />} />
        <Route path="/restaurant/panel" element={<RestaurantGuard />}>
          <Route index element={<Navigate to="/restaurant/panel/pedidos" replace />} />
          <Route path="pedidos"   element={<RestaurantDashboard />} />
          <Route path="menu"      element={<RestaurantMenu />} />
          <Route path="perfil"    element={<RestaurantProfile />} />
          <Route path="ganancias" element={<RestaurantEarnings />} />
        </Route>

        {/* ── Panel conductor — deshabilitado temporalmente ──
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver" element={<DriverGuard />}>
          <Route index element={<DriverDashboard />} />
        </Route>
        ── */}

        {/* ── Panel de turnos (dueños de negocio) ── */}
        <Route path="/turnos/panel/login" element={<TurnosPanelLogin />} />
        <Route path="/turnos/panel" element={<TurnosPanelGuard />}>
          <Route index element={<Navigate to="/turnos/panel/agenda" replace />} />
          <Route path="agenda"        element={<TurnosPanelAgenda />} />
          <Route path="servicios"     element={<TurnosPanelServicios />} />
          <Route path="profesionales" element={<TurnosPanelProfesionales />} />
          <Route path="horarios"      element={<TurnosPanelHorarios />} />
          <Route path="mi-negocio"    element={<TurnosPanelMiNegocio />} />
        </Route>

        {/* ── OAuth callback ── */}
        <Route path="/auth/callback" element={<GoogleCallback />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

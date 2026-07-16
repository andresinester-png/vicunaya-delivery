import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext.jsx';
import { GeoProvider } from './context/GeoContext.jsx';
import GeoGate from './components/GeoGate.jsx';
import UpdateBanner from './components/UpdateBanner.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import CustomerGate from './components/CustomerGate.jsx';
import MainLayout from './components/MainLayout.jsx';
import AdminGuard from './components/AdminGuard.jsx';
import RestaurantGuard from './components/RestaurantGuard.jsx';
import TurnosPanelGuard from './components/TurnosPanelGuard.jsx';
import EncomiendaPanelGuard from './components/EncomiendaPanelGuard.jsx';

// ── Customer pages ──────────────────────────────────────────────────────────
const Welcome         = lazy(() => import('./pages/Welcome.jsx'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile.jsx'));
const Hub             = lazy(() => import('./pages/Hub.jsx'));
const Home            = lazy(() => import('./pages/Home.jsx'));
const Orders          = lazy(() => import('./pages/Orders.jsx'));
const Profile         = lazy(() => import('./pages/Profile.jsx'));
const Addresses       = lazy(() => import('./pages/Addresses.jsx'));
const Encomiendas     = lazy(() => import('./pages/Encomiendas.jsx'));
const Anunciate       = lazy(() => import('./pages/Anunciate.jsx'));
const Sorteo          = lazy(() => import('./pages/Sorteo.jsx'));
const BannerDetail    = lazy(() => import('./pages/BannerDetail.jsx'));
const Restaurant      = lazy(() => import('./pages/Restaurant.jsx'));
const Cart            = lazy(() => import('./pages/Cart.jsx'));
const Checkout        = lazy(() => import('./pages/Checkout.jsx'));
const OrderTracking   = lazy(() => import('./pages/OrderTracking.jsx'));
const Turnos          = lazy(() => import('./pages/Turnos.jsx'));
const TurnoNegocio    = lazy(() => import('./pages/TurnoNegocio.jsx'));
const MisTurnos       = lazy(() => import('./pages/MisTurnos.jsx'));
const Legal           = lazy(() => import('./pages/Legal.jsx'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword.jsx'));
const GoogleCallback  = lazy(() => import('./pages/GoogleCallback.jsx'));
const Remises         = lazy(() => import('./pages/Remises.jsx'));
const Gas             = lazy(() => import('./pages/Gas.jsx'));

// ── Admin panel ─────────────────────────────────────────────────────────────
const AdminLogin          = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminRestaurants    = lazy(() => import('./pages/admin/AdminRestaurants.jsx'));
const AdminTurnosNegocios = lazy(() => import('./pages/admin/AdminTurnosNegocios.jsx'));
const MenuManagement      = lazy(() => import('./pages/admin/MenuManagement.jsx'));
const Earnings            = lazy(() => import('./pages/admin/Earnings.jsx'));
const Banners             = lazy(() => import('./pages/admin/Banners.jsx'));

// ── Restaurant panel ────────────────────────────────────────────────────────
const RestaurantLogin     = lazy(() => import('./pages/restaurant/RestaurantLogin.jsx'));
const RestaurantDashboard = lazy(() => import('./pages/restaurant/Dashboard.jsx'));
const RestaurantMenu      = lazy(() => import('./pages/restaurant/Menu.jsx'));
const RestaurantProfile   = lazy(() => import('./pages/restaurant/Profile.jsx'));
const RestaurantEarnings  = lazy(() => import('./pages/restaurant/Earnings.jsx'));

// ── Encomiendas panel ───────────────────────────────────────────────────────
const EncomiendaPanelLogin = lazy(() => import('./pages/encomiendas-panel/EncomiendaPanelLogin.jsx'));
const EncomiendaPanel      = lazy(() => import('./pages/encomiendas-panel/EncomiendaPanel.jsx'));
const EncomiendaConfig     = lazy(() => import('./pages/encomiendas-panel/EncomiendaConfig.jsx'));

// ── Turnos panel ────────────────────────────────────────────────────────────
const TurnosPanelLogin         = lazy(() => import('./pages/turnos-panel/TurnosPanelLogin.jsx'));
const TurnosPanelAgenda        = lazy(() => import('./pages/turnos-panel/Agenda.jsx'));
const TurnosPanelServicios     = lazy(() => import('./pages/turnos-panel/Servicios.jsx'));
const TurnosPanelProfesionales = lazy(() => import('./pages/turnos-panel/Profesionales.jsx'));
const TurnosPanelHorarios      = lazy(() => import('./pages/turnos-panel/Horarios.jsx'));
const TurnosPanelMiNegocio     = lazy(() => import('./pages/turnos-panel/MiNegocio.jsx'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GeoProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px' },
            success: { iconTheme: { primary: '#006a61', secondary: '#fff' } },
          }}
        />
        <SplashScreen />
        <UpdateBanner />
        <Suspense fallback={null}>
        <Routes>
        {/* ── Registro / login / perfil ── */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />

        <Route element={<CustomerGate />}>
          {/* ── Hub de servicios (pantalla de entrada) ── */}
          <Route path="/" element={<Hub />} />

          {/* ── Tabs con bottom nav — no restringidas por geo ── */}
          <Route element={<MainLayout />}>
            <Route path="/pedidos"     element={<Orders />}    />
            <Route path="/perfil"      element={<Profile />}   />
            <Route path="/direcciones" element={<Addresses />} />

            {/* Delivery, Turnos y Remises → geo-restringidas */}
            <Route element={<GeoGate />}>
              <Route path="/delivery"   element={<Home />}     />
              <Route path="/turnos"     element={<Turnos />}   />
              <Route path="/mis-turnos" element={<MisTurnos />} />
              <Route path="/remises"    element={<Remises />}  />
            </Route>
          </Route>

          {/* ── Secciones geo-restringidas (sin bottom nav) ── */}
          <Route element={<GeoGate />}>
            <Route path="/restaurant/:id" element={<Restaurant />} />
            <Route path="/carrito"        element={<Cart />}        />
            <Route path="/checkout"       element={<Checkout />}    />
            <Route path="/pedido/:id"     element={<OrderTracking />} />
            <Route path="/turnos/:id"     element={<TurnoNegocio />} />
          </Route>

          {/* ── Siempre accesibles ── */}
          <Route path="/gas"         element={<Gas />}         />
          <Route path="/encomiendas" element={<Encomiendas />} />
          <Route path="/anunciate"   element={<Anunciate />}   />
          <Route path="/sorteo"      element={<Sorteo />}      />
          <Route path="/banner/:id"  element={<BannerDetail />} />
          <Route path="/legal"       element={<Legal />}       />
        </Route>

        {/* ── Panel admin (sidebar propio) ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard />}>
          <Route index element={<Navigate to="/admin/pedidos" replace />} />
          <Route path="pedidos"          element={<AdminDashboard />} />
          <Route path="restaurantes"     element={<AdminRestaurants />} />
          <Route path="turnos-negocios"  element={<AdminTurnosNegocios />} />
          <Route path="menu"             element={<MenuManagement />} />
          <Route path="ganancias"        element={<Earnings />} />
          <Route path="banners"          element={<Banners />} />
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

        {/* ── Panel encomiendas ── */}
        <Route path="/encomiendas/panel/login" element={<EncomiendaPanelLogin />} />
        <Route element={<EncomiendaPanelGuard />}>
          <Route path="/encomiendas/panel" element={<EncomiendaPanel />} />
          <Route path="/encomiendas/panel/configuracion" element={<EncomiendaConfig />} />
        </Route>

        {/* ── OAuth callback + auth ── */}
        <Route path="/auth/callback"  element={<GoogleCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </GeoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

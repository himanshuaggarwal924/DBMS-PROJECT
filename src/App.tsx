import './App.css';
import { Switch, Route, Router as WouterRouter } from "wouter";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

import Home from "@/pages/Home";
import Search from "@/pages/Search";
import City from "@/pages/City";
import PlaceDetail from "@/pages/PlaceDetail";
import Favorites from "@/pages/Favourites";
import Trips from "@/pages/Trips";
import Analytics from "@/pages/Analytics";
import Login from "@/pages/Login";
import Register from "@/pages/Regsiter";
import ForgotPassword from "@/pages/ForgotPassword";
import Itinerary from "@/pages/Itinerary";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/search" component={Search} />
                <Route path="/city/:id" component={City} />
                <Route path="/place/:id" component={PlaceDetail} />
                <Route path="/favorites" component={Favorites} />
                <Route path="/trips" component={Trips} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/itinerary" component={Itinerary} />
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/forgot-password" component={ForgotPassword} />
              </Switch>
            </main>
            <Footer />
          </div>
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

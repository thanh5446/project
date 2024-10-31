import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeaderComponent from "./components/HeaderComponent/HeaderComponent";
import DefaultComponent from "./components/DefaultComponent/DefaultComponent";
import { routes } from "./routes";
import ChatWidget from "./pages/ChatWidget/ChatWidget";


function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [user, setUser] = useState(null);
  const [searchedProducts, setSearchedProducts] = useState([]); // State to store searched products
  const [isOpen, setIsOpen] = useState(false); // State for chat widget visibility

  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsOpen(false); // Close chat widget on logout
    sessionStorage.clear(); // Clear all session storage on logout
  };

  const updateSearchedProducts = (products) => {
    setSearchedProducts(products); // Update searched products
  };

  return (
    <Router>
      <HeaderComponent
        showLoginModal={showLoginModal}
        showRegisterModal={showRegisterModal}
        setShowLoginModal={setShowLoginModal}
        setShowRegisterModal={setShowRegisterModal}
        closeModals={closeModals}
        openLoginModal={openLoginModal}
        openRegisterModal={openRegisterModal}
        user={user}
        setUser={setUser}
        updateSearchedProducts={updateSearchedProducts}
        setIsOpen={setIsOpen} // Pass setIsOpen to HeaderComponent
        handleLogout={handleLogout} // Pass handleLogout to HeaderComponent
      />

      <ChatWidget user={user} openLoginModal={openLoginModal} setIsOpen={setIsOpen} />

      <Routes>
        {routes.map((route) => {
          const Page = route.page;
          const Layout = route.isShowHeader ? DefaultComponent : React.Fragment;

          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Layout>
                  <Page
                    user={user}
                    setUser={setUser}
                    openLoginModal={openLoginModal}
                    searchedProducts={searchedProducts}
                    handleLogout={handleLogout} // Pass logout handler if needed
                  />
                </Layout>
              }
            />
          );
        })}
      </Routes>
    </Router>
  );
}

export default App;

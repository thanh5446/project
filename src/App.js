import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeaderComponent from "./components/HeaderComponent/HeaderComponent";
import DefaultComponent from "./components/DefaultComponent/DefaultComponent";
import { routes } from "./routes";

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [user, setUser] = useState(null); // This is the user state and its setter

  // Open login modal
  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  };

  // Open register modal
  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  };

  // Close all modals
  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  // If the user is logged in, set the user state
  const handleLoginSuccess = (username) => {
    setUser({ username });  // Set the user state when login is successful
    closeModals();          // Close the modal after successful login
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
        setUser={setUser} // Pass the setUser function down as a prop
        handleLoginSuccess={handleLoginSuccess}
      />

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
                <Page user={user} setUser={setUser} openLoginModal={openLoginModal} />
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

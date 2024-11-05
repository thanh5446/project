import React from "react";

import Footer from "../../pages/Footer/Footer";

const DefaultComponent = ({ children }) => {
  return (
    <div id="root">
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default DefaultComponent;

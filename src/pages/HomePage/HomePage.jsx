import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ChatWidget from "../ChatWidget/ChatWidget";
import "./home.css";

const HomePage = ({ user, openLoginModal }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 11; // Limit of products per page

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4000/api/products?page=${page}&limit=${limit}`
        );
        setProducts(response.data.products);
        setTopProducts(response.data.products);
        setTotalPages(Math.ceil(response.data.totalCount / limit));
      } catch (error) {
        console.error("Failed to fetch products", error);
        setProducts([]);
        setTopProducts([]);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/categories"
        );
        setCategories(response.data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, [page]); // Fetch products whenever the page changes

  const handleFilter = (event) => {
    const selectedFilter = event.target.value;
    setFilter(selectedFilter);

    if (!Array.isArray(products)) {
      console.error("Products is not iterable:", products);
      return;
    }

    let sortedProducts;
    if (selectedFilter === "topAsc") {
      sortedProducts = [...products].sort((a, b) => a.money - b.money);
      setTopProducts(sortedProducts.slice(0, 12));
    } else if (selectedFilter === "topDesc") {
      sortedProducts = [...products].sort((a, b) => b.money - a.money);
      setTopProducts(sortedProducts.slice(0, 12));
    } else {
      setTopProducts(products);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  const handleAddToCart = async (product) => {
    if (!user) {
      openLoginModal(); // Trigger the login modal if the user is not logged in
    } else {
      try {
        const token = sessionStorage.getItem("token");

        const response = await axios.post(
          "http://localhost:4000/api/cart",
          {
            id_product: product._id,
            quantity: 1, // You can customize quantity or make it a parameter
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Product added to cart:", response.data);
        alert("Product added to cart successfully!");
        setError(""); // Clear any previous errors
      } catch (error) {
        console.error("Failed to add product to cart:", error);
        alert("Not enough products."); // Set error message
      }
    }
  };
  return (
    <div className="container mt-4">
      <div className="row">
        {/* Left Column: Category List */}
        <div className="col-md-3">
          <div className="category-list p-3 bg-light rounded shadow-sm">
            <h5 className="category-title text-center mb-3 fw-bold">
              Category
            </h5>
            <ul className="list-group">
              {categories.map((category) => (
                <li
                  className="d-flex align-items-center border-0 mb-2"
                  key={category._id}
                >
                  <Link
                    to={`/category?id=${category._id}`}
                    className="text-decoration-none"
                  >
                    <i
                      className={`bi ${category.icon} me-2`}
                      style={{ color: category.color }}
                    ></i>
                    <span>{category.category_name}</span>
                  </Link>
                </li>
              ))}
              <li className="d-flex align-items-center border-0 mb-2">
                <Link to={`/`} className="text-decoration-none">
                  <i className={`bi me-2`}></i>
                  <span>All</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Carousel and Product Cards */}
        <div className="col-md-9">
          <div
            id="carouselExampleIndicators"
            className="carousel slide"
            data-bs-ride="carousel"
          >
            <div className="carousel-indicators">
              <button
                type="button"
                data-bs-target="#carouselExampleIndicators"
                data-bs-slide-to="0"
                className="active"
                aria-current="true"
                aria-label="Slide 1"
              ></button>
              <button
                type="button"
                data-bs-target="#carouselExampleIndicators"
                data-bs-slide-to="1"
                aria-label="Slide 2"
              ></button>
            </div>
            <div className="carousel-inner">
              <div className="carousel-item active">
                <div className="d-flex justify-content-between">
                  <img
                    src="https://cdn2.fptshop.com.vn/unsafe/640x0/filters:quality(100)/H2_614x212_58a281730e.png"
                    className="d-block w-50 custom-image"
                    alt="Slide 1"
                  />
                  <img
                    src="https://cdn2.fptshop.com.vn/unsafe/640x0/filters:quality(100)/H2_614x212_e987312907.png"
                    className="d-block w-50 custom-image"
                    alt="Slide 2"
                  />
                </div>
              </div>
              <div className="carousel-item">
                <div className="d-flex justify-content-between">
                  <img
                    src="https://cdn2.fptshop.com.vn/unsafe/640x0/filters:quality(100)/H2_614x212_58a281730e.png"
                    className="d-block w-50 custom-image"
                    alt="Slide 3"
                  />
                  <img
                    src="https://cdn2.fptshop.com.vn/unsafe/640x0/filters:quality(100)/H2_614x212_58a281730e.png"
                    className="d-block w-50 custom-image"
                    alt="Slide 4"
                  />
                </div>
              </div>
            </div>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#carouselExampleIndicators"
              data-bs-slide="prev"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#carouselExampleIndicators"
              data-bs-slide="next"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>

          {/* Icon Menu */}
          <div
            id="carouselExampleIndicators2"
            className="carousel slide"
            data-bs-ride="carousel"
          >
            <div className="carousel-inner">
              <div className="carousel-item active">
                <div className="icon-menu d-flex  align-items-center flex-wrap mt-4">
                  {categories.slice(0, 7).map((category) => (
                    <Link
                      to={`/category?id=${category._id}`}
                      key={category._id}
                      className="text-center"
                    >
                      <div className="icon-item">
                        <i
                          className={`bi ${category.icon} me-2`}
                          style={{ fontSize: "2rem", color: category.color }}
                        ></i>
                        <div
                          className="icon-text"
                          style={{ color: category.color }}
                        >
                          {category.category_name}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="carousel-item">
                <div className="icon-menu d-flex align-items-center flex-wrap mt-4">
                  {categories.slice(7, 13).map((category) => (
                    <Link
                      to={`/category?id=${category._id}`}
                      key={category._id}
                      className="text-center"
                    >
                      <div className="icon-item">
                        <i
                          className={`bi ${category.icon} me-2`}
                          style={{ fontSize: "2rem", color: category.color }}
                        ></i>
                        <div
                          className="icon-text"
                          style={{ color: category.color }}
                        >
                          {category.category_name}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Previous Button */}
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#carouselExampleIndicators2"
              data-bs-slide="prev"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Previous</span>
            </button>

            {/* Next Button */}
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#carouselExampleIndicators2"
              data-bs-slide="next"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>

          {/* Product Cards */}
          <div className="container mt-4">
            <div className="mb-4">
              <select
                id="filterOptions"
                value={filter}
                onChange={handleFilter}
                style={{
                  backgroundColor: "#f8f9fa", // Light background
                  border: "1px solid #ced4da", // Border color
                  borderRadius: "0.25rem", // Rounded corners
                  padding: "0.375rem 1.75rem 0.375rem 0.75rem", // Padding adjustments
                  appearance: "none", // Remove default arrow
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-chevron-down' viewBox='0 0 16 16'><path fill-rule='evenodd' d='M1.5 4.5a.5.5 0 0 1 .8-.6L8 8.793l5.7-4.9a.5.5 0 1 1 .6.8l-6 5.25a.5.5 0 0 1-.6 0l-6-5.25a.5.5 0 0 1-.1-.6z'/></svg>\")", // Custom arrow
                  backgroundRepeat: "no-repeat", // Don't repeat the background
                  backgroundPosition: "right 0.75rem center", // Position the arrow
                  backgroundSize: "1rem", // Size of the arrow
                  cursor: "pointer", // Change cursor to pointer on hover
                }}
              >
                <option value="">Select...</option>
                <option value="topAsc">Lowest Price</option>
                <option value="topDesc">Highest Price</option>
              </select>
            </div>

            <div className="row">
              {/* Use topProducts if there is a filter, otherwise use products */}
              {(filter ? topProducts : products).length > 0 ? (
                (filter ? topProducts : products).map((product) => (
                  <div className="col-md-3 mb-4" key={product._id}>
                    {" "}
                    <div className="card product-card">
                      <Link to={`/detailsProduct?id=${product._id}`}>
                        {" "}
                        <img
                          src={`http://localhost:4000/${product.image}`} // Path to image from server
                          className="card-img-top"
                          alt={product.product_name}
                        />{" "}
                      </Link>
                      <Link
                        style={{ textDecoration: "none" }}
                        to={`/detailsProduct?id=${product._id}`}
                      >
                        {" "}
                        <div className="card-body">
                          <div>
                            <Link
                              to={`/detailsProduct?id=${product._id}`}
                              style={{ textDecoration: "none" }}
                            >
                              <h6 className="card-title" style={{ margin: 0 }}>
                                {product.product_name}
                              </h6>
                            </Link>
                          </div>

                          <div className="d-flex">
                            <div className="rating text-warning me-2">
                              ★★★★★
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0 8px",
                            }}
                          >
                            <span>Quantity: {product.quantity}</span>
                            <i
                              className="bi bi-cart icon-spacing"
                              style={{ color: "orange" }}
                            ></i>
                          </div>

                          <p className="product-price mt-2">
                            {product.money.toLocaleString("vi-VN")} VND
                          </p>

                          {product.discount_amount > 0 && (
                            <>
                              <p className="old-price">
                                {(
                                  product.money /
                                  (1 - product.discount_amount / 100)
                                ).toFixed(0)}{" "}
                                VND
                              </p>
                              <p className="text-danger">
                                -{product.discount_amount}%
                              </p>
                            </>
                          )}
                        </div>
                      </Link>
                      <div className="add-cart-button">
                        <button
                          className="btn btn-orange"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>{" "}
                  </div>
                ))
              ) : (
                <div className="col-12 text-center">Không có sản phẩm nào.</div>
              )}
            </div>
          </div>
        </div>
        <div className="pagination-controls d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  className="page-link"
                  aria-label="Previous"
                >
                  <span aria-hidden="true">&laquo;</span>
                </button>
              </li>
              <li className="page-item disabled">
                <span className="page-link">
                  Page {page} of {totalPages}
                </span>
              </li>
              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
                <button
                  onClick={() => handlePageChange(page + 1)}
                  className="page-link"
                  aria-label="Next"
                >
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <ChatWidget user={user} openLoginModal={openLoginModal} />
    </div>
  );
};

export default HomePage;

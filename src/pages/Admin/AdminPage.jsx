import axios from "axios";
import { Modal } from "bootstrap";
import React, { useEffect, useState } from "react";
import ChatWidgetAdmin from "../ChatAdmin/ChatWidgetAdmin";
import "./admin.css";

const AdminPage = ({ user, openLoginModal }) => {
  const [activeSection, setActiveSection] = useState("user");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [icons, setIcons] = useState([]);
  const [selectedIcon, setSelectedIcon] = useState("");
  const [categoryColor, setCategoryColor] = useState("#ffffff"); // Default color
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  useEffect(() => {
    const fetchIcons = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/icons");
        setIcons(response.data);
      } catch (error) {
        console.error("Error fetching icons:", error);
      }
    };

    fetchIcons();
  }, []);
  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/categories"
        );
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch users when activeSection changes to 'user'
  useEffect(() => {
    if (activeSection === "user") {
      axios
        .get("http://localhost:4000/api/users")
        .then((response) => setUsers(response.data))
        .catch((error) => console.error("Error fetching users:", error));
    }
  }, [activeSection]);

  // Fetch products when activeSection changes to 'product'
  useEffect(() => {
    if (activeSection === "product") {
      axios
        .get("http://localhost:4000/api/productAll")
        .then((response) => setProducts(response.data))
        .catch((error) => console.error("Error fetching products:", error));
    }
  }, [activeSection]);

  // Fetch orders when activeSection changes to 'order'
  useEffect(() => {
    if (activeSection === "order") {
      const fetchOrders = async () => {
        try {
          const token = sessionStorage.getItem("token");
          const response = await axios.get(
            "http://localhost:4000/api/ordersAll",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setOrders(response.data);
        } catch (error) {
          console.error(
            "Error fetching orders:",
            error.response ? error.response.data : error.message
          );
        }
      };

      fetchOrders();
    }
  }, [activeSection]);

  // Handle section switching
  const handleSectionSwitch = (section) => {
    setActiveSection(section);
  };

  // Handle product editing
  const handleEditProduct = (product) => {
    setEditProduct(product);
    const editModal = new Modal(document.getElementById("editProductModal"));
    editModal.show();
  };

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`http://localhost:4000/api/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts(products.filter((product) => product._id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  };

  // Handle saving categories
  const handleSaveCategory = async (e) => {
    e.preventDefault(); // Prevent the default form submission

    const categoryData = {
      category_name: editCategory?.category_name || "", // Use the current category name if editing
      icon: selectedIcon, // Selected icon
      color: editCategory?.color || categoryColor, // Use color from editCategory or the current state
    };

    try {
      const token = sessionStorage.getItem("token"); // Get the token from sessionStorage

      // If editing an existing category, make a PUT request
      if (editCategory?._id) {
        const response = await axios.put(
          `http://localhost:4000/api/categories/${editCategory._id}`,
          categoryData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Set the Authorization header
            },
          }
        );

        // Update the categories state with the edited category
        setCategories(
          categories.map((cat) =>
            cat._id === editCategory._id ? response.data : cat
          )
        );
        alert("Category updated successfully!");
      } else {
        // If creating a new category, make a POST request
        const response = await axios.post(
          "http://localhost:4000/api/categories",
          categoryData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Set the Authorization header
            },
          }
        );

        // Add the new category to the categories state
        setCategories([...categories, response.data]);
      }

      closeCategoryModal(); // Close the modal
      setEditCategory(null); // Reset the edit category
      setSelectedIcon(""); // Reset the selected icon
      setCategoryColor("#ffffff"); // Reset color to default
    } catch (error) {
      console.error("Error saving category:", error);
      alert("An error occurred while saving the category.");
    }
  };

  // Handle opening the edit modal for a category
  const handleEditCategory = (category) => {
    setEditCategory({
      ...category, // Spread existing category properties
      color: category.color, // Ensure color is also set
    });
    setCategoryColor(category.color); // Set the color state for the color input
    setSelectedIcon(category.icon); // Set the selected icon
    const editModal = new Modal(document.getElementById("editCategoryModal"));
    editModal.show();
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("product_name", event.target.productName.value);
    formData.append("money", event.target.productPrice.value);
    formData.append("discount_amount", event.target.discountAmount.value);
    formData.append("quantity", event.target.productQuantity.value);
    formData.append("image", event.target.productImage.files[0]);
    formData.append("id_category", selectedCategory);

    try {
      const response = await axios.post(
        "http://localhost:4000/api/products",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      setProducts([...products, response.data]);
      const modalElement = document.getElementById("addProductModal");
      const modalInstance = Modal.getInstance(modalElement);
      modalInstance.hide();
      event.target.reset();
    } catch (error) {
      console.error("Error adding product:", error);
      setError(
        error.response
          ? error.response.data.message
          : "An error occurred while adding the product."
      );
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:4000/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        setUsers(users.filter((user) => user._id !== userId));
        alert("User has been successfully deleted!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred while deleting the user.");
      }
    }
  };

  // Handle saving changes to product
  const handleSaveChanges = async (event) => {
    event.preventDefault();

    if (!editProduct.id_category) {
      setError("Please select a category for the product.");
      return;
    }

    const formData = new FormData();
    formData.append("product_name", editProduct.product_name);
    formData.append("money", editProduct.money);
    formData.append("discount_amount", editProduct.discount_amount);
    formData.append("quantity", editProduct.quantity);
    formData.append("id_category", editProduct.id_category);

    if (editProduct.image) {
      formData.append("image", editProduct.image);
    }

    try {
      const response = await axios.put(
        `http://localhost:4000/api/products/${editProduct._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      setProducts(
        products.map((p) => (p._id === response.data._id ? response.data : p))
      );
      const modal = Modal.getInstance(
        document.getElementById("editProductModal")
      );
      modal.hide();
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  // Handle opening category modal
  const openCategoryModal = (category) => {
    setEditCategory(category);
    setIsCategoryModalOpen(true);
  };

  // Handle category submission
  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    const { categoryName, icon, color } = event.target.elements;

    const categoryData = {
      category_name: categoryName.value,
      icon: icon.value,
      color: color.value,
    };

    try {
      if (editCategory) {
        await axios.put(
          `http://localhost:4000/api/categories/${editCategory._id}`,
          categoryData
        );
        setCategories(
          categories.map((cat) =>
            cat._id === editCategory._id ? { ...cat, ...categoryData } : cat
          )
        );
      } else {
        const response = await axios.post(
          "http://localhost:4000/api/categories",
          categoryData
        );
        setCategories([...categories, response.data]);
      }
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      setError(
        error.response
          ? error.response.data.message
          : "An error occurred while saving the category."
      );
    }
  };
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value); // Update selected category
  };
  // Handle closing category modal
  const closeCategoryModal = () => {
    setEditCategory(null);
    setIsCategoryModalOpen(false);
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryId) => {
    try {
      const token = sessionStorage.getItem("token"); // Retrieve the JWT token
      const response = await axios.delete(
        `http://localhost:4000/api/categories/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Set the Authorization header
          },
        }
      );

      // Update the state to remove the deleted category
      setCategories(
        categories.filter((category) => category._id !== categoryId)
      );
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("An error occurred while deleting the category.");
    }
  };

  // Handle the addition of a new category
  const handleAddCategory = async (event) => {
    event.preventDefault();
    const categoryData = {
      category_name: event.target.categoryName.value,
      icon: selectedIcon,
      color: categoryColor,
    };

    const token = sessionStorage.getItem("token"); // Get the token from sessionStorage

    try {
      const response = await axios.post(
        "http://localhost:4000/api/categories",
        categoryData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the headers
          },
        }
      );

      event.target.reset();
      setSelectedIcon(""); // Reset selected icon
      setCategoryColor("#ffffff"); // Reset color to default
      setCategories([...categories, response.data]);
    } catch (error) {
      console.error("Error adding category:", error);
      alert("An error occurred while adding the category.");
    }
  };

  // Filter icons based on search term
  const filteredIcons = icons.filter((icon) =>
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-md-2 sidebar">
          <div className="sidebar-content">
            <a
              href="#"
              className="list-group-item list-group-item-action mb-4"
              onClick={() => handleSectionSwitch("user")}
            >
              <i className="bi bi-person"></i> Users
            </a>
            <a
              href="#"
              className="list-group-item list-group-item-action mb-4"
              onClick={() => handleSectionSwitch("product")}
            >
              <i className="bi bi-box"></i> Products
            </a>
            <a
              href="#"
              className="list-group-item list-group-item-action mb-4"
              onClick={() => handleSectionSwitch("order")}
            >
              <i className="bi bi-cart"></i> Orders
            </a>
            <a
              href="#"
              className="list-group-item list-group-item-action"
              onClick={() => handleSectionSwitch("category")}
            >
              <i className="bi bi-list"></i> Categories
            </a>
          </div>
        </div>

        <div className="col-md-1 divider"></div>

        {/* User Management Section */}
        {activeSection === "user" && (
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>User Information</h3>
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" />
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Admin</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>{user.username}</td>
                      <td>{user.email || "N/A"}</td>
                      <td>{user.address || "N/A"}</td>
                      <td>
                        {user.id_role?.user_role === "Admin" ? "TRUE" : "FALSE"}
                      </td>
                      <td>{user.numberphone || "N/A"}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Management Section */}
        {activeSection === "product" && (
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Product Management</h3>
              <button
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#addProductModal"
              >
                Add
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" />
                    </th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Image</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>{product.product_name}</td>
                      <td>{product.money}</td>
                      <td>{product.quantity}</td>
                      <td>
                        <img
                          src={`http://localhost:4000/${product.image.replace(/\\/g, '/')}`}
                          alt={product.product_name}
                          style={{ width: "100px", height: "auto" }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm me-2"
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Management Section */}
        {activeSection === "order" && (
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Manage Orders</h3>
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" />
                    </th>
                    <th>Purchaser Name</th>
                    <th>Phone Number</th>
                    <th>Address</th>
                    <th>Product Name</th>
                    <th>Shipping Fee</th>
                    <th>Order ID</th>
                    <th>Total Amount</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => {
                      const orderDate = new Date(order.paymentDate);
                      const formattedDate = orderDate.toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false, // Hiển thị giờ theo định dạng 24 giờ
                      });

                      return (
                        <tr key={order.orderId}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td>{order.username}</td>
                          <td>{order.phone}</td>
                          <td>{order.address}</td>
                          <td>{order.productName}</td>
                          <td>{order.shippingFee || "0"} VND</td>
                          <td>{order.orderId}</td>
                          <td>{order.price.toLocaleString("vi-VN")} VND</td>
                          <td>{formattedDate}</td>{" "}
                          {/* Sử dụng formattedDate ở đây */}
                          <td>{order.status}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">
                        There are no orders recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Management Section */}
        {activeSection === "category" && (
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Category Management</h3>
              <button
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#addCategoryModal"
              >
                Add
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" />
                    </th>
                    <th>Category Name</th>
                    <th>Icon</th>
                    <th>Color</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>{category.category_name}</td>
                      <td>
                        <i
                          className={`bi ${category.icon}`}
                          style={{ fontSize: "2rem", color: category.color }}
                        ></i>
                      </td>
                      <td>
                        <div
                          style={{
                            backgroundColor: category.color,
                            width: "30px",
                            height: "30px",
                            borderRadius: "5px",
                          }}
                        ></div>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm me-2"
                          onClick={() => handleDeleteCategory(category._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <div
        className="modal fade"
        id="addProductModal"
        tabIndex="-1"
        aria-labelledby="addProductModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addProductModalLabel">
                Add New Product
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form id="addProductForm" onSubmit={handleAddProduct}>
                <div className="mb-3">
                  <label htmlFor="productName" className="form-label">
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="productName"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productPrice" className="form-label">
                    Price
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="productPrice"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="discountAmount" className="form-label">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="discountAmount"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productQuantity" className="form-label">
                    Quantity
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="productQuantity"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productImage" className="form-label">
                    Image
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="productImage"
                    accept="image/*"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="productCategory" className="form-label">
                    Category
                  </label>
                  <select
                    className="form-control"
                    id="productCategory"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                {" "}
                Close
              </button>
              <button
                type="submit"
                form="addProductForm"
                className="btn btn-primary"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal fade"
        id="addCategoryModal"
        tabIndex="-1"
        aria-labelledby="addCategoryModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addCategoryModalLabel">
                Add New Category
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form id="addCategoryForm" onSubmit={handleAddCategory}>
                <div className="mb-3">
                  <label htmlFor="categoryName" className="form-label">
                    Category Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="categoryName"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="categoryIcon" className="form-label">
                    Icon
                  </label>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search for an icon"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)} // Update search term state
                    />
                  </div>
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                      type="button"
                      id="dropdownMenuButton"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i
                        className={`bi ${selectedIcon || "bi-plus"}`}
                        style={{ marginRight: "5px", fontSize: "1.5rem" }}
                      ></i>
                      {selectedIcon ? selectedIcon : "Select Icon"}
                    </button>
                    <ul
                      className="dropdown-menu"
                      aria-labelledby="dropdownMenuButton"
                    >
                      {filteredIcons.map((icon) => (
                        <li
                          key={icon}
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => setSelectedIcon(icon)}
                        >
                          <i
                            className={`bi ${icon}`}
                            style={{ marginRight: "10px", fontSize: "1.5rem" }}
                          ></i>
                          {icon}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="categoryColor" className="form-label">
                    Color
                  </label>
                  <input
                    type="color"
                    className="form-control"
                    id="categoryColor"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)} // Ensure you have state to handle this
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                {" "}
                Close
              </button>
              <button
                type="submit"
                form="addCategoryForm"
                className="btn btn-primary"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      <div
        className="modal fade"
        id="editProductModal"
        tabIndex="-1"
        aria-labelledby="editProductModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editProductModalLabel">
                Edit Product
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form id="editProductForm" onSubmit={handleSaveChanges}>
                <div className="mb-3">
                  <label htmlFor="editProductName" className="form-label">
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="editProductName"
                    value={editProduct?.product_name || ""}
                    required
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        product_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductPrice" className="form-label">
                    Price
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="editProductPrice"
                    value={editProduct?.money || ""}
                    required
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, money: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductQuantity" className="form-label">
                    Quantity
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="editProductQuantity"
                    value={editProduct?.quantity || ""}
                    required
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        quantity: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductCategory" className="form-label">
                    Category
                  </label>
                  <select
                    className="form-control"
                    id="editProductCategory"
                    value={editProduct?.id_category || ""}
                    required
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        id_category: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="editProductImage" className="form-label">
                    Image
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="editProductImage"
                    accept="image/*"
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        image: e.target.files[0],
                      })
                    }
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                {" "}
                Close
              </button>
              <button
                type="submit"
                form="editProductForm"
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      <div
        className="modal fade"
        id="editCategoryModal"
        tabIndex="-1"
        aria-labelledby="editCategoryModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editCategoryModalLabel">
                Edit Category
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form id="editCategoryForm" onSubmit={handleSaveCategory}>
                <div className="mb-3">
                  <label htmlFor="editCategoryName" className="form-label">
                    Category Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="editCategoryName"
                    value={editCategory?.category_name || ""}
                    required
                    onChange={(e) =>
                      setEditCategory({
                        ...editCategory,
                        category_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="categoryIcon" className="form-label">
                    Icon
                  </label>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search for an icon"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)} // Update search term state
                    />
                  </div>
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                      type="button"
                      id="dropdownMenuButton"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i
                        className={`bi ${selectedIcon || "bi-plus"}`}
                        style={{ marginRight: "5px", fontSize: "1.5rem" }}
                      ></i>
                      {selectedIcon ? selectedIcon : "Select Icon"}
                    </button>
                    <ul
                      className="dropdown-menu"
                      aria-labelledby="dropdownMenuButton"
                    >
                      {icons
                        .filter((icon) =>
                          icon.toLowerCase().includes(searchTerm.toLowerCase())
                        ) // Filter based on search term
                        .map((icon) => (
                          <li
                            key={icon}
                            className="dropdown-item d-flex align-items-center"
                            onClick={() => setSelectedIcon(icon)}
                          >
                            <i
                              className={`bi ${icon}`}
                              style={{
                                marginRight: "10px",
                                fontSize: "1.5rem",
                              }}
                            ></i>
                            {icon}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="editCategoryColor" className="form-label">
                    Color
                  </label>
                  <input
                    type="color"
                    className="form-control"
                    id="editCategoryColor"
                    value={editCategory?.color} // Use editCategory.color directly
                    onChange={(e) =>
                      setEditCategory({
                        ...editCategory,
                        color: e.target.value,
                      })
                    } // Update state with selected color
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                {" "}
                Close
              </button>
              <button
                type="submit"
                form="editCategoryForm"
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChatWidgetAdmin user={user} openLoginModal={openLoginModal} />
    </div>
  );
};

export default AdminPage;

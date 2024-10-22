import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal } from 'bootstrap';
import './admin.css';

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState('user');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [categories, setCategories] = useState([]); // State để lưu trữ danh sách danh mục
  const [selectedCategory, setSelectedCategory] = useState(""); // State để lưu trữ danh mục đã chọn
  const [error, setError] = useState(""); // State để lưu trữ thông báo lỗi
  // Fetch Users
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categories');
        setCategories(response.data); // Lưu trữ danh mục trong state
      } catch (error) {
        console.error("Error fetching categories", error);
      }
    };

    fetchCategories(); // Gọi hàm để lấy danh mục
  }, []);

  // Xử lý sự kiện khi người dùng chọn danh mục
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value); // Cập nhật danh mục đã chọn
  };
  useEffect(() => {
    if (activeSection === 'user') {
      axios.get('http://localhost:5000/api/users')
        .then(response => setUsers(response.data))
        .catch(error => console.error('Error fetching users:', error));
    }
  }, [activeSection]);

  // Fetch Products
  useEffect(() => {
    if (activeSection === 'product') {
      axios.get('http://localhost:5000/api/products')
        .then(response => setProducts(response.data))
        .catch(error => console.error('Error fetching products:', error));
    }
  }, [activeSection]);

  // Fetch Orders
  
  useEffect(() => {
    if (activeSection === 'order') {
      const fetchOrders = async () => {
        try {
          const token = sessionStorage.getItem('token'); // Get the token from sessionStorage

          const response = await axios.get('http://localhost:5000/api/ordersAll', {
            headers: {
              'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
            },
          });
          
          setOrders(response.data); // Set the fetched orders to state
        } catch (error) {
          console.error('Error fetching orders:', error.response ? error.response.data : error.message);
        }
      };

      fetchOrders(); // Call the function to fetch orders
    }
  }, [activeSection]);

  // Function to handle section switching
  const handleSectionSwitch = (section) => {
    setActiveSection(section);
  };

  // Function to handle product editing
  const handleEditProduct = (product) => {
    setEditProduct(product);
    const editModal = new Modal(document.getElementById('editProductModal'));
    editModal.show();
  };
  const handleDeleteProduct = async (productId) => {
    
      try {
        const token = sessionStorage.getItem('token'); // Get the token from sessionStorage
        await axios.delete(`http://localhost:5000/api/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        
        // Filter out the deleted product from the local state
        setProducts(products.filter(product => product._id !== productId));
        
      
      } catch (error) {
        console.error('Error deleting product:', error);
        alert("Failed to delete product.");
      
    }
  };


      
  const handleAddProduct = async (event) => {
    event.preventDefault();
  
    // Sử dụng FormData để gửi dữ liệu bao gồm cả tệp hình ảnh
    const formData = new FormData();
    formData.append('product_name', event.target.productName.value);
    formData.append('money', event.target.productPrice.value);
    formData.append('discount_amount', event.target.discountAmount.value); // Thêm trường giảm giá
    formData.append('quantity', event.target.productQuantity.value);
    formData.append('image', event.target.productImage.files[0]);  // Thêm tệp hình ảnh
    formData.append('id_category', selectedCategory);  // Thêm danh mục đã chọn
  
    try {
      // Gửi dữ liệu sản phẩm mới đến API
      const response = await axios.post('http://localhost:5000/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
  
      // Thêm sản phẩm mới vào danh sách sản phẩm trong state
      setProducts([...products, response.data]);
  
      // Đóng modal
      const modalElement = document.getElementById('addProductModal');
      const modalInstance = Modal.getInstance(modalElement);
      modalInstance.hide();
      
      // Có thể reset form nếu cần thiết
      event.target.reset();
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error.response ? error.response.data.message : 'An error occurred while adding the product.');
    }
  };
  
  
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này không?")) {
      try {
        // Gọi API xóa người dùng
        await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          },
        });
  
        // Xoá người dùng khỏi danh sách state
        setUsers(users.filter(user => user._id !== userId));
  
        alert("Người dùng đã được xóa thành công!");
      } catch (error) {
        console.error('Error deleting user:', error);
        alert("Đã xảy ra lỗi khi xóa người dùng.");
      }
    }
  };

  // Handle saving changes to product
  const handleSaveChanges = async (event) => {
    event.preventDefault();

    // Kiểm tra xem id_category có phải là chuỗi rỗng không
    if (!editProduct.id_category) {
        setError('Vui lòng chọn danh mục cho sản phẩm.'); // Thêm thông báo lỗi
        
        return;
    }

    const formData = new FormData();
    formData.append('product_name', editProduct.product_name);
    formData.append('money', editProduct.money);
    formData.append('discount_amount', editProduct.discount_amount);
    formData.append('quantity', editProduct.quantity);
    formData.append('id_category', editProduct.id_category);  // Sử dụng giá trị đã chọn

    if (editProduct.image) {
        formData.append('image', editProduct.image);  // Chỉ thêm nếu có hình ảnh mới
    }

    try {
        const response = await axios.put(`http://localhost:5000/api/products/${editProduct._id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            },
        });

        setProducts(products.map(p => (p._id === response.data._id ? response.data : p)));

        const modal = Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();
    } catch (error) {
        console.error('Error saving changes:', error);
    }
};

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-md-2 sidebar">
          <div className="sidebar-content">
            <a href="#" className="list-group-item list-group-item-action mb-4" onClick={() => handleSectionSwitch('user')}>
              <i className="bi bi-person"></i> Người dùng
            </a>
            <a href="#" className="list-group-item list-group-item-action mb-4" onClick={() => handleSectionSwitch('product')}>
              <i className="bi bi-box"></i> Sản phẩm
            </a>
            <a href="#" className="list-group-item list-group-item-action" onClick={() => handleSectionSwitch('order')}>
              <i className="bi bi-cart"></i> Đơn hàng
            </a>
          </div>
        </div>

        <div className="col-md-1 divider"></div>

        {/* User Management Section */}
        {activeSection === 'user' && (
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Thông tin người dùng</h3>
             
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th><input type="checkbox" /></th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Admin</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
  {users.map(user => (
    <tr key={user._id}>
      <td><input type="checkbox" /></td>
      <td>{user.username}</td>
      <td>{user.email || 'N/A'}</td>
      <td>{user.address || 'N/A'}</td>
      {/* Check if id_role exists before accessing user_role */}
      <td>{user.id_role && user.id_role.user_role === 'Admin' ? 'TRUE' : 'FALSE'}</td>
      <td>{user.numberphone || 'N/A'}</td>
      <td>
  <button
    className="btn btn-danger btn-sm"
    onClick={() => handleDeleteUser(user._id)} // Thêm hàm xử lý xoá
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
        {activeSection === 'product' && (
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Quản lý sản phẩm</h3>
              <div className="d-flex">
                
                <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addProductModal">Thêm</button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th><input type="checkbox" /></th>
                    <th>Tên sản phẩm</th>
                    <th>Giá</th>
                    <th>Số lượng</th>
                    <th>Hình ảnh</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td><input type="checkbox" /></td>
                      <td>{product.product_name}</td>
              <td>{product.money}</td>
              <td>{product.quantity}</td>
              <td>
                <img src={`http://localhost:5000/${product.image}`} alt={product.product_name} style={{ width: '100px', height: 'auto' }} />
              </td>
                      <td>
                      <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteProduct(product._id)}>
                  <i className="bi bi-trash"></i>
                </button>
                        <button className="btn btn-warning btn-sm" onClick={() => handleEditProduct(product)}>
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
        {activeSection === 'order' && (
           <div className="col-md-9">
           <div className="d-flex justify-content-between align-items-center mb-3">
             <h3>Quản lý đơn hàng</h3>
           </div>
           <div className="table-responsive">
             <table className="table table-striped">
               <thead>
                 <tr>
                   <th><input type="checkbox" /></th>
                   <th>Tên người mua</th>
                   <th>Số điện thoại</th>
                   <th>Địa chỉ</th>
                   <th>Tên sản phẩm</th> {/* Updated to reflect product name */}
                   <th>Phí ship</th> {/* You may need to adjust this if you have shipping fee in your data */}
                   <th>Mã đơn hàng</th>
                   <th>Tổng tiền</th>
                 </tr>
               </thead>
               <tbody>
                 {orders.length > 0 ? orders.map(order => (
                   <tr key={order.orderId}> {/* Assuming orderId is unique */}
                     <td><input type="checkbox" /></td>
                     <td>{order.username}</td>
                     <td>{order.phone}</td>
                     <td>{order.address}</td>
                     <td>{order.productName}</td> {/* Added to show the product name */}
                     <td>{order.shippingFee ? order.shippingFee : '0'} VND</td> {/* Add shipping fee if available */}
                     <td>{order.orderId}</td> {/* Assuming you have the orderId in your order object */}
                     <td>{order.price.toLocaleString('vi-VN')} VND</td> {/* Format total price */}
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan="8" className="text-center">Không có đơn hàng nào</td> {/* Message when no orders are found */}
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         </div>
        )}
      </div>

      {/* Add Product Modal */}
      <div className="modal fade" id="addProductModal" tabIndex="-1" aria-labelledby="addProductModalLabel" aria-hidden="true">
      <div className="modal-dialog">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id="addProductModalLabel">Thêm sản phẩm mới</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
      {error && <div className="alert alert-danger">{error}</div>}
  <form id="addProductForm" onSubmit={handleAddProduct}>
    <div className="mb-3">
      <label htmlFor="productName" className="form-label">Tên sản phẩm</label>
      <input type="text" className="form-control" id="productName" required />
    </div>
    <div className="mb-3">
      <label htmlFor="productPrice" className="form-label">Giá</label>
      <input type="number" className="form-control" id="productPrice" required />
    </div>
    <div className="mb-3">
      <label htmlFor="discountAmount" className="form-label">Giảm giá (%)</label>
      <input type="number" className="form-control" id="discountAmount" min="0" max="100" required />
    </div>
    <div className="mb-3">
      <label htmlFor="productQuantity" className="form-label">Số lượng</label>
      <input type="number" className="form-control" id="productQuantity" required />
    </div>
    <div className="mb-3">
      <label htmlFor="productImage" className="form-label">Hình ảnh</label>
      <input type="file" className="form-control" id="productImage" accept="image/*" required />
    </div>
    <div className="mb-3">
      <label htmlFor="productCategory" className="form-label">Danh mục</label>
      <select
        className="form-control"
        id="productCategory"
        value={selectedCategory}
        onChange={handleCategoryChange}
        required
      >
        <option value="">Chọn danh mục</option>
        {categories.map(category => (
          <option key={category._id} value={category._id}>
            {category.category_name}
          </option>
        ))}
      </select>
    </div>
    
  </form>
</div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="submit" form="addProductForm" className="btn btn-primary">Thêm sản phẩm</button>
      </div>
    </div>
  </div>
</div>


      {/* Edit Product Modal */}
      <div className="modal fade" id="editProductModal" tabindex="-1" aria-labelledby="editProductModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editProductModalLabel">Chỉnh sửa sản phẩm</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
  <form id="editProductForm" onSubmit={handleSaveChanges}>
    <div className="mb-3">
      <label htmlFor="editProductName" className="form-label">Tên sản phẩm</label>
      <input
        type="text"
        className="form-control"
        id="editProductName"
        value={editProduct?.product_name || ''}
        required
        onChange={(e) => setEditProduct({ ...editProduct, product_name: e.target.value })}
      />
    </div>
    <div className="mb-3">
      <label htmlFor="editProductPrice" className="form-label">Giá</label>
      <input
        type="number"
        className="form-control"
        id="editProductPrice"
        value={editProduct?.money || ''}
        required
        onChange={(e) => setEditProduct({ ...editProduct, money: e.target.value })}
      />
    </div>
    <div className="mb-3">
      <label htmlFor="editProductQuantity" className="form-label">Số lượng</label>
      <input
        type="number"
        className="form-control"
        id="editProductQuantity"
        value={editProduct?.quantity || ''}
        required
        onChange={(e) => setEditProduct({ ...editProduct, quantity: e.target.value })}
      />
    </div>
    <div className="mb-3">
      <label htmlFor="editProductCategory" className="form-label">Danh mục</label>
      <select
        className="form-control"
        id="editProductCategory"
        value={editProduct?.id_category || ''}
        required
        onChange={(e) => setEditProduct({ ...editProduct, id_category: e.target.value })}
      >
        <option value="">Chọn danh mục</option>
        {categories.map(category => (
          <option key={category._id} value={category._id}>
            {category.category_name}
          </option>
        ))}
      </select>
    </div>
    <div className="mb-3">
      <label htmlFor="editProductImage" className="form-label">Hình ảnh</label>
      <input
        type="file"
        className="form-control"
        id="editProductImage"
        accept="image/*"
        onChange={(e) => setEditProduct({ ...editProduct, image: e.target.files[0] })}
      />
    </div>
  </form>
</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
              <button type="submit" form="editProductForm" className="btn btn-primary">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

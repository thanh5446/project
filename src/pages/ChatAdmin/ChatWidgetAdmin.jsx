import React, { useState } from 'react';
import '../Admin/admin.css';
import ChatMiniAdmin from './ChatAdmin';

const ChatWidgetAdmin = ({ user, openLoginModal }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    if (!user) {
        openLoginModal(); // Kích hoạt modal đăng nhập nếu người dùng chưa đăng nhập
    } else {
        setIsOpen(!isOpen); // Bật tắt hộp chat
    }
  };

  return (
    <div className="chat-widget-container">
      {/* Nút tròn hiển thị nút chat */}
      <div className="chat-widget-button" onClick={toggleChat}>
        <i className="bi bi-chat-left-dots-fill"></i> {/* Chat icon */}
      </div>

      {/* Hiển thị hộp chat nếu isOpen = true */}
      {isOpen && (
        <div className="chat-widget-popup">
          <ChatMiniAdmin />  
        </div>
      )}
    </div>
  );
};

export default ChatWidgetAdmin;

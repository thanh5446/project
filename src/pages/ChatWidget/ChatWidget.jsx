import React, { useState, useEffect } from 'react';
import './ChatWidget.css'; // Define styles for the widget
import { Chat } from 'react-bootstrap-icons';
import ChatMini from './chat';

const ChatWidget = ({ user, openLoginModal }) => {
  const [isOpen, setChatOpen] = useState(false);

  const toggleChat = () => {
    if (!user) {
      openLoginModal(); // Trigger the login modal if the user is not logged in
      setChatOpen(false); // Ensure the chat widget is closed
    } else {
      setChatOpen(prevIsOpen => !prevIsOpen); // Toggle the chat widget visibility
    }
  };

  // Effect to close the chat widget when the user logs out
  useEffect(() => {
    if (!user) {
      setChatOpen(false); // Close chat when user is logged out
    }
  }, [user]);

  return (
    <div className="chat-widget-container">
      {/* Floating Button */}
      <div className="chat-widget-button" onClick={toggleChat}>
        <i className="bi bi-chat-left-dots-fill"></i> {/* Chat icon */}
      </div>

      {/* Chat or Options Pop-up */}
      {isOpen && (
        <div className="chat-widget-popup">
          <ChatMini />
        </div>
      )}
    </div>
  );
};

export default ChatWidget;

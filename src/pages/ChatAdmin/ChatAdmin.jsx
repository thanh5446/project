import { useCallback, useEffect, useState } from "react";
import Talk from "talkjs";
import { Session, Inbox } from "@talkjs/react";

function ChatMiniAdmin() {
  const [admins, setAdmins] = useState([]);
  const storedUser = sessionStorage.getItem('user');
  
  // Chuyển chuỗi JSON thành đối tượng
  const user = JSON.parse(storedUser);

  useEffect(() => {
    // Lấy dữ liệu từ sessionStorage
    const storedAdmins = sessionStorage.getItem('admins');
    
    if (storedAdmins) {
      // Parse JSON string thành array hoặc object
      setAdmins(JSON.parse(storedAdmins));
    } else {
      console.log("No admins found in session storage");
    }
  }, []);

  // Đồng bộ thông tin người dùng cho TalkJS
  const syncUser = useCallback(
    () =>
      new Talk.User({
        id: user.id.toString(),
        name: user.username,
        email: user.email,
        photoUrl: "https://talkjs.com/new-web/avatar-7.jpg",
        welcomeMessage: `Hi ${user.username}!`,
        role: "default",
      }),
    [user]
  );

  return (
    <div style={chatContainerStyle}>
      <Session appId="tiZHaWL4" syncUser={syncUser}>
        <Inbox style={{ width: "100%", height: "500px" }} />
      </Session>
    </div>
  );
}

const chatContainerStyle = {
    position: "fixed",
    bottom: "200px",  // Position from the bottom
    right: "20px",   // Change to the right side of the screen
    width: "350px",  // Width of the chatbox
    height: "400px", // Height of the chatbox
    zIndex: 1000,    // Ensure it's on top of other elements
    
    backgroundColor: "white", // Background color for the chatbox
    borderRadius: "10px",     // Rounded corners
 
};

export default ChatMiniAdmin;
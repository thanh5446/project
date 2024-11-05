import { Chatbox, Session } from "@talkjs/react";
import { useCallback, useEffect, useState } from "react";
import Talk from "talkjs";

function ChatMini() {
  const [admins, setAdmins] = useState([]);

  const username = sessionStorage.getItem("username");
  const storedUser = sessionStorage.getItem("user");

  // Chuyển chuỗi JSON thành đối tượng
  const user = JSON.parse(storedUser);

  // Fetch admins and store them in session storage
  const fetchAdmins = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/admins", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      sessionStorage.setItem("admins", JSON.stringify(data));
      console.log("Admins saved to session storage:", data);
      setAdmins(data); // Update state here
    } catch (error) {
      console.error("Error fetching admins:", error.message);
    }
  };

  useEffect(() => {
    fetchAdmins(); // Gọi hàm fetchAdmins khi component được mount
  }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    const storedAdmins = sessionStorage.getItem("admins");
    if (storedAdmins) {
      setAdmins(JSON.parse(storedAdmins));
      console.log(
        "Admins loaded from session storage:",
        JSON.parse(storedAdmins)
      );
    } else {
      console.log("No admins found in session storage");
    }
  }, []); // Ensure this runs on mount

  // Bây giờ bạn có thể truy cập vào dữ liệu của user
  console.log(user);
  const syncUser = useCallback(
    () =>
      new Talk.User({
        id: user.id.toString(),
        name: user.username,
        email: user.email,
        photoUrl: "https://talkjs.com/new-web/avatar-7.jpg",
        welcomeMessage: `Hi ${username}!`,
        role: "default",
      }),
    []
  );

  const syncConversation = useCallback(
    (session) => {
      // Kiểm tra xem admins[0] có tồn tại không trước khi sử dụng _id
      if (admins.length > 0 && admins[0]._id) {
        const conversation = session.getOrCreateConversation(
          Talk.oneOnOneId(session.me, { id: admins[0]._id.toString() })
        );

        // Define the other participant in the conversation (1-on-1 chat)
        const other = new Talk.User({
          id: admins[0]._id.toString(), // Lấy _id của admin đầu tiên
          name: admins[0].username,
          email: admins[0].admin,
          photoUrl: "https://talkjs.com/new-web/avatar-8.jpg",
          welcomeMessage: "Hey, how can I help?",
          role: "default",
        });

        // Add both the current user and the other participant
        conversation.setParticipant(session.me);
        conversation.setParticipant(other);

        return conversation;
      } else {
        console.log("No admins available or missing _id");
        return null; // Trả về null nếu không có admins
      }
    },
    [admins]
  );

  return (
    <div style={chatStyle}>
      <Session appId="tiZHaWL4" syncUser={syncUser}>
        <Chatbox
          syncConversation={syncConversation}
          style={{ width: "100%", height: "100%" }}
        />
      </Session>
    </div>
  );
}

const chatStyle = {
  position: "fixed",
  bottom: "100px", // Position from the bottom
  right: "20px", // Change to the right side of the screen
  width: "350px", // Width of the chatbox
  height: "400px", // Height of the chatbox
  zIndex: 1000, // Ensure it's on top of other elements
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", // Optional shadow for a better look
  backgroundColor: "white", // Background color for the chatbox
  borderRadius: "10px", // Rounded corners
};

export default ChatMini;

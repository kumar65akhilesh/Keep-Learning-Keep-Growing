import React, { useContext } from "react";
import UserInfoContext from "../context/UserInfoContext";

export default function Comment() {
  const userInfo = useContext(UserInfoContext);
  return (
    <div>
      <p>Logged in as {userInfo.username}</p>
      {userInfo.isAdmin && <button>Edit Comment</button>}
    </div>
  );
}

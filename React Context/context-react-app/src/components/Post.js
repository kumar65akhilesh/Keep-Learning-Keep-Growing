import React from "react";
import Comment from "./Comment";
import { useContext } from "react";
import UserInfoContext from "../context/UserInfoContext";

export default function Post() {
  const userInfo = useContext(UserInfoContext);
  return (
    <div>
      {userInfo.isAdmin && <button>Delete</button>}
      <h2>Example Post</h2>
      <p>This is an exaple post content</p>
      <Comment></Comment>
    </div>
  );
}

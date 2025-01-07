<%@ page import="java.util.*" %>
<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
</head>
<body>
<form action="toDoList.jsp">
Add New Item : <input type="text" name="theItem"/>
<input type="submit" value="Submit" />
</form>
<% 
List<String> items = (List<String>) session.getAttribute("myList");
if(items == null) {
	items = new ArrayList<>();
	session.setAttribute("myList", items);
}
String theItem = request.getParameter("theItem");
if(theItem != null)
items.add(theItem);
for(String val: items) {
	out.println("<li>"+ val +"</li>");
}
%>

</body>
</html>
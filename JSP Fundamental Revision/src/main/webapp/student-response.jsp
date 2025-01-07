
<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Student confirmation</title>
</head>
<body>
The student is confirmed : <%=request.getParameter("firstName") %> <%=request.getParameter("lastName") %> 
<br/>
<br/>
Country : <%=request.getParameter("country")%>
<br/>
<br/>
Favorite language :
<% 
String[] values = request.getParameterValues("favoriteLang");
for(String val: values) {
	out.println("<li>" +val +"</li>");
}
%>
</body>
</html>
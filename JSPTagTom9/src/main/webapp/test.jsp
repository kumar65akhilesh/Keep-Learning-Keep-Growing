<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
</head>
<body>
<%
String[] cities = {"a", "b", "C"};
pageContext.setAttribute("myCity", cities);
%>
<c:set var="stuff" value="<%=new java.util.Date() %>" />
 Time at server : ${stuff}
 <c:forEach var="tepCity" items="${myCity }">
 	${tepCity } <br/>
 </c:forEach>
</body>
</html>
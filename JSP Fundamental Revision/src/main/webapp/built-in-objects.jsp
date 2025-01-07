<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Built-In Objects</title>
</head>
<body>
Request user agent: <%=request.getHeader("User-Agent") %>
<br/><br/>
Request Language: <%=request.getLocale() %>
</body>
</html>
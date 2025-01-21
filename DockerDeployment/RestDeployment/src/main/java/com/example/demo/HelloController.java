package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
	
	@GetMapping("/")
	public String greet() {
		return "Hello world from Java - Docker Deployment First Project. <br/>"
				+ "AUTHOR: Akhilesh Kumar";
	}
}

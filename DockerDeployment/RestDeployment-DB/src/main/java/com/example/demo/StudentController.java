package com.example.demo;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StudentController {
	@Autowired
	StudentRepo studentrepo;
	
	@GetMapping("/getStudents")
	public List<Student> getStudents() {
		return studentrepo.findAll();
	}
	
	@GetMapping("/addStudent")
	public void addStudent() {
		Student s = new Student();
		s.setName("Raj");
		s.setAge(25);
		studentrepo.save(s);
	}
}

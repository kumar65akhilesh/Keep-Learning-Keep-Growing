package com.example.demo;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StudentController {
	@Autowired
	StudentRepo studentrepo;
	
	@RequestMapping("/getStudents")
	public List<Student> getStudents() {
		return List.of(
				new Student(1, "Akhilesh", 21),
				new Student(2, "Bob", 22),
				new Student(3, "Charlie", 23)
				);
	}
}

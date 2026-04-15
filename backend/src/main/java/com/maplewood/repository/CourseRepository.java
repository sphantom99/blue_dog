package com.maplewood.repository;

import com.maplewood.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    @Query("SELECT c FROM Course c " +
            "LEFT JOIN FETCH c.specialization " +
            "LEFT JOIN FETCH c.prerequisite " +
            "WHERE c.gradeLevelMin <= :gradeLevel AND c.gradeLevelMax >= :gradeLevel " +
            "AND c.semesterOrder = :semesterOrder")
    List<Course> findAvailableCourses(@Param("gradeLevel") int gradeLevel,
                                      @Param("semesterOrder") int semesterOrder);

    @Query("SELECT c FROM Course c " +
            "LEFT JOIN FETCH c.specialization " +
            "LEFT JOIN FETCH c.prerequisite " +
            "WHERE c.semesterOrder = :semesterOrder")
    List<Course> findBySemesterOrder(@Param("semesterOrder") int semesterOrder);
}
